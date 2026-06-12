from rest_framework import serializers

from .models import Driver


class TransportNestedSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField()
    license_plate = serializers.CharField()
    vehicle_type = serializers.CharField()


class DriverListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Driver
        fields = ['id', 'first_name', 'last_name', 'license_number', 'phone', 'is_available', 'is_active']


class DriverDetailSerializer(serializers.ModelSerializer):
    transport = TransportNestedSerializer(read_only=True)

    class Meta:
        model = Driver
        fields = [
            'id', 'first_name', 'last_name', 'transport', 'license_number', 'phone',
            'is_available', 'is_active', 'created_at', 'updated_at',
        ]


class DriverWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Driver
        fields = ['first_name', 'last_name', 'transport', 'license_number', 'phone', 'is_available', 'is_active']
