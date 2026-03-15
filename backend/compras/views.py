from django.shortcuts import render
from rest_framework import viewsets
from .models import Compras, DetalleCompra
from .serializers import CompraSerializer, DetalleCompraSerializer
from productos.models import Productos, Kardex
from django.utils import timezone

class CompraViewSet(viewsets.ModelViewSet):
    queryset = Compras.objects.all()
    serializer_class = CompraSerializer

class DetalleCompraViewSet(viewsets.ModelViewSet):
    queryset = DetalleCompra.objects.all()
    serializer_class = DetalleCompraSerializer

producto = Productos.objects.get(id_producto=id_producto)

stock_anterior = producto.stock
producto.stock += cantidad
producto.save()

Kardex.objects.create(
    id_producto=producto,
    tipo_movimiento='ENTRADA',
    cantidad=cantidad,
    precio_unitario=precio,
    subtotal=precio * cantidad,
    stock_anterior=stock_anterior,
    stock_nuevo=producto.stock,
    fecha_movimiento=timezone.now(),
    referencia='COMPRA'
)

producto = Productos.objects.get(id_producto=id_producto)

stock_anterior = producto.stock
producto.stock -= cantidad
producto.save()

Kardex.objects.create(
    id_producto=producto,
    tipo_movimiento='SALIDA',
    cantidad=cantidad,
    precio_unitario=precio,
    subtotal=precio * cantidad,
    stock_anterior=stock_anterior,
    stock_nuevo=producto.stock,
    fecha_movimiento=timezone.now(),
    referencia='VENTA'
)