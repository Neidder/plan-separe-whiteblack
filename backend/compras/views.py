from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db import transaction
from .models import Compras, DetalleCompra
from .serializers import CompraSerializer, DetalleCompraSerializer, CrearCompraSerializer
from productos.models import Productos, Kardex
from proveedores.models import Proveedores
from usuarios.models import Usuarios


class CompraViewSet(viewsets.ModelViewSet):
    queryset = Compras.objects.all().order_by('-fecha_compra')
    serializer_class = CompraSerializer

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        serializer = CrearCompraSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        detalles = data.get('detalles', [])

        if not detalles:
            return Response(
                {'error': 'La compra debe tener al menos un producto'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            proveedor = Proveedores.objects.get(pk=data['id_proveedor'])
            usuario = Usuarios.objects.get(pk=data['id_usuario'])
        except Proveedores.DoesNotExist:
            return Response({'error': 'Proveedor no encontrado'},
                            status=status.HTTP_404_NOT_FOUND)
        except Usuarios.DoesNotExist:
            return Response({'error': 'Usuario no encontrado'},
                            status=status.HTTP_404_NOT_FOUND)

        # Calcular total
        total = sum(d['cantidad'] * d['precio_unitario'] for d in detalles)

        # Crear la compra
        compra = Compras.objects.create(
            id_proveedor=proveedor,
            id_usuario=usuario,
            fecha_compra=timezone.now(),
            total=total
        )

        # Crear detalles y actualizar stock
        for detalle in detalles:
            try:
                producto = Productos.objects.get(pk=detalle['id_producto'].pk)
            except Productos.DoesNotExist:
                return Response(
                    {'error': f'Producto no encontrado'},
                    status=status.HTTP_404_NOT_FOUND
                )

            cantidad = detalle['cantidad']
            precio_unitario = detalle['precio_unitario']
            subtotal = cantidad * precio_unitario

            DetalleCompra.objects.create(
                id_compra=compra,
                id_producto=producto,
                cantidad=cantidad,
                precio_unitario=precio_unitario,
                subtotal=subtotal
            )

            # Actualizar stock del producto
            stock_anterior = producto.stock
            producto.stock += cantidad

            # Recalcular costo promedio
            costo_actual = (producto.costo_promedio or 0) * stock_anterior
            costo_nuevo = precio_unitario * cantidad
            producto.costo_promedio = (costo_actual + costo_nuevo) / producto.stock
            producto.save()

            # Registrar en Kardex
            Kardex.objects.create(
                id_producto=producto,
                tipo_movimiento='entrada',
                cantidad=cantidad,
                precio_unitario=precio_unitario,
                subtotal=subtotal,
                stock_anterior=stock_anterior,
                stock_nuevo=producto.stock,
                fecha_movimiento=timezone.now(),
                referencia=f'Compra #{compra.id_compra}'
            )

        return Response({
            'mensaje': 'Compra registrada correctamente',
            'id_compra': compra.id_compra,
            'total': total,
            'productos_ingresados': len(detalles)
        }, status=status.HTTP_201_CREATED)

    def destroy(self, request, *args, **kwargs):
        return Response(
            {'error': 'Las compras no se pueden eliminar por ser registros contables'},
            status=status.HTTP_400_BAD_REQUEST
        )

    @action(detail=True, methods=['get'])
    def detalles(self, request, pk=None):
        compra = self.get_object()
        detalles = DetalleCompra.objects.filter(id_compra=compra)
        serializer = DetalleCompraSerializer(detalles, many=True)
        return Response({
            'compra': CompraSerializer(compra).data,
            'detalles': serializer.data
        })


class DetalleCompraViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = DetalleCompra.objects.all()
    serializer_class = DetalleCompraSerializer