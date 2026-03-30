from django.urls import path
from .views import HealthView, BoltListView

urlpatterns = [
    path("health/", HealthView.as_view(), name="health"),
    path("public/bolts/", BoltListView.as_view(), name="bolt-list"),
    path("external/bolts/", BoltListView.as_view(), name="bolt-list-external"),
]
