from rest_framework import serializers
from .models import Bolt, Test, TestCurve


class BoltSerializer(serializers.ModelSerializer):
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


class TestCurveSerializer(serializers.ModelSerializer):
    """Serializer for TestCurve data points."""
    
    class Meta:
        model = TestCurve
        fields = [
            "id",
            "curve_pair",
        ]


class TestSerializer(serializers.ModelSerializer):
    """Serializer for Test with related curve."""
    curve = TestCurveSerializer(read_only=True)
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


