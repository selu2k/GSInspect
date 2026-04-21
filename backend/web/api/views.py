from rest_framework.response import Response
from rest_framework import generics, permissions, serializers
from rest_framework.pagination import PageNumberPagination
from rest_framework.exceptions import ValidationError
from django_filters import BaseInFilter, FilterSet
from django.db.models import Min, Max
from .models import Bolt, Test, Supplier
from .serializers import BoltSerializer, TestSerializer
from .utils import group_tests_by_bolt
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.permissions import IsAdminUser


class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = ["id", "name", "created_at", "updated_at"]


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


class PublicFilterOptionsView(FilterOptionsView):
    pass


class BoltPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "limit"
    max_page_size = 100


class BoltListView(generics.ListAPIView):
    queryset = Bolt.objects.select_related("supplier").filter(is_published=True).order_by("id")
    serializer_class = BoltSerializer
    pagination_class = BoltPagination
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["category", "supplier", "length"]


class PublicBoltListView(BoltListView):
    pass


class TestListView(generics.ListAPIView):
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
        filtered_tests = self.filter_queryset(self.get_queryset())
        grouped_data = group_tests_by_bolt(filtered_tests)
        return Response(grouped_data)


class PublicTestListView(TestListView):
    pass


class SupplierListCreateView(generics.ListCreateAPIView):
    queryset = Supplier.objects.all().order_by("name")
    serializer_class = SupplierSerializer
    permission_classes = [permissions.AllowAny]


class SupplierDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = "id"


class AdminBoltListView(generics.ListAPIView):
    queryset = Bolt.objects.all()
    serializer_class = BoltSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        queryset = super().get_queryset()
        is_published = self.request.query_params.get("is_published", None)
        if is_published:
            queryset = queryset.filter(is_published=is_published)
        return queryset


class AdminBoltCreateView(generics.CreateAPIView):
    serializer_class = BoltSerializer
    permission_classes = [IsAdminUser]

    def perform_create(self, serializer):
        serializer.save()


class AdminBoltUpdateView(generics.UpdateAPIView):
    queryset = Bolt.objects.all()
    serializer_class = BoltSerializer
    permission_classes = [IsAdminUser]


class AdminBoltDeleteView(generics.DestroyAPIView):
    queryset = Bolt.objects.all()
    permission_classes = [IsAdminUser]