from rest_framework import serializers

from .models import Customer


class CustomerListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = ['id', 'name', 'customer_type', 'email', 'city', 'is_active']


class CustomerDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = [
            'id', 'user', 'name', 'customer_type', 'email', 'phone',
            'address', 'city', 'country', 'tax_id', 'is_active',
            'created_at', 'updated_at',
        ]


class CustomerWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = [
            'user', 'name', 'customer_type', 'email', 'phone',
            'address', 'city', 'country', 'tax_id', 'is_active',
        ]
