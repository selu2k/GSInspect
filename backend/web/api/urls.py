from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    HealthView, 
    BoltListView, 
    TestListView, 
    FilterOptionsView, 
    MyTokenObtainPairView
)

urlpatterns = [
    # System health check
    path("health/", HealthView.as_view(), name="health"),
    
    # JWT Authentication endpoints
    path("auth/login/", MyTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),

    # Public API endpoints
    path("public/filter-options/", FilterOptionsView.as_view(), name="filter-options"),
    path("public/bolts/", BoltListView.as_view(), name="bolt-list"),
    path("public/tests/", TestListView.as_view(), name="test-list"),
]
