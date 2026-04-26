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
from .utils import group_tests_by_bolt


class TestFilterSet(FilterSet):
    bolt_ids = BaseInFilter(field_name="bolt_id")

    class Meta:
        model = Test
        fields = ["methodology", "facility"]


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
    Public API endpoint for published tests with associated curve data.
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