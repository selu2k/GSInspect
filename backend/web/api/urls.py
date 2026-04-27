from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    HealthView,
    PublicBoltListView,
    PublicTestListView,
    PublicFilterOptionsView,
    MyTokenObtainPairView,
    SupplierListCreateView,
)

urlpatterns = [
    # Health check
    path("health/", HealthView.as_view(), name="health"),

     # JWT Authentication (Replacement for Session Login)
    path("auth/login/", MyTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    
    # Public API endpoints
    path("public/filter-options/", PublicFilterOptionsView.as_view(), name="filter-options"),
    path("public/bolts/", PublicBoltListView.as_view(), name="bolt-list"),
    path("public/tests/", PublicTestListView.as_view(), name="test-list"),

    # Admin API - Supplier CRUD
    path("admin/suppliers/", SupplierListCreateView.as_view(), name="supplier-list-create"),
    path("admin/suppliers/<int:id>/", SupplierDetailView.as_view(), name="supplier-detail"),
]
