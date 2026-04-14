from rest_framework.response import Response
from rest_framework import generics, permissions
from rest_framework.pagination import PageNumberPagination
from rest_framework.exceptions import ValidationError
from django.db.models import Min, Max
from django_filters.rest_framework import DjangoFilterBackend
from django_filters import BaseInFilter, FilterSet

from .models import Bolt, Test, Supplier
from .serializers import BoltSerializer, TestSerializer
from .utils import group_tests_by_bolt


from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


class IsEngineerOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role in ['ADMIN', 'ENGINEER']
        )

class TestFilterSet(FilterSet):
    bolt_ids = BaseInFilter(field_name='bolt_id')
    
    class Meta:
        model = Test
        fields = ['methodology', 'facility']

class HealthView(generics.GenericAPIView):
    permission_classes = [permissions.AllowAny]
    
    def get(self, request, *args, **kwargs):
        return Response({"status": "ok"})

class FilterOptionsView(generics.GenericAPIView):
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
    queryset = Bolt.objects.select_related("supplier").filter(is_published=True).order_by("id")
    serializer_class = BoltSerializer
    pagination_class = BoltPagination
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["category", "supplier", "length"]

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
            raise ValidationError({'detail': 'bolt_ids and methodology are required.'})
        return queryset
    
    def list(self, request, *args, **kwargs):
        filtered_tests = self.filter_queryset(self.get_queryset())
        grouped_data = group_tests_by_bolt(filtered_tests)
        return Response(grouped_data)


class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role'] = user.role
        token['username'] = user.username
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data['role'] = self.user.role
        data['username'] = self.user.username
        data['department'] = self.user.department
        return data

class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer