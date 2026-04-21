from rest_framework.response import Response
from rest_framework import generics, permissions
from rest_framework.pagination import PageNumberPagination
from rest_framework.exceptions import ValidationError
from django_filters import BaseInFilter, FilterSet
from django.db.models import Min, Max
from .models import Bolt, Test, Supplier
from .serializers import BoltSerializer, TestSerializer
from .utils import group_tests_by_bolt
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.permissions import IsAdminUser


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


class FilterOptionsView(generics.GenericAPIView):
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
        filtered_tests = self.filter_queryset(self.get_queryset())
        grouped_data = group_tests_by_bolt(filtered_tests)
        return Response(grouped_data)


# Admin CRUD views for bolts

# Admin Bolt List View (View all bolts)
class AdminBoltListView(generics.ListAPIView):
    queryset = Bolt.objects.all()
    serializer_class = BoltSerializer
    permission_classes = [IsAdminUser]  # Only admins can view bolts

    def get_queryset(self):
        # Optionally, you can filter by published/unpublished status
        queryset = super().get_queryset()
        is_published = self.request.query_params.get('is_published', None)
        if is_published:
            queryset = queryset.filter(is_published=is_published)
        return queryset


# Admin Bolt Create View (Add new bolt)
class AdminBoltCreateView(generics.CreateAPIView):
    serializer_class = BoltSerializer
    permission_classes = [IsAdminUser]  # Only admins can create bolts

    def perform_create(self, serializer):
        # Optional: You can add custom logic before saving the bolt
        serializer.save()


# Admin Bolt Update View (Edit an existing bolt)
class AdminBoltUpdateView(generics.UpdateAPIView):
    queryset = Bolt.objects.all()
    serializer_class = BoltSerializer
    permission_classes = [IsAdminUser]  # Only admins can edit bolts


# Admin Bolt Delete View (Delete an existing bolt)
class AdminBoltDeleteView(generics.DestroyAPIView):
    queryset = Bolt.objects.all()
    permission_classes = [IsAdminUser]  # Only admins can delete bolts