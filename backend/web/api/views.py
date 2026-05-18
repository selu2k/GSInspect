import csv
import io
import json

from django.db import IntegrityError
from django.db.models import Max, Min
from django_filters import BaseInFilter, FilterSet, NumberFilter
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import generics, permissions, status
from rest_framework.exceptions import ValidationError
from rest_framework.pagination import PageNumberPagination
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import AuditLog, Bolt, Supplier, Test, TestCurve
from .serializers import (
    AdminBoltSerializer,
    AdminTestCurveSerializer,
    AdminTestListSerializer,
    AdminTestSerializer,
    AuditLogSerializer,
    BoltPublishSerializer,
    MyTokenObtainPairSerializer,
    PublicBoltSerializer,
    PublicTestSerializer,
    SupplierSerializer,
    TestCurvePublishSerializer,
    TestPublishSerializer,
)
from .utils import calculate_stats_for_tests, group_tests_by_bolt


class HealthView(generics.GenericAPIView):
    """Health check endpoint."""

    permission_classes = [permissions.AllowAny]

    def get(self, request, *args, **kwargs):
        return Response({"status": "ok"})


class MyTokenObtainPairView(TokenObtainPairView):
    """
    JWT authentication endpoint using custom claims serializer.
    """

    serializer_class = MyTokenObtainPairSerializer


class PublicFilterOptionsView(generics.GenericAPIView):
    """Public API endpoint for filter dropdown options."""

    permission_classes = [permissions.AllowAny]

    def get(self, request, *args, **kwargs):
        suppliers = list(
            Supplier.objects.filter(bolts__is_published=True)
            .distinct()
            .order_by("name")
            .values("id", "name")
        )

        categories = list(
            Bolt.objects.filter(is_published=True)
            .order_by("category")
            .values_list("category", flat=True)
            .distinct()
        )

        facilities = list(
            Test.objects.filter(is_published=True, bolt__is_published=True)
            .order_by("facility")
            .values_list("facility", flat=True)
            .distinct()
        )

        methodologies = list(
            Test.objects.filter(is_published=True, bolt__is_published=True)
            .order_by("methodology")
            .values_list("methodology", flat=True)
            .distinct()
        )

        length_range = Bolt.objects.filter(is_published=True).aggregate(
            min=Min("length"),
            max=Max("length"),
        )

        return Response(
            {
                "suppliers": suppliers,
                "categories": categories,
                "facilities": facilities,
                "methodologies": methodologies,
                "length_range": length_range,
            }
        )


class BoltFilterSet(FilterSet):
    categories = BaseInFilter(field_name="category")
    suppliers = BaseInFilter(field_name="supplier")
    min_length = NumberFilter(field_name="length", lookup_expr="gte")
    max_length = NumberFilter(field_name="length", lookup_expr="lte")

    class Meta:
        model = Bolt
        fields = []


class BoltPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "limit"
    max_page_size = 100


class AdminPagination(PageNumberPagination):
    """Pagination for admin list endpoints."""

    page_size = 20
    page_size_query_param = "limit"
    max_page_size = 100


class PublicBoltListView(generics.ListAPIView):
    """
    Public API endpoint for published bolts with filtering and pagination.

    Query parameters:
    - categories: Comma-separated category names (e.g., M16,M20,M24)
    - suppliers: Comma-separated supplier IDs (e.g., 1,2,3)
    - min_length: Minimum bolt length
    - max_length: Maximum bolt length
    - page: Page number (default 1)
    - limit: Items per page (default 20, max 100)
    """

    queryset = Bolt.objects.select_related("supplier").filter(is_published=True).order_by("id")
    serializer_class = PublicBoltSerializer
    pagination_class = BoltPagination
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend]
    filterset_class = BoltFilterSet


class TestFilterSet(FilterSet):
    bolt_ids = BaseInFilter(field_name="bolt_id")
    facilities = BaseInFilter(field_name="facility")

    class Meta:
        model = Test
        fields = ["methodology"]


class AdminBoltFilterSet(FilterSet):
    """Filterset for admin bolt list view."""

    class Meta:
        model = Bolt
        fields = ["name", "is_published"]


class AdminTestFilterSet(FilterSet):
    """Filterset for admin test list view."""

    class Meta:
        model = Test
        fields = ["is_published"]


