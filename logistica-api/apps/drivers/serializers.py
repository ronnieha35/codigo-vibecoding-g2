from rest_framework import serializers

from .models import Driver


class UserNestedSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    username = serializers.CharField()
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    email = serializers.EmailField()


class TransportNestedSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField()
    license_plate = serializers.CharField()
    vehicle_type = serializers.CharField()


class DriverListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Driver
        fields = ['id', 'license_number', 'phone', 'is_available', 'is_active']


class DriverDetailSerializer(serializers.ModelSerializer):
    user = UserNestedSerializer(read_only=True)
    transport = TransportNestedSerializer(read_only=True)

    class Meta:
        model = Driver
        fields = [
            'id', 'user', 'transport', 'license_number', 'phone',
            'is_available', 'is_active', 'created_at', 'updated_at',
        ]


class DriverWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Driver
        fields = ['user', 'transport', 'license_number', 'phone', 'is_available', 'is_active']
