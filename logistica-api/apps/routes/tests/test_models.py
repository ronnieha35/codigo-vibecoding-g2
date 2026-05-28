from decimal import Decimal

from django.db import IntegrityError
from django.test import TestCase

from apps.routes.models import Route, RouteStop
from apps.warehouses.models import Warehouse


class RouteModelTests(TestCase):
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

    # -------------------------
    # Happy path
    # -------------------------

    def test_create_route_success(self):
        route = Route.objects.create(
            name='Bogotá - Medellín',
            origin_warehouse=self.warehouse_bogota,
            description='Ruta principal entre las dos ciudades más grandes.',
            estimated_duration_hours=Decimal('8.50'),
        )
        self.assertEqual(Route.objects.count(), 1)
        self.assertEqual(route.name, 'Bogotá - Medellín')
        self.assertEqual(route.origin_warehouse, self.warehouse_bogota)
        self.assertTrue(route.is_active)

    def test_str_representation(self):
        route = Route.objects.create(
            name='Cali - Barranquilla',
            origin_warehouse=self.warehouse_bogota,
        )
        self.assertEqual(str(route), 'Cali - Barranquilla')

    def test_create_route_without_optional_fields(self):
        route = Route.objects.create(
            name='Bogotá - Medellín Express',
            origin_warehouse=self.warehouse_bogota,
        )
        self.assertIsNone(route.estimated_duration_hours)
        self.assertEqual(route.description, '')

    def test_is_active_defaults_to_true(self):
        route = Route.objects.create(
            name='Bogotá - Cali',
            origin_warehouse=self.warehouse_bogota,
        )
        self.assertTrue(route.is_active)

    # -------------------------
    # Unhappy path
    # -------------------------

    def test_missing_name_raises_integrity_error(self):
        with self.assertRaises(IntegrityError):
            Route.objects.create(
                name=None,
                origin_warehouse=self.warehouse_bogota,
            )

    def test_missing_origin_warehouse_raises_integrity_error(self):
        with self.assertRaises(IntegrityError):
            Route.objects.create(
                name='Bogotá - Medellín',
                origin_warehouse_id=None,
            )

    # -------------------------
    # Edge case
    # -------------------------

    def test_cascade_delete_warehouse_deletes_route(self):
        route = Route.objects.create(
            name='Bogotá - Medellín',
            origin_warehouse=self.warehouse_bogota,
        )
        route_id = route.id
        self.warehouse_bogota.delete()
        self.assertFalse(Route.objects.filter(id=route_id).exists())

    def test_route_name_is_not_unique(self):
        Route.objects.create(
            name='Bogotá - Medellín',
            origin_warehouse=self.warehouse_bogota,
        )
        # Second route with same name should be allowed (no unique constraint on name)
        route2 = Route.objects.create(
            name='Bogotá - Medellín',
            origin_warehouse=self.warehouse_medellin,
        )
        self.assertEqual(Route.objects.count(), 2)
        self.assertEqual(route2.name, 'Bogotá - Medellín')

    def test_estimated_duration_hours_can_be_null(self):
        route = Route.objects.create(
            name='Bogotá - Bucaramanga',
            origin_warehouse=self.warehouse_bogota,
            estimated_duration_hours=None,
        )
        route.refresh_from_db()
        self.assertIsNone(route.estimated_duration_hours)

    def test_created_at_and_updated_at_auto_set(self):
        route = Route.objects.create(
            name='Bogotá - Pereira',
            origin_warehouse=self.warehouse_bogota,
        )
        self.assertIsNotNone(route.created_at)
        self.assertIsNotNone(route.updated_at)


