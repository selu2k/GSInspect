from django.urls import path
from .views import HealthView, BoltListView, TestListView

urlpatterns = [
    path("health/", HealthView.as_view(), name="health"),
    path("public/bolts/", BoltListView.as_view(), name="bolt-list"),
    path("public/tests/", TestListView.as_view(), name="test-list"),
]

