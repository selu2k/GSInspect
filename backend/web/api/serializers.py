from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import Bolt, Supplier, Test, TestCurve


class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Custom JWT serializer to include user profile information in the token and response.
    """

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Injects user role and metadata into the JWT payload
        token["role"] = getattr(user, "role", "ADMIN" if user.is_staff else "VIEWER")
        token["username"] = user.username
        return token

    def validate(self, attrs):
        data = super().validate(attrs)

        # Includes user metadata in the initial login JSON response
        data["role"] = getattr(self.user, "role", "ADMIN" if self.user.is_staff else "VIEWER")
        data["username"] = self.user.username
        data["department"] = getattr(self.user, "department", None)

        return data


class SupplierSerializer(serializers.ModelSerializer):
    """Serializer for Supplier admin operations."""

    class Meta:
        model = Supplier
        fields = [
            "id",
            "name",
        ]
        read_only_fields = ["id"]


class PublicBoltSerializer(serializers.ModelSerializer):
    supplier = serializers.SerializerMethodField()

    class Meta:
        model = Bolt
        fields = [
            "id",
            "name",
            "supplier",
            "category",
            "length",
            "diameter",
            "equipment_compatibility",
        ]

    def get_supplier(self, obj):
        return {
            "id": obj.supplier.id,
            "name": obj.supplier.name,
        }


class PublicTestCurveSerializer(serializers.ModelSerializer):
    """Serializer for TestCurve data points."""

    class Meta:
        model = TestCurve
        fields = [
            "id",
            "curve_pair",
        ]


class PublicTestSerializer(serializers.ModelSerializer):
    """Serializer for Test with related curve."""

    curve = PublicTestCurveSerializer(read_only=True)
    methodology_display = serializers.CharField(source="get_methodology_display", read_only=True)

    class Meta:
        model = Test
        fields = [
            "id",
            "methodology",
            "methodology_display",
            "facility",
            "installation_method",
            "encapsulation_method",
            "peak_strength",
            "bond_strength",
            "yield_strength",
            "ultimate_deformation",
            "stiffness",
            "loading_rate",
            "energy_absorption",
            "number_of_drops",
            "curve",
        ]


class AdminBoltSerializer(serializers.ModelSerializer):
    """Serializer for Bolt admin operations."""

    class Meta:
        model = Bolt
        fields = [
            "id",
            "name",
            "supplier",
            "length",
            "diameter",
            "category",
            "equipment_compatibility",
            "is_published",
        ]
        read_only_fields = ["id", "is_published"]

    def to_representation(self, instance):
        """Return nested supplier in responses."""
        ret = super().to_representation(instance)
        ret["supplier"] = SupplierSerializer(instance.supplier).data
        return ret


class AdminTestCurveSerializer(serializers.ModelSerializer):
    """Serializer for TestCurve admin operations."""

    class Meta:
        model = TestCurve
        fields = [
            "id",
            "test",
            "curve_pair",
            "is_published",
        ]
        read_only_fields = ["id", "is_published"]


class AdminTestSerializer(serializers.ModelSerializer):
    """Serializer for Test admin operations."""

    methodology_display = serializers.CharField(source="get_methodology_display", read_only=True)
    curve = AdminTestCurveSerializer(read_only=True)

    class Meta:
        model = Test
        fields = [
            "id",
            "bolt",
            "methodology",
            "methodology_display",
            "facility",
            "installation_method",
            "encapsulation_method",
            "peak_strength",
            "bond_strength",
            "yield_strength",
            "ultimate_deformation",
            "stiffness",
            "loading_rate",
            "energy_absorption",
            "number_of_drops",
            "is_published",
            "curve",
        ]
        read_only_fields = ["id", "is_published"]

    def to_representation(self, instance):
        """Return nested bolt in responses."""
        ret = super().to_representation(instance)
        ret["bolt"] = AdminBoltSerializer(instance.bolt).data
        return ret


class AdminBoltMinimalSerializer(serializers.ModelSerializer):
    """Minimal Bolt serializer with only id and name for list views."""

    class Meta:
        model = Bolt
        fields = ["id", "name"]


class AdminTestListSerializer(serializers.ModelSerializer):
    """Serializer for Test list operations - minimal fields for performance."""

    bolt = AdminBoltMinimalSerializer(read_only=True)

    class Meta:
        model = Test
        fields = [
            "id",
            "bolt",
            "methodology",
            "facility",
        ]
        read_only_fields = ["id", "methodology", "facility"]


class BoltPublishSerializer(serializers.ModelSerializer):
    """Serializer for publishing/unpublishing bolts - only accepts is_published field."""

    class Meta:
        model = Bolt
        fields = ["is_published"]


class TestPublishSerializer(serializers.ModelSerializer):
    """Serializer for publishing/unpublishing tests - only accepts is_published field."""

    class Meta:
        model = Test
        fields = ["is_published"]


class TestCurvePublishSerializer(serializers.ModelSerializer):
    """Serializer for publishing/unpublishing test curves - only accepts is_published field."""

    class Meta:
        model = TestCurve
        fields = ["is_published"]
