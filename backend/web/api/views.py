from rest_framework.response import Response
from rest_framework import generics, permissions
from rest_framework.pagination import PageNumberPagination
from rest_framework.exceptions import ValidationError
from django.db.models import Min, Max
from django_filters.rest_framework import DjangoFilterBackend
from django_filters import BaseInFilter, FilterSet

from .models import Bolt, Test, Supplier
from .serializers import BoltSerializer, TestSerializer, MyTokenObtainPairSerializer
from .utils import group_tests_by_bolt

# Import permission class from permissions.py to follow DRY principles
from .permissions import IsEngineerOrAdmin

from rest_framework_simplejwt.views import TokenObtainPairView

class TestFilterSet(FilterSet):
    """
    Filter set for Test model to support multi-id filtering via comma-separated strings.
    """
    bolt_ids = BaseInFilter(field_name='bolt_id')
    
    class Meta:
        model = Test
        fields = ['methodology', 'facility']

class HealthView(generics.GenericAPIView):
    """
    Health check endpoint for monitoring system status.
    """
    permission_classes = [permissions.AllowAny]
    
    def get(self, request, *args, **kwargs):
        return Response({"status": "ok"})

class FilterOptionsView(generics.GenericAPIView):
    """
    Public API endpoint to provide dynamic options for frontend filter dropdowns.
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
    Standard pagination configuration for Bolt lists.
    """
    page_size = 20
    page_size_query_param = "limit"
    max_page_size = 100

class BoltListView(generics.ListAPIView):
    """
    Public API endpoint for retrieving published bolts with filtering and pagination.
    """
    queryset = Bolt.objects.select_related("supplier").filter(is_published=True).order_by("id")
    serializer_class = BoltSerializer
    pagination_class = BoltPagination
    # Reverted to AllowAny as per reviewer's feedback for a public API
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["category", "supplier", "length"]

class TestListView(generics.ListAPIView):
    """
    Public API endpoint for published tests including grouped data and statistics.
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
    """Override to group tests by bolt and include per-bolt stats."""
    def list(self, request, *args, **kwargs):
        # Apply filters and group tests by bolt using utility helper
        filtered_tests = self.filter_queryset(self.get_queryset())
        grouped_data = group_tests_by_bolt(filtered_tests)
        return Response(grouped_data)

class MyTokenObtainPairView(TokenObtainPairView):
    """
    Custom JWT login view utilizing the MyTokenObtainPairSerializer.
    """
    serializer_class = MyTokenObtainPairSerializer
