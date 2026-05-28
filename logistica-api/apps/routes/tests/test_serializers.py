from decimal import Decimal

from django.test import TestCase

from apps.routes.models import Route, RouteStop
from apps.routes.serializers import RouteWriteSerializer, RouteStopWriteSerializer
from apps.warehouses.models import Warehouse


class RouteWriteSerializerTests(TestCase):
    def setUp(self):
        self.warehouse_bogota = Warehouse.objects.create(
            name='Bodega Central Bogotá',
            address='Calle 80 #45-12, Bogotá',
            city='Bogotá',
            country='Colombia',
            phone='+57 601 555 1100',
            capacity_m3=Decimal('2500.00'),
        )
        self.warehouse_medellin = Warehouse.objects.create(
            name='Centro Logístico Medellín',
            address='Carrera 48 #26-85, Medellín',
            city='Medellín',
            country='Colombia',
            phone='+57 604 555 2200',
            capacity_m3=Decimal('1800.00'),
        )
        self.valid_data = {
            'name': 'Bogotá - Medellín',
            'origin_warehouse': self.warehouse_bogota.id,
            'description': 'Ruta principal entre las dos ciudades más grandes.',
            'estimated_duration_hours': '8.50',
            'is_active': True,
        }

    # -------------------------
    # Happy path
    # -------------------------

    def test_valid_data_is_valid(self):
        serializer = RouteWriteSerializer(data=self.valid_data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_valid_data_creates_route(self):
        serializer = RouteWriteSerializer(data=self.valid_data)
        self.assertTrue(serializer.is_valid())
        route = serializer.save()
        self.assertIsInstance(route, Route)
        self.assertEqual(route.name, 'Bogotá - Medellín')
        self.assertEqual(route.origin_warehouse, self.warehouse_bogota)

    def test_valid_data_with_stops_creates_route_and_stops(self):
        data = {
            **self.valid_data,
            'stops': [
                {
                    'warehouse': self.warehouse_medellin.id,
                    'stop_order': 1,
                    'estimated_duration_minutes': 30,
                }
            ],
        }
        serializer = RouteWriteSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        route = serializer.save()
        self.assertEqual(route.stops.count(), 1)
        stop = route.stops.first()
        self.assertEqual(stop.warehouse, self.warehouse_medellin)
        self.assertEqual(stop.stop_order, 1)

    def test_stops_field_is_optional(self):
        data = {
            'name': 'Cali - Barranquilla',
            'origin_warehouse': self.warehouse_bogota.id,
        }
        serializer = RouteWriteSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        route = serializer.save()
        self.assertEqual(route.stops.count(), 0)

    def test_update_replaces_stops(self):
        route = Route.objects.create(
            name='Bogotá - Medellín',
            origin_warehouse=self.warehouse_bogota,
        )
        RouteStop.objects.create(
            route=route, warehouse=self.warehouse_medellin, stop_order=1
        )
        update_data = {
            'name': 'Bogotá - Medellín Actualizada',
            'origin_warehouse': self.warehouse_bogota.id,
            'stops': [
                {
                    'warehouse': self.warehouse_medellin.id,
                    'stop_order': 1,
                    'estimated_duration_minutes': 60,
                }
            ],
        }
        serializer = RouteWriteSerializer(instance=route, data=update_data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        updated_route = serializer.save()
        self.assertEqual(updated_route.stops.count(), 1)
        self.assertEqual(updated_route.stops.first().estimated_duration_minutes, 60)

    # -------------------------
    # Unhappy path
    # -------------------------

    def test_missing_name_is_invalid(self):
        data = {**self.valid_data}
        del data['name']
        serializer = RouteWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('name', serializer.errors)

    def test_blank_name_is_invalid(self):
        data = {**self.valid_data, 'name': ''}
        serializer = RouteWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('name', serializer.errors)

    def test_missing_origin_warehouse_is_invalid(self):
        data = {**self.valid_data}
        del data['origin_warehouse']
        serializer = RouteWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('origin_warehouse', serializer.errors)

    def test_nonexistent_origin_warehouse_is_invalid(self):
        data = {**self.valid_data, 'origin_warehouse': 99999}
        serializer = RouteWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('origin_warehouse', serializer.errors)

    # -------------------------
    # Edge case
    # -------------------------

    def test_is_active_read_only_not_affected(self):
        # is_active is writable in RouteWriteSerializer, but passing is_active=False should work
        data = {**self.valid_data, 'is_active': False}
        serializer = RouteWriteSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        route = serializer.save()
        self.assertFalse(route.is_active)

    def test_description_can_be_blank(self):
        data = {**self.valid_data, 'description': ''}
        serializer = RouteWriteSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_estimated_duration_hours_can_be_omitted(self):
        data = {k: v for k, v in self.valid_data.items() if k != 'estimated_duration_hours'}
        serializer = RouteWriteSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        route = serializer.save()
        self.assertIsNone(route.estimated_duration_hours)


class RouteStopWriteSerializerTests(TestCase):
    def setUp(self):
        self.warehouse_bogota = Warehouse.objects.create(
            name='Bodega Central Bogotá',
            address='Calle 80 #45-12, Bogotá',
            city='Bogotá',
            country='Colombia',
            phone='+57 601 555 1100',
            capacity_m3=Decimal('2500.00'),
        )
        self.valid_data = {
            'warehouse': self.warehouse_bogota.id,
            'stop_order': 1,
            'estimated_duration_minutes': 45,
        }

    # -------------------------
    # Happy path
    # -------------------------

    def test_valid_stop_data_is_valid(self):
        serializer = RouteStopWriteSerializer(data=self.valid_data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_stop_without_duration_is_valid(self):
        data = {'warehouse': self.warehouse_bogota.id, 'stop_order': 2}
        serializer = RouteStopWriteSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    # -------------------------
    # Unhappy path
    # -------------------------

    def test_missing_warehouse_is_invalid(self):
        data = {'stop_order': 1}
        serializer = RouteStopWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('warehouse', serializer.errors)

    def test_nonexistent_warehouse_is_invalid(self):
        data = {'warehouse': 99999, 'stop_order': 1}
        serializer = RouteStopWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('warehouse', serializer.errors)

    def test_missing_stop_order_is_invalid(self):
        data = {'warehouse': self.warehouse_bogota.id}
        serializer = RouteStopWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('stop_order', serializer.errors)

    def test_stop_order_zero_is_invalid(self):
        data = {**self.valid_data, 'stop_order': 0}
        serializer = RouteStopWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('stop_order', serializer.errors)

    def test_negative_stop_order_is_invalid(self):
        data = {**self.valid_data, 'stop_order': -1}
        serializer = RouteStopWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('stop_order', serializer.errors)

    # -------------------------
    # Edge case
    # -------------------------

    def test_estimated_duration_minutes_can_be_null(self):
        data = {
            'warehouse': self.warehouse_bogota.id,
            'stop_order': 3,
            'estimated_duration_minutes': None,
        }
        serializer = RouteStopWriteSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_duration_minutes_minimum_one(self):
        # min_value=1 on estimated_duration_minutes
        data = {**self.valid_data, 'estimated_duration_minutes': 0}
        serializer = RouteStopWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('estimated_duration_minutes', serializer.errors)
