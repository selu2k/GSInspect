from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import HealthView, BoltListView, MyTokenObtainPairView

urlpatterns = [
    path("health/", HealthView.as_view(), name="health"),
    
    path("auth/login/", MyTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),

    path("public/bolts/", BoltListView.as_view(), name="bolt-list"),
    path("external/bolts/", BoltListView.as_view(), name="bolt-list-external"),
]
