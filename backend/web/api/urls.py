from django.urls import path
from .views import (
    HealthView,
    PublicBoltListView,
    PublicTestListView,
    PublicFilterOptionsView,
    SupplierListCreateView,
    SupplierDetailView,
)

urlpatterns = [
    # Health check
    path("health/", HealthView.as_view(), name="health"),
    
    # Public API endpoints
    path("public/filter-options/", PublicFilterOptionsView.as_view(), name="filter-options"),
    path("public/bolts/", PublicBoltListView.as_view(), name="bolt-list"),
    path("public/tests/", PublicTestListView.as_view(), name="test-list"),
    
    # Admin API - Supplier CRUD
    path("admin/suppliers/", SupplierListCreateView.as_view(), name="supplier-list-create"),
    path("admin/suppliers/<int:id>/", SupplierDetailView.as_view(), name="supplier-detail"),
]
