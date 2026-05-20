from django.urls import path
from .views import RegistrarCambioView , ObtenerDetallesOrigenView

urlpatterns = [
    path('registrar/', RegistrarCambioView.as_view(), name='registrar-cambio'),
    path('detalles-origen/', ObtenerDetallesOrigenView.as_view(), name='detalles_origen'),
]