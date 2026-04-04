from rest_framework.response import Response
from rest_framework import generics, permissions
from rest_framework.pagination import PageNumberPagination
from rest_framework.exceptions import ValidationError
from django_filters import BaseInFilter, FilterSet
from .models import Bolt, Test
from .serializers import BoltSerializer, TestSerializer
from .utils import group_tests_by_bolt
from django_filters.rest_framework import DjangoFilterBackend


class TestFilterSet(FilterSet):
    bolt_ids = BaseInFilter(field_name='bolt_id')
    
    class Meta:
        model = Test
        fields = ['methodology', 'facility']


class HealthView(generics.GenericAPIView):
    """Health check endpoint."""
    permission_classes = [permissions.AllowAny]
    
    def get(self, request, *args, **kwargs):
        return Response({"status": "ok"})

class BoltPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "limit"
    max_page_size = 100


class BoltListView(generics.ListAPIView):
    """
    Public API endpoint for published bolts with filtering and pagination.
    
    Query parameters:
    - category: Filter by category
    - supplier: Filter by supplier ID
    - length: Filter by bolt length
    - page: Page number (default 1)
    - limit: Items per page (default 20, max 100)
    """
    queryset = Bolt.objects.select_related("supplier").filter(is_published=True).order_by("id")
    serializer_class = BoltSerializer
    pagination_class = BoltPagination
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["category", "supplier", "length"]


class TestListView(generics.ListAPIView):
    """
    Public API endpoint for published tests with associated curve and calculated stats.
    
    Query parameters (both required):
    - bolt_ids: Filter by bolt IDs (comma-separated, e.g., ?bolt_ids=1,2,3)
    - methodology: Filter by methodology (static or dynamic)
    
    Optional:
    - facility: Filter by facility name
    
    Response includes:
    - Test details with all measurements
    - Associated TestCurve with displacement/load data points
    - Calculated stats (min/max/mean/median/quartiles/std dev) for filtered results only
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
            raise ValidationError({
                'detail': 'bolt_ids and methodology are required parameters.'
            })
        
        return queryset
    
    def list(self, request, *args, **kwargs):
        """Override to group tests by bolt and include per-bolt stats."""
        # Get the filtered tests
        filtered_tests = self.filter_queryset(self.get_queryset())
        
        # Group by bolt and calculate stats
        grouped_data = group_tests_by_bolt(filtered_tests)
        
        return Response(grouped_data)


