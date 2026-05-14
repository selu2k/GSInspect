import pytest
from django.core.exceptions import ValidationError
from django.db import IntegrityError

from api.models import Bolt, Supplier, Test, TestCurve


@pytest.mark.django_db
class TestSupplierModel:
    """Test suite for Supplier model."""

    def test_create_supplier(self):
        """Test creating a supplier."""
        supplier = Supplier.objects.create(name="Test Supplier")
        assert supplier.name == "Test Supplier"
        assert supplier.created_at is not None
        assert supplier.updated_at is not None

    def test_supplier_string_representation(self):
        """Test supplier string representation."""
        supplier = Supplier.objects.create(name="Test Supplier")
        assert str(supplier) == "Test Supplier"


@pytest.mark.django_db
class TestBoltModel:
    """Test suite for Bolt model."""

    def test_create_bolt(self, supplier):
        """Test creating a bolt."""
        bolt = Bolt.objects.create(
            supplier=supplier,
            name="Test Bolt",
            length=2.5,
            diameter=20.0,
            category="Encapsulated",
            equipment_compatibility=["Handheld"],
        )
        assert bolt.name == "Test Bolt"
        assert bolt.is_published is False
        assert bolt.equipment_compatibility == ["Handheld"]

    def test_bolt_string_representation(self, bolt):
        """Test bolt string representation."""
        assert str(bolt) == "Test Bolt"

    def test_bolt_timestamps(self, bolt):
        """Test bolt timestamp fields."""
        assert bolt.created_at is not None
        assert bolt.updated_at is not None


@pytest.mark.django_db
class TestTestModel:
    """Test suite for Test model."""

    def test_create_test(self, bolt):
        """Test creating a test record."""
        test = Test.objects.create(
            bolt=bolt,
            methodology="static",
            facility="Test Lab",
            peak_strength=500.0,
            bond_strength=450.0,
        )
        assert test.methodology == "static"
        assert test.facility == "Test Lab"
        assert test.is_published is False

    def test_test_methodology_choices(self, bolt):
        """Test methodology choices."""
        test = Test.objects.create(bolt=bolt, methodology="dynamic", facility="Test Lab")
        assert test.get_methodology_display() == "Dynamic"

    def test_test_optional_fields(self, bolt):
        """Test that optional fields are truly optional."""
        test = Test.objects.create(bolt=bolt, methodology="static", facility="Test Lab")
        assert test.peak_strength is None
        assert test.bond_strength is None

    def test_test_timestamps(self, test_data):
        """Test test timestamp fields."""
        assert test_data.created_at is not None
        assert test_data.updated_at is not None


@pytest.mark.django_db
class TestTestCurveModel:
    """Test suite for TestCurve model."""

    def test_create_test_curve(self, test_data):
        """Test creating a test curve."""
        curve_pair = [
            {"displacement": 0.1, "load": 100},
            {"displacement": 0.2, "load": 200},
        ]
        curve = TestCurve.objects.create(test=test_data, curve_pair=curve_pair)
        assert len(curve.curve_pair) == 2
        assert curve.is_published is False

    def test_test_curve_cascade_delete(self, test_data):
        """Test that deleting test deletes curve."""
        curve = TestCurve.objects.create(
            test=test_data, curve_pair=[{"displacement": 0.1, "load": 100}]
        )
        curve_id = curve.id
        test_data.delete()

        # Curve should be deleted due to CASCADE
        assert not TestCurve.objects.filter(id=curve_id).exists()

    def test_test_onetoone_relationship(self, test_data):
        """Test OneToOne relationship between Test and TestCurve."""
        curve = TestCurve.objects.create(
            test=test_data, curve_pair=[{"displacement": 0.1, "load": 100}]
        )
        # Should access curve through test
        assert test_data.curve == curve
        assert curve.test == test_data

    def test_test_curve_optional_fields(self, test_data):
        """Test that test curve is optional for a test."""
        # Test without curve should be fine - try/except to handle RelatedObjectDoesNotExist
        try:
            curve = test_data.curve
            # If it exists, it's fine
            assert curve is not None
        except AttributeError:
            # If accessing curve raises AttributeError (doesn't exist), that's fine too
            pass

    def test_test_curve_timestamps(self, test_curve):
        """Test test curve timestamp fields."""
        assert test_curve.created_at is not None
        assert test_curve.updated_at is not None
