import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from api.models import Bolt, Supplier, Test, TestCurve

User = get_user_model()


@pytest.fixture
def api_client():
    """API client fixture."""
    return APIClient()


@pytest.fixture
def admin_user(db):
    """Create an admin user."""
    user = User.objects.create_superuser(
        username="admin", email="admin@test.com", password="testpass123"
    )
    return user


@pytest.fixture
def regular_user(db):
    """Create a regular user."""
    user = User.objects.create_user(username="user", email="user@test.com", password="testpass123")
    return user


@pytest.fixture
def admin_token(admin_user):
    """Generate JWT token for admin user."""
    refresh = RefreshToken.for_user(admin_user)
    return str(refresh.access_token)


@pytest.fixture
def user_token(regular_user):
    """Generate JWT token for regular user."""
    refresh = RefreshToken.for_user(regular_user)
    return str(refresh.access_token)


@pytest.fixture
def authenticated_client(api_client, admin_token):
    """API client with admin authentication."""
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {admin_token}")
    return api_client


@pytest.fixture
def supplier(db):
    """Create a test supplier."""
    return Supplier.objects.create(name="Test Supplier")


@pytest.fixture
def bolt(db, supplier):
    """Create a test bolt."""
    return Bolt.objects.create(
        supplier=supplier,
        name="Test Bolt",
        length=2.5,
        diameter=20.0,
        category="Encapsulated",
        equipment_compatibility=["Handheld", "Mechanized"],
    )


@pytest.fixture
def test_data(db, bolt):
    """Create a test record."""
    return Test.objects.create(
        bolt=bolt,
        methodology="static",
        facility="Test Lab",
        peak_strength=500.0,
        bond_strength=450.0,
    )


@pytest.fixture
def test_curve(db, test_data):
    """Create a test curve."""
    return TestCurve.objects.create(
        test=test_data,
        curve_pair=[
            {"displacement": 0.1, "load": 100},
            {"displacement": 0.2, "load": 200},
            {"displacement": 0.3, "load": 300},
        ],
    )
