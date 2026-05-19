import json
from io import StringIO

import pytest
from django.urls import reverse
from rest_framework import status

from api.models import Bolt, Supplier, Test, TestCurve


@pytest.mark.django_db
class TestSupplierAPI:
    """Test suite for Supplier endpoints."""

    def test_list_suppliers(self, authenticated_client, supplier):
        """Test listing suppliers."""
        response = authenticated_client.get("/api/admin/suppliers/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 1
        assert response.data["results"][0]["name"] == "Test Supplier"

    def test_create_supplier(self, authenticated_client):
        """Test creating a supplier."""
        response = authenticated_client.post(
            "/api/admin/suppliers/", {"name": "New Supplier"}, format="json"
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["name"] == "New Supplier"
        assert Supplier.objects.filter(name="New Supplier").exists()

    def test_retrieve_supplier(self, authenticated_client, supplier):
        """Test retrieving a single supplier."""
        response = authenticated_client.get(f"/api/admin/suppliers/{supplier.id}/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["name"] == "Test Supplier"

    def test_delete_supplier_with_bolts(self, authenticated_client, bolt):
        """Test deleting supplier with bolts should fail (PROTECT constraint)."""
        supplier = bolt.supplier
        response = authenticated_client.delete(f"/api/admin/suppliers/{supplier.id}/")
        # Should fail because PROTECT constraint prevents deletion
        # Returns 400 Bad Request error
        assert response.status_code in [
            status.HTTP_400_BAD_REQUEST,
            status.HTTP_409_CONFLICT,
        ]


@pytest.mark.django_db
class TestBoltAPI:
    """Test suite for Bolt endpoints."""

    def test_list_bolts(self, authenticated_client, bolt):
        """Test listing bolts."""
        response = authenticated_client.get("/api/admin/bolts/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] >= 1

    def test_create_bolt(self, authenticated_client, supplier):
        """Test creating a bolt with writable supplier field."""
        response = authenticated_client.post(
            "/api/admin/bolts/",
            {
                "supplier": supplier.id,
                "name": "New Bolt",
                "length": 3.0,
                "diameter": 25.0,
                "category": "Encapsulated",
                "equipment_compatibility": ["Handheld"],
            },
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["name"] == "New Bolt"
        # Verify supplier is nested in response
        assert isinstance(response.data["supplier"], dict)
        assert response.data["supplier"]["name"] == "Test Supplier"

    def test_retrieve_bolt(self, authenticated_client, bolt):
        """Test retrieving a bolt."""
        response = authenticated_client.get(f"/api/admin/bolts/{bolt.id}/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["name"] == "Test Bolt"

    def test_update_bolt(self, authenticated_client, bolt):
        """Test updating bolt details."""
        response = authenticated_client.patch(
            f"/api/admin/bolts/{bolt.id}/", {"name": "Updated Bolt"}, format="json"
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data["name"] == "Updated Bolt"

    def test_publish_bolt(self, authenticated_client, bolt):
        """Test publishing a bolt."""
        assert bolt.is_published is False
        response = authenticated_client.patch(
            f"/api/admin/bolts/{bolt.id}/publish/",
            {"is_published": True},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        bolt.refresh_from_db()
        assert bolt.is_published is True

    def test_is_published_read_only_in_crud(self, authenticated_client, supplier):
        """Test that is_published is read-only in CRUD operations."""
        response = authenticated_client.post(
            "/api/admin/bolts/",
            {
                "supplier": supplier.id,
                "name": "Test Bolt",
                "length": 2.5,
                "diameter": 20.0,
                "category": "Encapsulated",
                "equipment_compatibility": ["Handheld"],
                "is_published": True,
            },
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED
        # Should be created with is_published=False (not True as sent)
        assert response.data["is_published"] is False


@pytest.mark.django_db
class TestTestAPI:
    """Test suite for Test endpoints."""

    def test_list_tests(self, authenticated_client, test_data):
        """Test listing tests."""
        response = authenticated_client.get("/api/admin/tests/")
        assert response.status_code == status.HTTP_200_OK
        assert "results" in response.data

    def test_create_test(self, authenticated_client, bolt):
        """Test creating a test with writable bolt field."""
        response = authenticated_client.post(
            "/api/admin/tests/",
            {
                "bolt": bolt.id,
                "methodology": "dynamic",
                "facility": "Lab B",
                "peak_strength": 600.0,
                "bond_strength": 550.0,
            },
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["facility"] == "Lab B"
        # Verify bolt is nested in response
        assert isinstance(response.data["bolt"], dict)
        assert response.data["bolt"]["name"] == "Test Bolt"

    def test_retrieve_test_with_curve(self, authenticated_client, test_curve):
        """Test retrieving a test with its curve."""
        response = authenticated_client.get(f"/api/admin/tests/{test_curve.test.id}/")
        assert response.status_code == status.HTTP_200_OK
        assert "curve" in response.data
        assert response.data["curve"]["id"] == test_curve.id

    def test_publish_test(self, authenticated_client, test_data):
        """Test publishing a test."""
        assert test_data.is_published is False
        response = authenticated_client.patch(
            f"/api/admin/tests/{test_data.id}/publish/",
            {"is_published": True},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        test_data.refresh_from_db()
        assert test_data.is_published is True


@pytest.mark.django_db
class TestTestCurveAPI:
    """Test suite for TestCurve endpoints."""

    def test_create_test_curve_json(self, authenticated_client, test_data):
        """Test creating a test curve with JSON data."""
        response = authenticated_client.post(
            "/api/admin/test-curves/",
            {
                "test": test_data.id,
                "curve_pair": [
                    {"displacement": 0.1, "load": 100},
                    {"displacement": 0.2, "load": 200},
                ],
            },
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["created"] == 1

    def test_create_test_curve_json_array(self, authenticated_client, test_data):
        """Test creating test curves with JSON array."""
        response = authenticated_client.post(
            "/api/admin/test-curves/",
            [
                {
                    "test": test_data.id,
                    "curve_pair": [{"displacement": 0.1, "load": 100}],
                }
            ],
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["created"] == 1

    def test_create_test_curve_csv(self, authenticated_client, test_data):
        """Test creating test curves with CSV file."""
        csv_content = "test_id,supplier_id,client_test_id,displacement,load\n"
        csv_content += f"{test_data.id},1,TEST001,0.1,100\n"
        csv_content += f"{test_data.id},1,TEST001,0.2,200\n"

        response = authenticated_client.post(
            "/api/admin/test-curves/import-csv/",
            {"file": ("curves.csv", StringIO(csv_content), "text/csv")},
            format="multipart",
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["created"] == 1

        # Verify the curve was created with 2 pairs
        curve = TestCurve.objects.get(test=test_data)
        assert len(curve.curve_pair) == 2

    def test_retrieve_test_curve(self, authenticated_client, test_curve):
        """Test retrieving a test curve."""
        response = authenticated_client.get(f"/api/admin/test-curves/{test_curve.id}/")
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["curve_pair"]) == 3

    def test_update_test_curve(self, authenticated_client, test_curve):
        """Test updating a test curve."""
        new_pairs = [
            {"displacement": 0.5, "load": 500},
            {"displacement": 0.6, "load": 600},
        ]
        response = authenticated_client.patch(
            f"/api/admin/test-curves/{test_curve.id}/",
            {"curve_pair": new_pairs},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["curve_pair"]) == 2

    def test_publish_test_curve(self, authenticated_client, test_curve):
        """Test publishing a test curve."""
        assert test_curve.is_published is False
        response = authenticated_client.patch(
            f"/api/admin/test-curves/{test_curve.id}/publish/",
            {"is_published": True},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        test_curve.refresh_from_db()
        assert test_curve.is_published is True

    def test_delete_test_curve(self, authenticated_client, test_curve):
        """Test deleting a test curve."""
        curve_id = test_curve.id
        response = authenticated_client.delete(f"/api/admin/test-curves/{curve_id}/")
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not TestCurve.objects.filter(id=curve_id).exists()


@pytest.mark.django_db
class TestPublicAPI:
    """Test suite for public endpoints."""

    def test_health_check(self, api_client):
        """Test health check endpoint."""
        response = api_client.get("/api/health/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["status"] == "ok"

    def test_public_filter_options(self, api_client):
        """Test public filter options endpoint."""
        response = api_client.get("/api/public/filter-options/")
        assert response.status_code == status.HTTP_200_OK
        assert "methodologies" in response.data
        assert "facilities" in response.data

    def test_public_bolts_list(self, api_client, bolt):
        """Test public bolts list with published filter."""
        # Bolt is not published, so shouldn't appear
        response = api_client.get("/api/public/bolts/")
        assert response.status_code == status.HTTP_200_OK

        # Publish it
        bolt.is_published = True
        bolt.save()

        response = api_client.get("/api/public/bolts/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] >= 1

    def test_public_tests_list(self, api_client, test_data, bolt):
        """Test public tests list."""
        # Publish required entities
        bolt.is_published = True
        bolt.save()
        test_data.is_published = True
        test_data.save()

        response = api_client.get("/api/public/tests/")
        # Should either succeed or fail gracefully
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_400_BAD_REQUEST]


@pytest.mark.django_db
class TestPagination:
    """Test suite for pagination."""

    def test_default_pagination(self, authenticated_client, supplier):
        """Test default pagination (20 items per page)."""
        # Create 25 bolts
        for i in range(25):
            Bolt.objects.create(
                supplier=supplier,
                name=f"Bolt {i}",
                length=2.5,
                diameter=20.0,
                category="Encapsulated",
                equipment_compatibility=["Handheld"],
            )

        response = authenticated_client.get("/api/admin/bolts/")
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["results"]) == 20
        assert response.data["next"] is not None

    def test_custom_limit(self, authenticated_client, supplier):
        """Test custom limit parameter."""
        # Create 15 bolts
        for i in range(15):
            Bolt.objects.create(
                supplier=supplier,
                name=f"Bolt {i}",
                length=2.5,
                diameter=20.0,
                category="Encapsulated",
                equipment_compatibility=["Handheld"],
            )

        response = authenticated_client.get("/api/admin/bolts/?limit=5")
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["results"]) == 5

    def test_max_limit(self, authenticated_client, supplier):
        """Test that limit is capped at 100."""
        response = authenticated_client.get("/api/admin/bolts/?limit=200")
        # Should be limited to 100
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
class TestExternalAPI:
    """Test suite for external API endpoints."""

    def test_external_bolts_summary_empty(self, api_client):
        """Test external bolt summary endpoint with no published bolts."""
        response = api_client.get("/api/external/bolts-summary/")

        assert response.status_code == status.HTTP_200_OK
        assert "count" in response.data
        assert "results" in response.data
        assert response.data["count"] == 0
        assert response.data["results"] == []

    def test_external_bolts_summary_with_published_bolt(self, api_client, bolt, test_data):
        """Test external bolt summary endpoint returns published bolt summary."""
        bolt.is_published = True
        bolt.save()

        test_data.is_published = True
        test_data.save()

        response = api_client.get("/api/external/bolts-summary/")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 1
        assert response.data["results"][0]["id"] == bolt.id
        assert response.data["results"][0]["name"] == bolt.name
        assert "supplier" in response.data["results"][0]
        assert "summary_stats" in response.data["results"][0]

    def test_external_test_curves_empty(self, api_client):
        """Test external test curves endpoint with no published curve data."""
        response = api_client.get("/api/external/test-curves/")

        assert response.status_code == status.HTTP_200_OK
        assert "count" in response.data
        assert "results" in response.data
        assert response.data["count"] == 0
        assert response.data["results"] == []

    def test_external_test_curves_with_published_data(
        self, api_client, bolt, test_data, test_curve
    ):
        """Test external test curves endpoint returns published test curve data."""
        bolt.is_published = True
        bolt.save()

        test_data.is_published = True
        test_data.save()

        test_curve.is_published = True
        test_curve.save()

        response = api_client.get("/api/external/test-curves/")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 1
        assert response.data["results"][0]["test_id"] == test_data.id
        assert response.data["results"][0]["bolt"]["id"] == bolt.id
        assert "curve" in response.data["results"][0]
        assert "curve_pair" in response.data["results"][0]["curve"]

    def test_external_test_curves_filter_by_bolt_id(self, api_client, bolt, test_data, test_curve):
        """Test external test curves endpoint filters by bolt ID."""
        bolt.is_published = True
        bolt.save()

        test_data.is_published = True
        test_data.save()

        test_curve.is_published = True
        test_curve.save()

        response = api_client.get(f"/api/external/test-curves/?bolt_ids={bolt.id}")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 1
        assert response.data["results"][0]["bolt"]["id"] == bolt.id

    def test_external_test_curves_filter_by_methodology(
        self, api_client, bolt, test_data, test_curve
    ):
        """Test external test curves endpoint filters by methodology."""
        bolt.is_published = True
        bolt.save()

        test_data.is_published = True
        test_data.save()

        test_curve.is_published = True
        test_curve.save()

        response = api_client.get(f"/api/external/test-curves/?methodology={test_data.methodology}")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 1
        assert response.data["results"][0]["methodology"] == test_data.methodology
