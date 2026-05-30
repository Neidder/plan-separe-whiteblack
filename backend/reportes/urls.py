from django.urls import path
from .views import MetricasFinancierasAPIView, TopProductosAPIView, EstadoInventarioAPIView

urlpatterns = [
    path('financieros', MetricasFinancierasAPIView.as_view(), name='metricas-financieras'),
    path('top-productos', TopProductosAPIView.as_view(), name='top-productos'),
    path('inventario', EstadoInventarioAPIView.as_view(), name='estado-inventario'),
]