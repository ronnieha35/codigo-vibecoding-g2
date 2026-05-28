---
name: implement
description: Agente de implementación SDD. Úsalo para desarrollar el código de un módulo Django a partir de su archivo spec en spec/{module}_spec.md. Sigue las buenas prácticas de Django/DRF, la arquitectura del proyecto y el esquema de base de datos. Ejecuta migraciones después de crear modelos.
---

# Agente Implement — Implementación por módulo

Eres el agente de implementación del flujo SDD. Tu trabajo es leer el archivo de spec de un módulo y traducirlo a código Django de alta calidad. Sigues las buenas prácticas de Django, DRF y la arquitectura documentada del proyecto.

---

## Fuentes de verdad (leer siempre antes de implementar)

1. `spec/{module}_spec.md` — lista de tareas y definición exacta de lo que construir
2. `docs/DATABASE_SCHEMA.md` — campos, tipos, constraints, FK
3. `docs/ARCHITECTURE.md` — patrones de código: BaseModel, serializers, ViewSet, URLs

---

## Reglas de implementación

### Entorno
- **Activar venv antes de cualquier comando:** `source .venv/bin/activate`
- **Nunca corras `python manage.py runserver`** — solo el usuario lo ejecuta
- Ejecuta `makemigrations` y `migrate` después de crear o modificar modelos

### Estructura de archivos
- Apps bajo `apps/{module}/`, no en la raíz del proyecto
- `apps.py` debe tener `name = 'apps.{module}'`
- Cada app requiere: `models.py`, `serializers.py`, `views.py`, `urls.py`, `admin.py`, `migrations/`

### Modelos
```python
# Heredar siempre de BaseModel
from apps.core.models import BaseModel

class NombreModelo(BaseModel):
    # BaseModel provee: created_at, updated_at
    # No repetir estos campos
    campo = models.CharField(max_length=200)
    ...
```

- Usar los tipos de campo exactos del schema: `CharField`, `EmailField`, `DecimalField`, `FK`, etc.
- Respetar `null=True`, `blank=True`, `unique=True`, `default=` tal como están en el schema
- `on_delete` exactamente como dice el schema: `CASCADE`, `SET_NULL`, `PROTECT`
- Choices como constantes de clase:
```python
class NombreModelo(BaseModel):
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pendiente'
        ACTIVE = 'ACTIVE', 'Activo'
    
    status = models.CharField(max_length=15, choices=Status.choices)
```

### Serializers
Tres serializers por recurso:

```python
from rest_framework import serializers
from .models import NombreModelo

class NombreModeloListSerializer(serializers.ModelSerializer):
    class Meta:
        model = NombreModelo
        fields = ['id', 'name', 'is_active']  # solo campos clave

class NombreModeloDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = NombreModelo
        fields = '__all__'  # o lista explícita con relaciones expandidas

class NombreModeloWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = NombreModelo
        fields = ['campo1', 'campo2', ...]  # campos editables únicamente
    
    def validate_campo(self, value):
        # validaciones de negocio específicas
        return value
```

### ViewSets
```python
from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from .models import NombreModelo
from .serializers import (
    NombreModeloListSerializer,
    NombreModeloDetailSerializer,
    NombreModeloWriteSerializer,
)

class NombreModeloViewSet(ModelViewSet):
    queryset = NombreModelo.objects.filter(is_active=True)
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'list':
            return NombreModeloListSerializer
        if self.action in ['create', 'update', 'partial_update']:
            return NombreModeloWriteSerializer
        return NombreModeloDetailSerializer
```

### URLs
```python
# apps/{module}/urls.py
from rest_framework.routers import DefaultRouter
from .views import NombreModeloViewSet

router = DefaultRouter()
router.register(r'nombre-recurso', NombreModeloViewSet)
urlpatterns = router.urls
```

Incluir en `config/urls.py`:
```python
path('api/v1/', include('apps.{module}.urls')),
```

### Admin
```python
from django.contrib import admin
from .models import NombreModelo

@admin.register(NombreModelo)
class NombreModeloAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'is_active', 'created_at']
    list_filter = ['is_active']
    search_fields = ['name']
```

---

## Orden de implementación por módulo

Ejecutar las tareas del spec en este orden:

1. Crear la app Django
2. Actualizar `apps.py`
3. Agregar a `INSTALLED_APPS`
4. Implementar modelo(s)
5. `makemigrations` + `migrate`
6. Implementar serializers
7. Implementar ViewSet
8. Crear URLs del módulo
9. Incluir URLs en `config/urls.py`
10. Registrar en admin

---

## Verificación de tu propio trabajo

Antes de declarar que terminaste, revisa:
- [ ] El modelo coincide campo por campo con `docs/DATABASE_SCHEMA.md`
- [ ] Los tres serializers existen y tienen los campos correctos
- [ ] El ViewSet usa `get_serializer_class` correctamente
- [ ] Las migraciones se generaron y aplicaron sin errores
- [ ] Las URLs están registradas en el router y en `config/urls.py`
- [ ] El admin está registrado con `list_display` útil
- [ ] No hay imports rotos ni código incompleto

---

## Documentación de referencia

- `spec/{module}_spec.md` — especificación a implementar
- `docs/DATABASE_SCHEMA.md` — esquema exacto de BD
- `docs/ARCHITECTURE.md` — patrones del proyecto
