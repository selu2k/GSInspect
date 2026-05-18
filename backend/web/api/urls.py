from django.urls import path
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    AdminBoltCSVImportView,
    AdminBoltDetailView,
    AdminBoltListCreateView,
    AdminBoltPublishView,
    AdminSupplierDetailView,
    AdminSupplierListCreateView,
    AdminTestCSVImportView,
    AdminTestCurveCSVImportView,
    AdminTestCurveCreateView,
    AdminTestCurveDetailView,
    AdminTestCurvePublishView,
    AdminTestDetailView,
    AdminTestListCreateView,
    AdminTestPublishView,
    ExternalBoltSummaryStatsView,
    ExternalTestCurvesView,
    AuditLogListView,
    HealthView,
    MyTokenObtainPairView,
    PublicBoltListView,
    PublicFilterOptionsView,
    PublicTestListView,
)

urlpatterns = [
    # Health check
    path("health/", HealthView.as_view(), name="health"),
    # JWT Authentication (Replacement for Session Login)
    path("auth/login/", MyTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    # API Schema & Documentation
    path("schema/", SpectacularAPIView.as_view(), name="schema"),
    path("docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
    # Public API endpoints
    path(
        "public/filter-options/",
        PublicFilterOptionsView.as_view(),
        name="filter-options",
    ),
    path(
        "public/bolts/",
        PublicBoltListView.as_view(),
        name="bolt-list",
    ),
    path(
        "public/tests/",
        PublicTestListView.as_view(),
        name="test-list",
    ),
    # External API endpoints
    path(
        "external/bolts-summary/",
        ExternalBoltSummaryStatsView.as_view(),
        name="external-bolts-summary",
    ),
    path(
        "external/test-curves/",
        ExternalTestCurvesView.as_view(),
        name="external-test-curves",
    ),
    # Admin API - Supplier CRUD
    path(
        "admin/suppliers/",
        AdminSupplierListCreateView.as_view(),
        name="admin-supplier-list-create",
    ),
    path(
        "admin/suppliers/<int:id>/",
        AdminSupplierDetailView.as_view(),
        name="admin-supplier-detail",
    ),
    # Admin API - Bolt CRUD
    path(
        "admin/bolts/",
        AdminBoltListCreateView.as_view(),
        name="admin-bolt-list-create",
    ),
    path(
        "admin/bolts/<int:id>/",
        AdminBoltDetailView.as_view(),
        name="admin-bolt-detail",
    ),
    path(
        "admin/bolts/<int:id>/publish/",
        AdminBoltPublishView.as_view(),
        name="admin-bolt-publish",
    ),
    # Admin API - Test CRUD
    path(
        "admin/tests/",
        AdminTestListCreateView.as_view(),
        name="admin-test-list-create",
    ),
    path(
        "admin/tests/<int:id>/",
        AdminTestDetailView.as_view(),
        name="admin-test-detail",
    ),
    path(
        "admin/tests/<int:id>/publish/",
        AdminTestPublishView.as_view(),
        name="admin-test-publish",
    ),
    # Admin API - TestCurve operations
    path(
        "admin/test-curves/<int:id>/publish/",
        AdminTestCurvePublishView.as_view(),
        name="admin-test-curve-publish",
    ),
    path(
        "admin/test-curves/<int:id>/",
        AdminTestCurveDetailView.as_view(),
        name="admin-test-curve-detail",
    ),
    path(
        "admin/test-curves/",
        AdminTestCurveCreateView.as_view(),
        name="admin-test-curve-create",
    ),
]
    # Admin API - Audit logs
    path(
        "admin/audit-logs/",
        AuditLogListView.as_view(),
        name="admin-audit-logs",
    ),
    # CSV Import endpoints
    path(
        "admin/bolts/import-csv/",
        AdminBoltCSVImportView.as_view(),
        name="admin-bolt-csv-import",
    ),
    path(
        "admin/tests/import-csv/",
        AdminTestCSVImportView.as_view(),
        name="admin-test-csv-import",
    ),
    path(
        "admin/test-curves/import-csv/",
        AdminTestCurveCSVImportView.as_view(),
        name="admin-test-curve-csv-import",
    ),
]
