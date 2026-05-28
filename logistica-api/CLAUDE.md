# CLAUDE.md

Este archivo proporciona orientación a Claude Code (claude.ai/code) al trabajar con el código de este repositorio.

## Contexto y alcance del proyecto

API REST de logística para gestión de envíos de productos tecnológicos. Construida con Django REST Framework siguiendo buenas prácticas (serializers, viewsets, routers, permisos, validaciones).

### Módulos del sistema

| Módulo | App Django | Descripción |
|---|---|---|
| Cliente | `customers` | Empresa o persona que genera envíos |
| Envío | `shipments` | Unidad central de negocio — origen, destino, estado, fecha de entrega, costo calculado |
| Productos | `products` | Productos de tecnología que serán enviados |
| Transporte | `transport` | Medio de entrega de productos al cliente |
| Conductor | `drivers` | Persona asignada al transporte |
| Ruta | `routes` | Secuencia de paradas del transporte |
| Almacén | `warehouses` | Punto de partida y almacenamiento de productos |
| Proveedor | `suppliers` | Empresas que venden los productos |

`shipments` es el módulo central — la mayoría de los demás módulos se relacionan con él.

---

## Documentación

La carpeta `docs/` contiene documentación técnica del proyecto:
- [`docs/DATABASE_SCHEMA.md`](docs/DATABASE_SCHEMA.md) — esquema completo de BD, relaciones y definición de columnas
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — arquitectura del MVP: estructura de carpetas, patrón de ViewSets/serializers, autenticación JWT, orden de desarrollo

## Skills y herramientas

- **django-skills** (`saaspegasus/django-skills`) está instalado — usar sus skills para tareas Django (modelos, migraciones, vistas, serializers, tests). Invocar con `/django-skills:<nombre-skill>` según corresponda.
- **code-review** está instalado — usar para revisar PRs y cambios antes de mergear.

## Reglas del proyecto

- **Comunicación y documentación:** siempre en español — comentarios en código, respuestas, descripciones de PR, mensajes de error, este archivo.
- **Código y artefactos técnicos:** siempre en inglés — nombres de variables, funciones, clases, archivos, carpetas, tablas de BD, columnas, ramas de git, commits.
- **Entorno virtual:** antes de ejecutar cualquier comando dentro del proyecto, activar el entorno virtual con `source .venv/bin/activate`.
- **Servidor de desarrollo:** `python manage.py runserver` NUNCA se ejecuta de forma automática — siempre lo corre el usuario manualmente. Todos los demás comandos de `manage.py` pueden ejecutarse sin restricción.
- **Esquema de BD:** leer [`docs/DATABASE_SCHEMA.md`](docs/DATABASE_SCHEMA.md) antes de trabajar en cualquier modelo, migración, serializer o vista — es la fuente de verdad de tablas, columnas y relaciones.

## Comandos

```bash
# Siempre activar el entorno virtual primero
source .venv/bin/activate

# Servidor de desarrollo — SOLO EL USUARIO LO EJECUTA MANUALMENTE
# python manage.py runserver

# Migraciones
python manage.py makemigrations
python manage.py migrate

# Tests
python manage.py test
python manage.py test products.tests.SomeTestCase  # clase individual
```

## Metodología SDD y Agentes

Este proyecto usa **SDD (Spec Driven Development)** con 4 agentes personalizados en `.claude/agents/`.

**Flujo obligatorio para desarrollar cualquier módulo:**
```
Spec → Implement → Validate → (si errores: Implement fix → Validate) → siguiente módulo
```

| Agente | Archivo | Rol |
|---|---|---|
| Orquestador | `orchestrator.md` | Dirige el flujo SDD completo — no escribe código |
| Spec | `spec.md` | Analiza reqs y crea `spec/{module}_spec.md` con tareas exactas |
| Implement | `implement.md` | Implementa código según spec + docs |
| Validator | `validator.md` | Revisa código vs spec + arquitectura — no escribe código |

**Ante cualquier tarea de desarrollo de un módulo, invocar primero al agente `orchestrator`.**

Los specs generados se guardan en `spec/`. Los reportes de error de validación en `spec/{module}_validation_errors.md`.

Documentación adicional de alcance y orden de desarrollo: [`docs/SCOPE.md`](docs/SCOPE.md)

---

## Arquitectura

API de logística con Django 6.0.5 + Django REST Framework 3.17.1.

**Estructura del proyecto:**
- `config/` — raíz del proyecto Django: `settings.py`, `urls.py`, `wsgi.py`, `asgi.py`
- `products/` — app inicial (modelos/vistas/tests vacíos, sin migraciones aún)

**Estado actual — pendiente de configurar:**
- `rest_framework` y `products` NO están en `INSTALLED_APPS` — agregar ambos al construir el primer endpoint
- `config/urls.py` solo tiene `admin/` — incluir URLs de products cuando existan vistas
- `python-decouple` instalado pero `settings.py` usa `SECRET_KEY` hardcodeado — migrar a `.env` + `config()` antes de agregar secretos
- `psycopg2-binary` instalado; BD actual es SQLite — se espera migración a PostgreSQL

**Patrón para agregar endpoints:**
1. Definir modelo en `products/models.py`
2. Crear serializador (agregar `products/serializers.py`)
3. Agregar vista en `products/views.py` (usar `APIView` o `ViewSet` de DRF)
4. Conectar URL en `products/urls.py`, luego `include()` en `config/urls.py`
5. Ejecutar `makemigrations` + `migrate`
