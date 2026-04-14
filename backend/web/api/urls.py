<<<<<<< Yu-model
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import HealthView, BoltListView, MyTokenObtainPairView

urlpatterns = [
    path("health/", HealthView.as_view(), name="health"),
    
    path("auth/login/", MyTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),

=======
from django.urls import path
from .views import HealthView, BoltListView, TestListView, FilterOptionsView

urlpatterns = [
    path("health/", HealthView.as_view(), name="health"),
    path("public/filter-options/", FilterOptionsView.as_view(), name="filter-options"),
>>>>>>> main
    path("public/bolts/", BoltListView.as_view(), name="bolt-list"),
    path("public/tests/", TestListView.as_view(), name="test-list"),
]