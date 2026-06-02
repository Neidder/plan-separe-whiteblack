from django.urls import path
from .views import RegistrarCambioView, ObtenerDetallesOrigenView, ListarCambiosView

urlpatterns = [
    path('registrar/', RegistrarCambioView.as_view(), name='registrar-cambio'),
    path('detalles-origen/', ObtenerDetallesOrigenView.as_view(), name='detalles_origen'),
    path('listar/', ListarCambiosView.as_view(), name='listar-cambios'),
]