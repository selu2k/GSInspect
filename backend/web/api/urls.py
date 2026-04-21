from django.urls import path
from .views import (
    HealthView,
    PublicBoltListView,
    PublicTestListView,
    PublicFilterOptionsView,
    SupplierListCreateView,
    SupplierDetailView,
    AdminBoltListView,
    AdminBoltCreateView,
    AdminBoltUpdateView,
    AdminBoltDeleteView,
)

urlpatterns = [
    # Health check
    # Health check
    path("health/", HealthView.as_view(), name="health"),

    # Public API endpoints
    path("public/filter-options/", PublicFilterOptionsView.as_view(), name="filter-options"),
    path("public/bolts/", PublicBoltListView.as_view(), name="bolt-list"),
    path("public/tests/", PublicTestListView.as_view(), name="test-list"),

    # Admin API - Supplier CRUD
    path("admin/suppliers/", SupplierListCreateView.as_view(), name="supplier-list-create"),
    path("admin/suppliers/<int:id>/", SupplierDetailView.as_view(), name="supplier-detail"),

    # Admin API - Bolt CRUD
    path("admin/bolts/", AdminBoltListView.as_view(), name="admin-bolt-list"),
    path("admin/bolts/create/", AdminBoltCreateView.as_view(), name="admin-bolt-create"),
    path("admin/bolts/<int:pk>/", AdminBoltUpdateView.as_view(), name="admin-bolt-update"),
    path("admin/bolts/<int:pk>/delete/", AdminBoltDeleteView.as_view(), name="admin-bolt-delete"),
]