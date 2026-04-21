from django.db.models import Min, Max
from django_filters import BaseInFilter, FilterSet
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import generics, permissions
from rest_framework.exceptions import ValidationError
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import Bolt, Test, Supplier
from .serializers import BoltSerializer, TestSerializer, MyTokenObtainPairSerializer
from .utils import group_tests_by_bolt

class TestFilterSet(FilterSet):
    """
    Filter set for Test model supporting multi-ID filtering via comma-separated strings.
    """
    bolt_ids = BaseInFilter(field_name='bolt_id')
    
    class Meta:
        model = Test
        fields = ['methodology', 'facility']

class HealthView(generics.GenericAPIView):
    """
    Service health check endpoint.
    """
    permission_classes = [permissions.AllowAny]
    
    def get(self, request, *args, **kwargs):
        return Response({"status": "ok"})

class FilterOptionsView(generics.GenericAPIView):
    """
    Provides dynamic metadata for frontend filter components (dropdowns, ranges).
    """
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

class BoltPagination(PageNumberPagination):
    """
    Custom pagination settings for Bolt listings.
    """
    page_size = 20
    page_size_query_param = "limit"
    max_page_size = 100

class BoltListView(generics.ListAPIView):
    """
    Retrieves a list of published bolts with filtering and pagination.
    """
    queryset = Bolt.objects.select_related("supplier").filter(is_published=True).order_by("id")
    serializer_class = BoltSerializer
    pagination_class = BoltPagination
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["category", "supplier", "length"]

class TestListView(generics.ListAPIView):
    """
    Retrieves tests grouped by bolt with statistical calculations.
    Requires 'bolt_ids' and 'methodology' as query parameters.
    """
    queryset = Test.objects.select_related("curve").filter(is_published=True).order_by("-created_at")
    serializer_class = TestSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend]
    filterset_class = TestFilterSet
    
    def get_queryset(self):
        queryset = super().get_queryset()
        bolt_ids = self.request.query_params.get('bolt_ids')
        methodology = self.request.query_params.get('methodology')
        if not bolt_ids or not methodology:
            raise ValidationError({'detail': 'bolt_ids and methodology are required parameters.'})
        return queryset

    def list(self, request, *args, **kwargs):
        # Apply filters and group results using the utility helper
        filtered_tests = self.filter_queryset(self.get_queryset())
        grouped_data = group_tests_by_bolt(filtered_tests)
        return Response(grouped_data)

class MyTokenObtainPairView(TokenObtainPairView):
    """
    JWT authentication endpoint using custom claims serializer.
    """
    serializer_class = MyTokenObtainPairSerializer