class PublicTestListView(generics.ListAPIView):
    """
    Public API endpoint for published tests with associated curve and calculated stats.

    Query parameters (both required):
    - bolt_ids: Filter by bolt IDs (comma-separated, e.g., ?bolt_ids=1,2,3)
    - methodology: Filter by methodology (static or dynamic)

    Optional:
    - facilities: Filter by facility names (comma-separated, e.g., ?facilities=Lab%20A,Lab%20B)

    Response includes:
    - Test details with all measurements
    - Associated TestCurve with displacement/load data points
    - Calculated stats (min/max/mean/median/quartiles/std dev) for filtered results only
    """

    queryset = Test.objects.select_related("curve").filter(is_published=True).order_by("-id")
    serializer_class = PublicTestSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend]
    filterset_class = TestFilterSet

    def get_queryset(self):
        queryset = super().get_queryset()

        bolt_ids = self.request.query_params.get("bolt_ids")
        methodology = self.request.query_params.get("methodology")

        if not bolt_ids or not methodology:
            raise ValidationError({"detail": "bolt_ids and methodology are required parameters."})

        return queryset

    def list(self, request, *args, **kwargs):
        """Override to group tests by bolt and include per-bolt stats."""
        filtered_tests = self.filter_queryset(self.get_queryset())
        grouped_data = group_tests_by_bolt(filtered_tests)
        return Response(grouped_data)


class AdminSupplierListCreateView(generics.ListCreateAPIView):
    """
    Admin API endpoint for supplier management.

    GET: List all suppliers
    POST: Create a new supplier
    """

    queryset = Supplier.objects.all().order_by("id")
    serializer_class = SupplierSerializer
    permission_classes = [IsAdminUser]
    pagination_class = AdminPagination


class AdminSupplierDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Admin API endpoint for individual supplier management.

    GET: Retrieve supplier details
    PUT/PATCH: Update supplier
    DELETE: Delete supplier
    """

    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer
    permission_classes = [IsAdminUser]
    lookup_field = "id"

    def delete(self, request, *args, **kwargs):
        """Delete supplier with error handling for protected relationships."""
        try:
            return super().delete(request, *args, **kwargs)
        except IntegrityError as e:
            if "PROTECT" in str(e) or "protected" in str(e):
                return Response(
                    {
                        "detail": "Cannot delete supplier with existing bolts. Delete all related bolts first."
                    },
                    status=status.HTTP_409_CONFLICT,
                )
            raise


class AdminBoltListCreateView(generics.ListCreateAPIView):
    """
    Admin API endpoint for bolt management.

    GET: List all bolts
    POST: Create a new bolt (cannot set is_published, use /api/admin/bolts/{id}/publish/)

    Query parameters:
    - name: Filter by bolt name (substring match)
    - is_published: Filter by publish status (true/false)
    """

    queryset = Bolt.objects.select_related("supplier").all().order_by("id")
    serializer_class = AdminBoltSerializer
    permission_classes = [IsAdminUser]
    pagination_class = AdminPagination
    filter_backends = [DjangoFilterBackend]
    filterset_class = AdminBoltFilterSet


class AdminBoltDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Admin API endpoint for individual bolt management.

    GET: Retrieve bolt details
    PUT/PATCH: Update bolt (cannot change is_published, use /api/admin/bolts/{id}/publish/)
    DELETE: Delete bolt
    """

    queryset = Bolt.objects.select_related("supplier").all()
    serializer_class = AdminBoltSerializer
    permission_classes = [IsAdminUser]
    lookup_field = "id"


class AdminBoltPublishView(generics.UpdateAPIView):
    """
    Admin API endpoint to publish/unpublish a bolt.

    PATCH: Toggle is_published status
    """

    queryset = Bolt.objects.all()
    serializer_class = BoltPublishSerializer
    permission_classes = [IsAdminUser]
    lookup_field = "id"


