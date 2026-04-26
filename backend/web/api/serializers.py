from rest_framework import serializers
from .models import Bolt, Test, TestCurve, Supplier


class SupplierSerializer(serializers.ModelSerializer):
    """Serializer for Supplier admin operations."""
    
    class Meta:
        model = Supplier
        fields = [
            "id",
            "name",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


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
    methodology_display = serializers.CharField(source='get_methodology_display', read_only=True)
    
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


class BoltSerializer(serializers.ModelSerializer):
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
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]