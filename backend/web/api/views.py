from rest_framework.response import Response
from rest_framework import generics, permissions
from rest_framework.pagination import PageNumberPagination
from rest_framework.exceptions import ValidationError
from django_filters import BaseInFilter, FilterSet, NumberFilter
from django.db.models import Min, Max
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.permissions import IsAdminUser

from .models import Bolt, Test, Supplier
from .serializers import (
    PublicBoltSerializer,
    PublicTestSerializer,
    SupplierSerializer,
    BoltSerializer,
)
from .utils import group_tests_by_bolt, calculate_stats_for_tests


class TestFilterSet(FilterSet):
    bolt_ids = BaseInFilter(field_name="bolt_id")
    facilities = BaseInFilter(field_name="facility")

    class Meta:
        model = Test
        fields = ["methodology"]


class HealthView(generics.GenericAPIView):
    """Health check endpoint."""
    permission_classes = [permissions.AllowAny]

    def get(self, request, *args, **kwargs):
        return Response({"status": "ok"})


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

        return Response({
            "suppliers": suppliers,
            "categories": categories,
            "facilities": facilities,
            "methodologies": methodologies,
            "length_range": length_range,
        })


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


class PublicBoltListView(generics.ListAPIView):
    """
    Public API endpoint for published bolts with filtering and pagination.

    Query parameters:
    - categories: Comma-separated category names
    - suppliers: Comma-separated supplier IDs
    - min_length: Minimum bolt length
    - max_length: Maximum bolt length
    - page: Page number (default 1)
    - limit: Items per page (default 20, max 100)
    """
    queryset = Bolt.objects.select_related("supplier").filter(
        is_published=True
    ).order_by("id")
    serializer_class = PublicBoltSerializer
    pagination_class = BoltPagination
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend]
    filterset_class = BoltFilterSet


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
    queryset = Test.objects.select_related("curve").filter(
        is_published=True
    ).order_by("-created_at")
    serializer_class = PublicTestSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend]
    filterset_class = TestFilterSet

    def get_queryset(self):
        queryset = super().get_queryset()

        bolt_ids = self.request.query_params.get("bolt_ids")
        methodology = self.request.query_params.get("methodology")

        if not bolt_ids or not methodology:
            raise ValidationError({
                "detail": "bolt_ids and methodology are required parameters."
            })

        return queryset

    def list(self, request, *args, **kwargs):
        """Override to group tests by bolt and include per-bolt stats."""
        filtered_tests = self.filter_queryset(self.get_queryset())
        grouped_data = group_tests_by_bolt(filtered_tests)
        return Response(grouped_data)


class SupplierListCreateView(generics.ListCreateAPIView):
    """
    Admin API endpoint for supplier management.

    GET: List all suppliers
    POST: Create a new supplier
    """
    queryset = Supplier.objects.all().order_by("name")
    serializer_class = SupplierSerializer

    # CHANGE THIS TO IS_AUTHENTICATED,
    # THIS IS ONLY HERE BECAUSE AUTHENTICATION IS NOT SET UP YET
    permission_classes = [permissions.AllowAny]


class SupplierDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Admin API endpoint for individual supplier management.

    GET: Retrieve supplier details
    PUT/PATCH: Update supplier
    DELETE: Delete supplier
    """
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer
    lookup_field = "id"

    # CHANGE THIS TO IS_AUTHENTICATED,
    # THIS IS ONLY HERE BECAUSE AUTHENTICATION IS NOT SET UP YET
    permission_classes = [permissions.AllowAny]


class AdminBoltListCreateView(generics.ListCreateAPIView):
    """
    Admin API endpoint for bolt management.

    GET: List all bolts
    POST: Create a new bolt
    """
    queryset = Bolt.objects.select_related("supplier").all().order_by("id")
    serializer_class = BoltSerializer
    permission_classes = [IsAdminUser]


class AdminBoltDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Admin API endpoint for individual bolt management.

    GET: Retrieve bolt details
    PUT/PATCH: Update bolt
    DELETE: Delete bolt
    """
    queryset = Bolt.objects.select_related("supplier").all()
    serializer_class = BoltSerializer
    permission_classes = [IsAdminUser]
    lookup_field = "id"


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
        bolts = Bolt.objects.select_related("supplier").filter(
            is_published=True
        ).order_by("id")

        results = []

        for bolt in bolts:
            tests = list(
                Test.objects.filter(
                    bolt=bolt,
                    is_published=True,
                )
            )

            stats = calculate_stats_for_tests(tests)

            results.append({
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
            })

        return Response({
            "count": len(results),
            "results": results,
        })


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
        queryset = Test.objects.select_related(
            "bolt__supplier",
            "curve",
        ).filter(
            is_published=True,
            bolt__is_published=True,
            curve__is_published=True,
        ).order_by("id")

        bolt_ids = request.query_params.get("bolt_ids")
        methodology = request.query_params.get("methodology")
        facilities = request.query_params.get("facilities")

        if bolt_ids:
            bolt_id_list = [
                int(bolt_id.strip())
                for bolt_id in bolt_ids.split(",")
                if bolt_id.strip()
            ]
            queryset = queryset.filter(bolt_id__in=bolt_id_list)

        if methodology:
            queryset = queryset.filter(methodology=methodology)

        if facilities:
            facility_list = [
                facility.strip()
                for facility in facilities.split(",")
                if facility.strip()
            ]
            queryset = queryset.filter(facility__in=facility_list)

        results = []

        for test in queryset:
            results.append({
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
            })

        return Response({
            "count": len(results),
            "results": results,
        })