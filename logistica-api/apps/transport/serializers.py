from rest_framework import serializers

from .models import Transport


class TransportListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transport
        fields = ['id', 'name', 'license_plate', 'vehicle_type', 'is_available', 'is_active']


class TransportDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transport
        fields = [
            'id', 'name', 'license_plate', 'vehicle_type', 'capacity_kg',
            'capacity_m3', 'is_available', 'is_active', 'created_at', 'updated_at',
        ]


class TransportWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transport
        fields = [
            'name', 'license_plate', 'vehicle_type', 'capacity_kg',
            'capacity_m3', 'is_available', 'is_active',
        ]

    def _validate_positive(self, value, label):
        if value is not None and value <= 0:
            raise serializers.ValidationError(f'{label} debe ser mayor a 0.')
        return value

    def validate_capacity_kg(self, value):
        return self._validate_positive(value, 'La capacidad en kg')

    def validate_capacity_m3(self, value):
        return self._validate_positive(value, 'La capacidad en m³')
