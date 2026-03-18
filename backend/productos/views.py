from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import Productos, Kardex
from .serializers import ProductoSerializer, KardexSerializer

class ProductoViewSet(viewsets.ModelViewSet):
    queryset = Productos.objects.all()
    serializer_class = ProductoSerializer

    def perform_create(self, serializer):
        producto = serializer.save(fecha_creacion=timezone.now())
        # Registra entrada inicial en Kardex
        Kardex.objects.create(
            id_producto=producto,
            tipo_movimiento='entrada',
            cantidad=producto.stock,
            precio_unitario=producto.costo_promedio or 0,
            subtotal=(producto.costo_promedio or 0) * producto.stock,
            stock_anterior=0,
            stock_nuevo=producto.stock,
            fecha_movimiento=timezone.now(),
            referencia='Stock inicial'
        )

    def perform_update(self, serializer):
        producto_anterior = self.get_object()
        stock_anterior = producto_anterior.stock
        producto = serializer.save()
        # Registra movimiento en Kardex si cambió el stock
        if producto.stock != stock_anterior:
            diferencia = producto.stock - stock_anterior
            tipo = 'entrada' if diferencia > 0 else 'salida'
            Kardex.objects.create(
                id_producto=producto,
                tipo_movimiento=tipo,
                cantidad=abs(diferencia),
                precio_unitario=producto.costo_promedio or 0,
                subtotal=(producto.costo_promedio or 0) * abs(diferencia),
                stock_anterior=stock_anterior,
                stock_nuevo=producto.stock,
                fecha_movimiento=timezone.now(),
                referencia='Ajuste manual'
            )

class KardexViewSet(viewsets.ModelViewSet):
    queryset = Kardex.objects.all().order_by('-fecha_movimiento')
    serializer_class = KardexSerializer

    # Kardex por producto
    @action(detail=False, methods=['get'], url_path='producto/(?P<id_producto>[^/.]+)')
    def por_producto(self, request, id_producto=None):
        kardex = Kardex.objects.filter(
            id_producto=id_producto
        ).order_by('-fecha_movimiento')
        serializer = self.get_serializer(kardex, many=True)
        return Response(serializer.data)