class AdminTestListCreateView(generics.ListCreateAPIView):
    """
    Admin API endpoint for test management.

    GET: List all tests
    POST: Create a new test (cannot set is_published, use /api/admin/tests/{id}/publish/)

    Query parameters:
    - is_published: Filter by publish status (true/false)
    """

    queryset = Test.objects.select_related("bolt").all().order_by("-id")
    permission_classes = [IsAdminUser]
    lookup_field = "id"
    pagination_class = AdminPagination
    filter_backends = [DjangoFilterBackend]
    filterset_class = AdminTestFilterSet

    def get_serializer_class(self):
        if self.request.method == "GET":
            return AdminTestListSerializer
        return AdminTestSerializer


class ExternalBoltSummaryStatsView(generics.GenericAPIView):
    """
    External API endpoint for published bolts with summary statistics.

    Returns:
    - Bolt details
    - Supplier details
    - Number of published tests
    - Summary statistics calculated from published tests
    """

    permission_classes = [permissions.AllowAny]

    def get(self, request, *args, **kwargs):
        bolts = Bolt.objects.select_related("supplier").filter(is_published=True).order_by("id")

        results = []

        for bolt in bolts:
            tests = list(
                Test.objects.filter(
                    bolt=bolt,
                    is_published=True,
                )
            )

            stats = calculate_stats_for_tests(tests)

            results.append(
                {
                    "id": bolt.id,
                    "name": bolt.name,
                    "supplier": {
                        "id": bolt.supplier.id,
                        "name": bolt.supplier.name,
                    },
                    "category": bolt.category,
                    "length": bolt.length,
                    "diameter": bolt.diameter,
                    "equipment_compatibility": bolt.equipment_compatibility,
                    "test_count": len(tests),
                    "summary_stats": stats,
                }
            )

        return Response(
            {
                "count": len(results),
                "results": results,
            }
        )


class ExternalTestCurvesView(generics.GenericAPIView):
    """
    External API endpoint for published test curve data.

    Optional query parameters:
    - bolt_ids: Comma-separated bolt IDs, e.g. ?bolt_ids=1,2,3
    - methodology: static or dynamic
    - facilities: Comma-separated facility names
    """

    permission_classes = [permissions.AllowAny]

    def get(self, request, *args, **kwargs):
        queryset = (
            Test.objects.select_related(
                "bolt__supplier",
                "curve",
            )
            .filter(
                is_published=True,
                bolt__is_published=True,
                curve__is_published=True,
            )
            .order_by("id")
        )

        bolt_ids = request.query_params.get("bolt_ids")
        methodology = request.query_params.get("methodology")
        facilities = request.query_params.get("facilities")

        if bolt_ids:
            bolt_id_list = [
                int(bolt_id.strip()) for bolt_id in bolt_ids.split(",") if bolt_id.strip()
            ]
            queryset = queryset.filter(bolt_id__in=bolt_id_list)

        if methodology:
            queryset = queryset.filter(methodology=methodology)

        if facilities:
            facility_list = [
                facility.strip() for facility in facilities.split(",") if facility.strip()
            ]
            queryset = queryset.filter(facility__in=facility_list)

        results = []

        for test in queryset:
            results.append(
                {
                    "test_id": test.id,
                    "bolt": {
                        "id": test.bolt.id,
                        "name": test.bolt.name,
                        "supplier": {
                            "id": test.bolt.supplier.id,
                            "name": test.bolt.supplier.name,
                        },
                    },
                    "methodology": test.methodology,
                    "facility": test.facility,
                    "curve": {
                        "id": test.curve.id,
                        "curve_pair": test.curve.curve_pair,
                    },
                }
            )

        return Response(
            {
                "count": len(results),
                "results": results,
            }
        )


class AdminTestDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Admin API endpoint for individual test management.

    GET: Retrieve test details (includes associated curve)
    PUT/PATCH: Update test (cannot change is_published, use /api/admin/tests/{id}/publish/)
    DELETE: Delete test (cascade deletes associated curve)
    """

    queryset = Test.objects.select_related("bolt", "curve").all()
    serializer_class = AdminTestSerializer
    permission_classes = [IsAdminUser]
    lookup_field = "id"


class AdminTestPublishView(generics.UpdateAPIView):
    """
    Admin API endpoint to publish/unpublish a test.

    PATCH: Toggle is_published status
    """

    queryset = Test.objects.all()
    serializer_class = TestPublishSerializer
    permission_classes = [IsAdminUser]
    lookup_field = "id"


class AdminTestCurveDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Admin API endpoint for individual test curve management.

    GET: Retrieve test curve details
    PUT/PATCH: Update test curve (cannot change is_published, use /api/admin/test-curves/{id}/publish/)
    DELETE: Delete test curve
    """

    queryset = TestCurve.objects.select_related("test").all()
    serializer_class = AdminTestCurveSerializer
    permission_classes = [IsAdminUser]
    lookup_field = "id"


