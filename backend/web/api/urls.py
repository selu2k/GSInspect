from django.urls import path
from .views import HealthView, BoltListView, TestListView, FilterOptionsView, AdminBoltListView, AdminBoltCreateView, AdminBoltUpdateView, AdminBoltDeleteView

urlpatterns = [
    path("health/", HealthView.as_view(), name="health"),
    path("public/filter-options/", FilterOptionsView.as_view(), name="filter-options"),
    path("public/bolts/", BoltListView.as_view(), name="bolt-list"),
    path("public/tests/", TestListView.as_view(), name="test-list"),
    # Admin endpoints
    path("admin/bolts/", AdminBoltListView.as_view(), name="admin-bolt-list"),
    path("admin/bolts/create/", AdminBoltCreateView.as_view(), name="admin-bolt-create"),
    path("admin/bolts/<int:pk>/", AdminBoltUpdateView.as_view(), name="admin-bolt-update"),
    path("admin/bolts/<int:pk>/delete/", AdminBoltDeleteView.as_view(), name="admin-bolt-delete"),
]