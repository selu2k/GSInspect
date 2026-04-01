from rest_framework import serializers
from .models import Bolt


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
