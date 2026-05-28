from rest_framework import serializers

from .models import Warehouse


class WarehouseListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Warehouse
        fields = ['id', 'name', 'city', 'country', 'is_active']


class WarehouseDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = Warehouse
        fields = [
            'id', 'name', 'address', 'city', 'country', 'phone',
            'capacity_m3', 'is_active', 'created_at', 'updated_at',
        ]


class WarehouseWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Warehouse
        fields = ['name', 'address', 'city', 'country', 'phone', 'capacity_m3', 'is_active']

    def validate_capacity_m3(self, value):
        if value is not None and value <= 0:
            raise serializers.ValidationError("La capacidad debe ser mayor a 0.")
        return value
