from rest_framework.response import Response
from rest_framework import generics, permissions
from rest_framework.pagination import PageNumberPagination
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import Bolt
from .serializers import BoltSerializer

class IsEngineerOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role in ['ADMIN', 'ENGINEER']
        )

class HealthView(generics.GenericAPIView):
    permission_classes = [permissions.AllowAny]
    
    def get(self, request, *args, **kwargs):
        return Response({"status": "ok"})

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