class AdminTestCurvePublishView(generics.UpdateAPIView):
    """
    Admin API endpoint to publish/unpublish a test curve.

    PATCH: Toggle is_published status
    """

    queryset = TestCurve.objects.all()
    serializer_class = TestCurvePublishSerializer
    permission_classes = [IsAdminUser]
    lookup_field = "id"


class AdminTestCurveCreateView(generics.CreateAPIView):
    """
    Admin API endpoint to create test curves.

    POST: Create curves from JSON

    JSON single curve:
    {
        "test": 1,
        "curve_pair": [
            {"displacement": 0.5, "load": 186.86, "energy_absorbed": 0.093},
            ...
        ]
    }

    JSON bulk (array):
    [
        {"test": 1, "curve_pair": [...]},
        {"test": 2, "curve_pair": [...]},
        ...
    ]
    """

    serializer_class = AdminTestCurveSerializer
    permission_classes = [IsAdminUser]
    parser_classes = (JSONParser,)

    def post(self, request, *args, **kwargs):
        """Process JSON (single or bulk) upload."""
        data = request.data if isinstance(request.data, list) else [request.data]
        return self._process_data(data)

    def _process_data(self, data):
        """Process array of curve data and create instances."""
        errors = []
        created_count = 0

        for idx, item in enumerate(data):
            serializer = self.get_serializer(data=item)
            if serializer.is_valid():
                try:
                    serializer.save()
                    created_count += 1
                except Exception as e:
                    errors.append({"row": idx, "error": str(e)})
            else:
                errors.append({"row": idx, "errors": serializer.errors})

        return Response(
            {"created": created_count, "errors": errors, "total": len(data)},
            status=status.HTTP_201_CREATED,
        )


class AuditLogListView(generics.ListAPIView):
    """
    Admin API endpoint to retrieve audit logs.

    Lists all API calls with their metadata:
    - IP address that made the call
    - Authenticated user (if any)
    - HTTP method and endpoint path
    - Response status code
    - Response time (ms)
    - Request body (for POST/PATCH)
    - Error message (if 4xx/5xx)

    Query parameters:
    - ip_address: Filter by client IP
    - user: Filter by user ID
    - path: Filter by API path
    - method: Filter by HTTP method (GET, POST, etc.)
    - status_code: Filter by response status code
    - date_from: Filter by date (YYYY-MM-DD)
    - date_to: Filter by date (YYYY-MM-DD)

    Ordered by timestamp (newest first).
    """

    queryset = AuditLog.objects.all()
    serializer_class = AuditLogSerializer
    permission_classes = [IsAdminUser]
    pagination_class = PageNumberPagination
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["user", "path", "method", "status_code"]
    ordering = ["-timestamp"]

    def get_queryset(self):
        """Filter audit logs by optional date range."""
        queryset = super().get_queryset()
        date_from = self.request.query_params.get("date_from")
        date_to = self.request.query_params.get("date_to")

        if date_from:
            queryset = queryset.filter(timestamp__date__gte=date_from)
        if date_to:
            queryset = queryset.filter(timestamp__date__lte=date_to)

        return queryset


