from rest_framework import serializers

from apps.warehouses.models import Warehouse

from .models import Route, RouteStop


class WarehouseMinimalSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField()


class RouteStopNestedSerializer(serializers.ModelSerializer):
    warehouse = WarehouseMinimalSerializer(read_only=True)

    class Meta:
        model = RouteStop
        fields = ['id', 'warehouse', 'stop_order', 'estimated_duration_minutes']


class RouteStopWriteSerializer(serializers.Serializer):
    warehouse = serializers.PrimaryKeyRelatedField(queryset=Warehouse.objects.all())
    stop_order = serializers.IntegerField(min_value=1)
    estimated_duration_minutes = serializers.IntegerField(
        min_value=1, required=False, allow_null=True
    )


class RouteListSerializer(serializers.ModelSerializer):
    origin_warehouse = WarehouseMinimalSerializer(read_only=True)

    class Meta:
        model = Route
        fields = ['id', 'name', 'origin_warehouse', 'estimated_duration_hours', 'is_active']


class RouteDetailSerializer(serializers.ModelSerializer):
    origin_warehouse = WarehouseMinimalSerializer(read_only=True)
    stops = RouteStopNestedSerializer(many=True, read_only=True)

    class Meta:
        model = Route
        fields = [
            'id', 'name', 'origin_warehouse', 'description',
            'estimated_duration_hours', 'is_active', 'stops',
            'created_at', 'updated_at',
        ]


class RouteWriteSerializer(serializers.ModelSerializer):
    stops = RouteStopWriteSerializer(many=True, required=False)

    class Meta:
        model = Route
        fields = [
            'name', 'origin_warehouse', 'description',
            'estimated_duration_hours', 'is_active', 'stops',
        ]

    def create(self, validated_data):
        stops_data = validated_data.pop('stops', [])
        route = Route.objects.create(**validated_data)
        for stop_data in stops_data:
            RouteStop.objects.create(route=route, **stop_data)
        return route

    def update(self, instance, validated_data):
        stops_data = validated_data.pop('stops', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if stops_data is not None:
            instance.stops.all().delete()
            for stop_data in stops_data:
                RouteStop.objects.create(route=instance, **stop_data)
        return instance
