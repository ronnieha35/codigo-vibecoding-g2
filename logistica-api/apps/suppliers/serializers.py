from rest_framework import serializers

from .models import Supplier


class SupplierListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = ['id', 'name', 'email', 'tax_id', 'is_active']


class SupplierDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = [
            'id', 'name', 'email', 'phone', 'address', 'city', 'country',
            'tax_id', 'contact_name', 'is_active', 'created_at', 'updated_at',
        ]


class SupplierWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = [
            'name', 'email', 'phone', 'address', 'city', 'country',
            'tax_id', 'contact_name', 'is_active',
        ]
