from rest_framework import serializers

from .models import Product


class SupplierNestedSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField()


class WarehouseNestedSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField()
    city = serializers.CharField()


class ProductListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ['id', 'name', 'sku', 'category', 'unit_price', 'stock_quantity', 'is_active']


class ProductDetailSerializer(serializers.ModelSerializer):
    supplier = SupplierNestedSerializer(read_only=True)
    warehouse = WarehouseNestedSerializer(read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'supplier', 'warehouse', 'name', 'sku', 'description', 'category',
            'unit_price', 'weight_kg', 'length_cm', 'width_cm', 'height_cm',
            'stock_quantity', 'is_active', 'created_at', 'updated_at',
        ]


class ProductWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = [
            'supplier', 'warehouse', 'name', 'sku', 'description', 'category',
            'unit_price', 'weight_kg', 'length_cm', 'width_cm', 'height_cm',
            'stock_quantity', 'is_active',
        ]

    def _validate_positive(self, value, field_name):
        if value is not None and value <= 0:
            raise serializers.ValidationError(f'{field_name} debe ser mayor a 0.')
        return value

    def validate_unit_price(self, value):
        return self._validate_positive(value, 'El precio unitario')

    def validate_weight_kg(self, value):
        return self._validate_positive(value, 'El peso')

    def validate_length_cm(self, value):
        return self._validate_positive(value, 'El largo')

    def validate_width_cm(self, value):
        return self._validate_positive(value, 'El ancho')

    def validate_height_cm(self, value):
        return self._validate_positive(value, 'El alto')
