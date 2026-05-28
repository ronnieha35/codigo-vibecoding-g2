from drf_spectacular.utils import extend_schema, extend_schema_view

_VIEWSET_ACTIONS = ['list', 'create', 'retrieve', 'update', 'partial_update', 'destroy']


def viewset_tag(*tags):
    """Aplica tags de OpenAPI a todas las acciones de un ModelViewSet."""
    return extend_schema_view(
        **{action: extend_schema(tags=list(tags)) for action in _VIEWSET_ACTIONS}
    )
