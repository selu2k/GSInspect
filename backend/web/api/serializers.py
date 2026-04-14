from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import Bolt, Test, TestCurve

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Custom JWT serializer to include user profile information in the response payload.
    """
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        
        # Fallback to is_staff logic if custom role field is not present
        token['role'] = getattr(user, 'role', 'ADMIN' if user.is_staff else 'VIEWER')
        token['username'] = user.username
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        
        # Include extra user info in the JSON response body
        data['role'] = getattr(self.user, 'role', 'ADMIN' if self.user.is_staff else 'VIEWER')
        data['username'] = self.user.username
        data['department'] = getattr(self.user, 'department', None)
        
        return data

class BoltSerializer(serializers.ModelSerializer):
    """
    Serializer for Bolt model with nested supplier information.
    """
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
    """
    Serializer for TestCurve data points.
    """
    class Meta:
        model = TestCurve
        fields = [
            "id",
            "curve_pair",
        ]

class TestSerializer(serializers.ModelSerializer):
    """
    Serializer for Test with related curve and methodology display name.
    """
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
