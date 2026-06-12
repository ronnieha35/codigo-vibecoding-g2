from rest_framework import serializers

from apps.products.models import Product

from .models import Shipment, ShipmentItem, ShipmentStatus, ShipmentStatusHistory


# --- Nested helpers (read-only) ---

class CustomerMinimalSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField()


class WarehouseMinimalWithCitySerializer(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField()
    city = serializers.CharField()


class DriverMinimalSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    license_number = serializers.CharField()


class TransportMinimalSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField()
    license_plate = serializers.CharField()
    vehicle_type = serializers.CharField()


class RouteMinimalSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField()


class ProductMinimalSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField()
    sku = serializers.CharField()


class UserMinimalSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    username = serializers.CharField()


# --- ShipmentItem ---

class ShipmentItemNestedSerializer(serializers.ModelSerializer):
    product = ProductMinimalSerializer(read_only=True)

    class Meta:
        model = ShipmentItem
        fields = ['id', 'product', 'quantity', 'unit_price']


class ShipmentItemWriteSerializer(serializers.Serializer):
    product = serializers.PrimaryKeyRelatedField(queryset=Product.objects.all())
    quantity = serializers.IntegerField(min_value=1)
    unit_price = serializers.DecimalField(
        max_digits=10, decimal_places=2, required=False, allow_null=True
    )


# --- ShipmentStatusHistory ---

class ShipmentStatusHistorySerializer(serializers.ModelSerializer):
    changed_by = UserMinimalSerializer(read_only=True)

    class Meta:
        model = ShipmentStatusHistory
        fields = ['id', 'status', 'changed_at', 'changed_by', 'notes']


# --- Shipment ---

class ShipmentListSerializer(serializers.ModelSerializer):
    customer = CustomerMinimalSerializer(read_only=True)

    class Meta:
        model = Shipment
        fields = [
            'id', 'customer', 'status', 'scheduled_date',
            'destination_city', 'destination_country',
            'shipping_cost', 'created_at',
        ]


class ShipmentDetailSerializer(serializers.ModelSerializer):
    customer = CustomerMinimalSerializer(read_only=True)
    origin_warehouse = WarehouseMinimalWithCitySerializer(read_only=True)
    driver = DriverMinimalSerializer(read_only=True)
    transport = TransportMinimalSerializer(read_only=True)
    route = RouteMinimalSerializer(read_only=True)
    items = ShipmentItemNestedSerializer(many=True, read_only=True)
    status_history = ShipmentStatusHistorySerializer(many=True, read_only=True)

    class Meta:
        model = Shipment
        fields = [
            'id',
            'customer_id', 'customer',
            'origin_warehouse_id', 'origin_warehouse',
            'driver_id', 'driver',
            'transport_id', 'transport',
            'route_id', 'route',
            'destination_address', 'destination_city', 'destination_country',
            'status', 'scheduled_date', 'delivered_at',
            'shipping_cost', 'total_weight_kg', 'notes',
            'items', 'status_history',
            'created_at', 'updated_at',
        ]


class ShipmentWriteSerializer(serializers.ModelSerializer):
    items = ShipmentItemWriteSerializer(many=True, required=False)

    class Meta:
        model = Shipment
        fields = [
            'customer', 'origin_warehouse', 'driver', 'transport', 'route',
            'destination_address', 'destination_city', 'destination_country',
            'status', 'scheduled_date', 'delivered_at',
            'shipping_cost', 'total_weight_kg', 'notes',
            'items',
        ]

    def _get_user(self):
        request = self.context.get('request')
        return request.user if request and request.user.is_authenticated else None

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        shipment = Shipment.objects.create(**validated_data)
        for item_data in items_data:
            ShipmentItem.objects.create(shipment=shipment, **item_data)
        ShipmentStatusHistory.objects.create(
            shipment=shipment,
            status=shipment.status,
            changed_by=self._get_user(),
        )
        return shipment

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None)
        old_status = instance.status
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if instance.status != old_status:
            ShipmentStatusHistory.objects.create(
                shipment=instance,
                status=instance.status,
                changed_by=self._get_user(),
            )
        if items_data is not None:
            instance.items.all().delete()
            for item_data in items_data:
                ShipmentItem.objects.create(shipment=instance, **item_data)
        return instance