class RouteStopModelTests(TestCase):
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
        self.warehouse_manizales = Warehouse.objects.create(
            name='Almacén Manizales',
            address='Avenida Santander #65-20, Manizales',
            city='Manizales',
            country='Colombia',
            phone='+57 606 555 3300',
            capacity_m3=Decimal('900.00'),
        )
        self.route = Route.objects.create(
            name='Bogotá - Medellín vía Manizales',
            origin_warehouse=self.warehouse_bogota,
            estimated_duration_hours=Decimal('10.00'),
        )
        self.route2 = Route.objects.create(
            name='Cali - Barranquilla',
            origin_warehouse=self.warehouse_medellin,
            estimated_duration_hours=Decimal('14.00'),
        )

    # -------------------------
    # Happy path
    # -------------------------

    def test_create_routestop_success(self):
        stop = RouteStop.objects.create(
            route=self.route,
            warehouse=self.warehouse_manizales,
            stop_order=1,
            estimated_duration_minutes=45,
        )
        self.assertEqual(RouteStop.objects.count(), 1)
        self.assertEqual(stop.route, self.route)
        self.assertEqual(stop.warehouse, self.warehouse_manizales)
        self.assertEqual(stop.stop_order, 1)
        self.assertEqual(stop.estimated_duration_minutes, 45)

    def test_str_representation(self):
        stop = RouteStop.objects.create(
            route=self.route,
            warehouse=self.warehouse_manizales,
            stop_order=2,
        )
        self.assertEqual(str(stop), 'Bogotá - Medellín vía Manizales — parada 2')

    def test_create_routestop_without_optional_duration(self):
        stop = RouteStop.objects.create(
            route=self.route,
            warehouse=self.warehouse_medellin,
            stop_order=1,
        )
        self.assertIsNone(stop.estimated_duration_minutes)

    def test_multiple_stops_in_same_route(self):
        RouteStop.objects.create(
            route=self.route, warehouse=self.warehouse_manizales, stop_order=1
        )
        RouteStop.objects.create(
            route=self.route, warehouse=self.warehouse_medellin, stop_order=2
        )
        self.assertEqual(RouteStop.objects.filter(route=self.route).count(), 2)

    # -------------------------
    # Unhappy path
    # -------------------------

    def test_unique_constraint_route_stop_order_raises_integrity_error(self):
        RouteStop.objects.create(
            route=self.route,
            warehouse=self.warehouse_manizales,
            stop_order=1,
        )
        with self.assertRaises(IntegrityError):
            RouteStop.objects.create(
                route=self.route,
                warehouse=self.warehouse_medellin,
                stop_order=1,
            )

    def test_missing_route_raises_integrity_error(self):
        with self.assertRaises(IntegrityError):
            RouteStop.objects.create(
                route_id=None,
                warehouse=self.warehouse_manizales,
                stop_order=1,
            )

    def test_missing_warehouse_raises_integrity_error(self):
        with self.assertRaises(IntegrityError):
            RouteStop.objects.create(
                route=self.route,
                warehouse_id=None,
                stop_order=1,
            )

    # -------------------------
    # Edge case
    # -------------------------

    def test_same_stop_order_in_different_routes_is_allowed(self):
        stop1 = RouteStop.objects.create(
            route=self.route, warehouse=self.warehouse_manizales, stop_order=1
        )
        stop2 = RouteStop.objects.create(
            route=self.route2, warehouse=self.warehouse_medellin, stop_order=1
        )
        self.assertEqual(stop1.stop_order, stop2.stop_order)
        self.assertEqual(RouteStop.objects.count(), 2)

    def test_cascade_delete_route_deletes_routestop(self):
        stop = RouteStop.objects.create(
            route=self.route,
            warehouse=self.warehouse_manizales,
            stop_order=1,
        )
        stop_id = stop.id
        self.route.delete()
        self.assertFalse(RouteStop.objects.filter(id=stop_id).exists())

    def test_cascade_delete_warehouse_deletes_routestop(self):
        stop = RouteStop.objects.create(
            route=self.route,
            warehouse=self.warehouse_manizales,
            stop_order=1,
        )
        stop_id = stop.id
        self.warehouse_manizales.delete()
        self.assertFalse(RouteStop.objects.filter(id=stop_id).exists())

    def test_stops_ordered_by_stop_order(self):
        RouteStop.objects.create(
            route=self.route, warehouse=self.warehouse_medellin, stop_order=3
        )
        RouteStop.objects.create(
            route=self.route, warehouse=self.warehouse_manizales, stop_order=1
        )
        stops = list(RouteStop.objects.filter(route=self.route))
        self.assertEqual(stops[0].stop_order, 1)
        self.assertEqual(stops[1].stop_order, 3)
