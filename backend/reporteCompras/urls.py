from django.urls import path
from . import views

urlpatterns = [
    # 1. NUEVA RUTA BASE: Apunta a /api/reporte-compras/ (Trae la lista general)
    path('', views.reporte_compras_lista, name='reporte_compras_lista'),

    # 2. Tu ruta del detalle individual: /api/reporte-compras/1/
    path('<int:id_compra>/', views.api_reporte_compra_detalle, name='api_reporte_compra_detalle'),
]