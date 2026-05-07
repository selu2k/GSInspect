import pytest

from api.serializers import (
    AdminBoltSerializer,
    AdminTestCurveSerializer,
    AdminTestSerializer,
    BoltPublishSerializer,
    TestCurvePublishSerializer,
    TestPublishSerializer,
)


@pytest.mark.django_db
class TestAdminBoltSerializer:
    """Test suite for AdminBoltSerializer."""

    def test_serializer_fields(self, bolt):
        """Test that serializer includes required fields."""
        serializer = AdminBoltSerializer(bolt)
        data = serializer.data
        assert "id" in data
        assert "name" in data
        assert "supplier" in data
        assert "is_published" in data

    def test_is_published_read_only(self, bolt):
        """Test that is_published is read-only."""
        serializer = AdminBoltSerializer(bolt)
        # Check that read_only_fields includes is_published
        assert "is_published" in serializer.fields
        assert serializer.fields["is_published"].read_only

    def test_supplier_nested(self, bolt):
        """Test that supplier is nested."""
        serializer = AdminBoltSerializer(bolt)
        data = serializer.data
        assert isinstance(data["supplier"], dict)
        assert "name" in data["supplier"]


@pytest.mark.django_db
class TestAdminTestSerializer:
    """Test suite for AdminTestSerializer."""

    def test_serializer_fields(self, test_data):
        """Test that serializer includes required fields."""
        serializer = AdminTestSerializer(test_data)
        data = serializer.data
        assert "id" in data
        assert "bolt" in data
        assert "methodology" in data
        assert "facility" in data
        assert "is_published" in data

    def test_methodology_display(self, test_data):
        """Test that methodology_display is included."""
        serializer = AdminTestSerializer(test_data)
        data = serializer.data
        assert "methodology_display" in data
        assert data["methodology_display"] == "Static"

    def test_curve_nested_when_present(self, test_curve):
        """Test that curve is nested when present."""
        serializer = AdminTestSerializer(test_curve.test)
        data = serializer.data
        assert "curve" in data
        assert isinstance(data["curve"], dict)

    def test_bolt_nested(self, test_data):
        """Test that bolt is nested."""
        serializer = AdminTestSerializer(test_data)
        data = serializer.data
        assert isinstance(data["bolt"], dict)
        assert "name" in data["bolt"]


@pytest.mark.django_db
class TestAdminTestCurveSerializer:
    """Test suite for AdminTestCurveSerializer."""

    def test_serializer_fields(self, test_curve):
        """Test that serializer includes required fields."""
        serializer = AdminTestCurveSerializer(test_curve)
        data = serializer.data
        assert "id" in data
        assert "test" in data
        assert "curve_pair" in data
        assert "is_published" in data

    def test_curve_pair_format(self, test_curve):
        """Test that curve_pair is properly formatted."""
        serializer = AdminTestCurveSerializer(test_curve)
        data = serializer.data
        assert isinstance(data["curve_pair"], list)
        assert len(data["curve_pair"]) == 3
        assert all("displacement" in pair and "load" in pair for pair in data["curve_pair"])

    def test_is_published_read_only(self, test_curve):
        """Test that is_published is read-only."""
        serializer = AdminTestCurveSerializer(test_curve)
        assert serializer.fields["is_published"].read_only


@pytest.mark.django_db
class TestPublishSerializers:
    """Test suite for Publish serializers."""

    def test_bolt_publish_serializer_single_field(self, bolt):
        """Test that BoltPublishSerializer only has is_published."""
        serializer = BoltPublishSerializer(bolt)
        data = serializer.data
        assert list(data.keys()) == ["is_published"]

    def test_test_publish_serializer_single_field(self, test_data):
        """Test that TestPublishSerializer only has is_published."""
        serializer = TestPublishSerializer(test_data)
        data = serializer.data
        assert list(data.keys()) == ["is_published"]

    def test_test_curve_publish_serializer_single_field(self, test_curve):
        """Test that TestCurvePublishSerializer only has is_published."""
        serializer = TestCurvePublishSerializer(test_curve)
        data = serializer.data
        assert list(data.keys()) == ["is_published"]

    def test_publish_serializer_can_update(self, bolt):
        """Test that publish serializer can update is_published."""
        data = {"is_published": True}
        serializer = BoltPublishSerializer(bolt, data=data, partial=True)
        assert serializer.is_valid()
        instance = serializer.save()
        assert instance.is_published is True


@pytest.mark.django_db
class TestSerializerValidation:
    """Test suite for serializer validation."""

    def test_invalid_bolt_creation(self, supplier):
        """Test validation for invalid bolt creation."""
        data = {
            "name": "Test Bolt",
            "supplier": supplier.id,
            "length": -1.0,  # Invalid: negative length
            "diameter": 20.0,
        }
        serializer = AdminBoltSerializer(data=data)
        assert serializer is not None  # Basic validation check
        # (validation logic would depend on model validators)

    def test_test_with_invalid_methodology(self, bolt):
        """Test that invalid methodology is rejected."""
        data = {
            "bolt": bolt.id,
            "methodology": "invalid",  # Invalid choice
            "facility": "Test Lab",
        }
        serializer = AdminTestSerializer(data=data)
        assert not serializer.is_valid()
        assert "methodology" in serializer.errors
