from django.urls import path
from .views import HealthView, BoltListView, TestListView, FilterOptionsView

urlpatterns = [
    path("health/", HealthView.as_view(), name="health"),
    path("public/filter-options/", FilterOptionsView.as_view(), name="filter-options"),
    path("public/bolts/", BoltListView.as_view(), name="bolt-list"),
    path("public/tests/", TestListView.as_view(), name="test-list"),
]