class AdminBoltCSVImportView(generics.CreateAPIView):
    """
    Admin API endpoint to import bolts from CSV file.

    CSV format:
    supplier_id, client_product_id, name, length, diameter, category, equipment_compatibility

    equipment_compatibility should be semicolon-separated values: "Multi-OEM;Handheld;Boltec"
    """

    permission_classes = [IsAdminUser]
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request, *args, **kwargs):
        """Handle CSV file upload for bolt import."""
        if "file" not in request.FILES:
            return Response(
                {"error": "No file provided"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        csv_file = request.FILES["file"]

        try:
            stream = io.TextIOWrapper(csv_file.file, encoding="utf-8")
            reader = csv.DictReader(stream)

            errors = []
            created_count = 0

            for row_idx, row in enumerate(reader, start=2):  # Start at 2 (header is row 1)
                try:
                    supplier_id = int(row["supplier_id"])
                    client_product_id = row.get("client_product_id", "").strip() or None
                    name = row["name"].strip()
                    length = float(row["length"])
                    diameter = float(row["diameter"])
                    category = row["category"].strip()
                    equipment_compat_str = row.get("equipment_compatibility", "").strip()
                    equipment_compatibility = [
                        x.strip() for x in equipment_compat_str.split(";") if x.strip()
                    ]

                    # Get or create supplier
                    try:
                        supplier = Supplier.objects.get(id=supplier_id)
                    except Supplier.DoesNotExist:
                        errors.append(
                            {"row": row_idx, "error": f"Supplier with ID {supplier_id} not found"}
                        )
                        continue

                    # Create or update bolt
                    bolt, created = Bolt.objects.update_or_create(
                        supplier=supplier,
                        client_product_id=client_product_id,
                        defaults={
                            "name": name,
                            "length": length,
                            "diameter": diameter,
                            "category": category,
                            "equipment_compatibility": equipment_compatibility,
                        },
                    )
                    created_count += 1

                except ValueError as e:
                    errors.append({"row": row_idx, "error": f"Invalid data format: {str(e)}"})
                except Exception as e:
                    errors.append({"row": row_idx, "error": str(e)})

        except Exception as e:
            return Response(
                {"error": f"CSV parsing error: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {"created": created_count, "errors": errors},
            status=status.HTTP_201_CREATED,
        )


class AdminTestCSVImportView(generics.CreateAPIView):
    """
    Admin API endpoint to import tests from CSV file.

    CSV format:
    product_id, supplier_id, client_product_id, client_test_id, methodology, facility, installation_method,
    encapsulation_method, peak_strength, bond_strength, yield_strength, ultimate_deformation,
    stiffness, loading_rate, energy_absorption, number_of_drops

    Note: methodology must be "static" or "dynamic"
    product_id: Internal database bolt ID (optional, prioritized if provided)
    client_product_id and supplier_id: Used if product_id is empty
    """

    permission_classes = [IsAdminUser]
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request, *args, **kwargs):
        """Handle CSV file upload for test import."""
        if "file" not in request.FILES:
            return Response(
                {"error": "No file provided"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        csv_file = request.FILES["file"]

        try:
            stream = io.TextIOWrapper(csv_file.file, encoding="utf-8")
            reader = csv.DictReader(stream)

            errors = []
            created_count = 0

            for row_idx, row in enumerate(reader, start=2):  # Start at 2 (header is row 1)
                try:
                    product_id = row.get("product_id", "").strip()
                    supplier_id = int(row["supplier_id"])
                    client_product_id = row.get("client_product_id", "").strip() or None
                    client_test_id = row.get("client_test_id", "").strip() or None
                    methodology = row["methodology"].strip().lower()
                    facility = row["facility"].strip()

                    # Find bolt: prioritize product_id, fall back to supplier_id + client_product_id
                    bolt = None
                    if product_id:
                        try:
                            bolt = Bolt.objects.get(id=int(product_id))
                        except (Bolt.DoesNotExist, ValueError):
                            errors.append(
                                {
                                    "row": row_idx,
                                    "error": f"Bolt not found for product_id={product_id}",
                                }
                            )
                            continue
                    else:
                        try:
                            bolt = Bolt.objects.get(
                                supplier_id=supplier_id,
                                client_product_id=client_product_id,
                            )
                        except Bolt.DoesNotExist:
                            errors.append(
                                {
                                    "row": row_idx,
                                    "error": f"Bolt not found for supplier_id={supplier_id}, client_product_id={client_product_id}",
                                }
                            )
                            continue

                    # Parse optional fields
                    def safe_float(val):
                        val = val.strip() if isinstance(val, str) else val
                        return float(val) if val else None

                    def safe_int(val):
                        val = val.strip() if isinstance(val, str) else val
                        return int(val) if val else None

                    test_data = {
                        "bolt": bolt,
                        "methodology": methodology,
                        "facility": facility,
                        "installation_method": row.get("installation_method", "").strip() or None,
                        "encapsulation_method": row.get("encapsulation_method", "").strip() or None,
                        "peak_strength": safe_float(row.get("peak_strength", "")),
                        "bond_strength": safe_float(row.get("bond_strength", "")),
                        "yield_strength": safe_float(row.get("yield_strength", "")),
                        "ultimate_deformation": safe_float(row.get("ultimate_deformation", "")),
                        "stiffness": safe_float(row.get("stiffness", "")),
                        "loading_rate": safe_float(row.get("loading_rate", "")),
                        "energy_absorption": safe_float(row.get("energy_absorption", "")),
                        "number_of_drops": safe_int(row.get("number_of_drops", "")),
                        "client_test_id": client_test_id,
                    }

                    # Create or update test
                    if client_test_id:
                        test, created = Test.objects.update_or_create(
                            bolt=bolt,
                            client_test_id=client_test_id,
                            defaults=test_data,
                        )
                    else:
                        test = Test.objects.create(**test_data)

                    created_count += 1

                except ValueError as e:
                    errors.append({"row": row_idx, "error": f"Invalid data format: {str(e)}"})
                except Exception as e:
                    errors.append({"row": row_idx, "error": str(e)})

        except Exception as e:
            return Response(
                {"error": f"CSV parsing error: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {"created": created_count, "errors": errors},
            status=status.HTTP_201_CREATED,
        )


class AdminTestCurveCSVImportView(generics.CreateAPIView):
    """
    Admin API endpoint to import test curves from CSV file.

    CSV format:
    test_id, supplier_id, client_test_id, displacement, load

    Looks up test by:
    - test_id if provided (prioritized)
    - supplier_id + client_test_id as fallback
    """

    permission_classes = [IsAdminUser]
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request, *args, **kwargs):
        """Handle CSV file upload for test curve import."""
        if "file" not in request.FILES:
            return Response(
                {"error": "No file provided"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        csv_file = request.FILES["file"]

        try:
            stream = io.TextIOWrapper(csv_file.file, encoding="utf-8")
            reader = csv.DictReader(stream)

            errors = []
            created_count = 0
            grouped_data = {}

            for row_idx, row in enumerate(reader, start=2):
                try:
                    test_id = row.get("test_id", "").strip()
                    supplier_id = int(row["supplier_id"])
                    client_test_id = row.get("client_test_id", "").strip()
                    displacement = float(row["displacement"])
                    load = float(row["load"])

                    # Determine lookup key: prioritize test_id, fall back to (supplier_id, client_test_id)
                    if test_id:
                        key = ("test_id", int(test_id))
                    else:
                        key = ("composite", supplier_id, client_test_id)

                    if key not in grouped_data:
                        grouped_data[key] = []

                    grouped_data[key].append({
                        "displacement": displacement,
                        "load": load,
                    })

                except ValueError as e:
                    errors.append({"row": row_idx, "error": f"Invalid data format: {str(e)}"})
                except Exception as e:
                    errors.append({"row": row_idx, "error": str(e)})

            # Create TestCurve objects using the grouped data
            for key, curve_points in grouped_data.items():
                try:
                    # Find test based on key type
                    if key[0] == "test_id":
                        test = Test.objects.get(id=key[1])
                    else:  # composite key
                        supplier_id, client_test_id = key[1], key[2]
                        test = Test.objects.get(
                            client_test_id=client_test_id,
                            bolt__supplier_id=supplier_id,
                        )

                    # Create or update curve
                    TestCurve.objects.update_or_create(
                        test=test,
                        defaults={"curve_pair": curve_points},
                    )
                    created_count += 1

                except Test.DoesNotExist:
                    if key[0] == "test_id":
                        errors.append({
                            "test_id": key[1],
                            "error": f"Test not found for test_id={key[1]}",
                        })
                    else:
                        errors.append({
                            "client_test_id": key[2],
                            "error": f"Test not found for supplier_id={key[1]}, client_test_id={key[2]}",
                        })
                except Exception as e:
                    error_key = key[1] if key[0] == "test_id" else key[2]
                    errors.append({
                        "key": error_key,
                        "error": str(e),
                    })

        except Exception as e:
            return Response(
                {"error": f"CSV parsing error: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {"created": created_count, "errors": errors},
            status=status.HTTP_201_CREATED,
        )
