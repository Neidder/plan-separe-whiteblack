from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import PlanesSepare, DetallePlanSepare, Entregas
from .serializers import PlanSepareSerializer, EntregaSerializer, CrearPlanSepareSerializer
from clientes.models import Clientes
from productos.models import Productos, Kardex
from productos.models import ProductoTalla
from usuarios.models import Usuarios


class PlanSepareViewSet(viewsets.ModelViewSet):
    queryset = PlanesSepare.objects.all().order_by('-fecha_creacion')
    serializer_class = PlanSepareSerializer

    def create(self, request, *args, **kwargs):
        serializer = CrearPlanSepareSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        detalles = data.get('detalles', [])

        # Validar cliente y vendedor
        try:
            cliente = Clientes.objects.get(pk=data['id_cliente'])
            vendedor = Usuarios.objects.get(pk=data['id_vendedor'])
        except Clientes.DoesNotExist:
            return Response({'error': 'Cliente no encontrado'}, status=status.HTTP_404_NOT_FOUND)
        except Usuarios.DoesNotExist:
            return Response({'error': 'Vendedor no encontrado'}, status=status.HTTP_404_NOT_FOUND)

        # Validar stock de cada producto y talla
        for d in detalles:
            try:
                producto = Productos.objects.get(pk=d['id_producto'])
            except Productos.DoesNotExist:
                return Response(
                    {'error': f'Producto #{d["id_producto"]} no encontrado'},
                    status=status.HTTP_404_NOT_FOUND
                )
            # Verificar stock de la talla específica
            try:
                talla_obj = ProductoTalla.objects.get(
                    id_producto=producto,
                    talla=d['talla'].upper()
                )
                if talla_obj.cantidad < d['cantidad']:
                    return Response({
                        'error': f'Stock insuficiente para {producto.nombre} talla {d["talla"]}. Disponible: {talla_obj.cantidad}'
                    }, status=status.HTTP_400_BAD_REQUEST)
            except ProductoTalla.DoesNotExist:
                return Response({
                    'error': f'La talla {d["talla"]} no existe para {producto.nombre}'
                }, status=status.HTTP_400_BAD_REQUEST)

        # Calcular valor total
        valor_total = sum(
            d['cantidad'] * d['precio_unitario']
            for d in detalles
        )
        anticipo = data['anticipo']

        if anticipo > valor_total:
            return Response(
                {'error': 'El anticipo no puede ser mayor al valor total'},
                status=status.HTTP_400_BAD_REQUEST
            )

        saldo_restante = valor_total - anticipo
        estado = 'pagado' if saldo_restante == 0 else 'activo'

        # Crear el plan — id_producto queda en None porque ahora es múltiple
        plan = PlanesSepare.objects.create(
            id_cliente=cliente,
            id_producto=None,
            id_vendedor=vendedor,
            valor_total=valor_total,
            anticipo=anticipo,
            saldo_restante=saldo_restante,
            fecha_inicio=timezone.now().date(),
            fecha_fin=data['fecha_fin'],
            estado=estado,
            fecha_creacion=timezone.now()
        )

        # Crear detalles y descontar stock
        for d in detalles:
            producto = Productos.objects.get(pk=d['id_producto'])
            subtotal = d['cantidad'] * d['precio_unitario']

            DetallePlanSepare.objects.create(
                id_plan_separe=plan,
                id_producto=producto,
                talla=d['talla'].upper(),
                cantidad=d['cantidad'],
                precio_unitario=d['precio_unitario'],
                subtotal=subtotal
            )

            # Descontar stock de la talla
            talla_obj = ProductoTalla.objects.get(
                id_producto=producto,
                talla=d['talla'].upper()
            )
            talla_obj.cantidad -= d['cantidad']
            talla_obj.save()

            # Descontar stock general del producto
            stock_anterior = producto.stock
            producto.stock -= d['cantidad']
            producto.save()

            # Registrar en Kardex
            Kardex.objects.create(
                id_producto=producto,
                tipo_movimiento='salida',
                cantidad=d['cantidad'],
                precio_unitario=d['precio_unitario'],
                subtotal=subtotal,
                stock_anterior=stock_anterior,
                stock_nuevo=producto.stock,
                fecha_movimiento=timezone.now(),
                referencia=f'Plan Separe #{plan.id_plan_separe}'
            )

        return Response({
            'mensaje': 'Plan separe creado correctamente',
            'id_plan_separe': plan.id_plan_separe,
            'cliente': cliente.nombre,
            'valor_total': valor_total,
            'anticipo': anticipo,
            'saldo_restante': saldo_restante,
            'estado': estado,
            'productos': len(detalles)
        }, status=status.HTTP_201_CREATED)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.estado == 'activo':
            return Response(
                {'error': 'No se puede cancelar un plan activo con pagos pendientes'},
                status=status.HTTP_400_BAD_REQUEST
            )
        instance.estado = 'cancelado'
        instance.save()
        return Response(
            {'mensaje': f'Plan #{instance.id_plan_separe} cancelado correctamente'},
            status=status.HTTP_200_OK
        )

    @action(detail=False, methods=['get'])
    def activos(self, request):
        planes = PlanesSepare.objects.filter(estado='activo').order_by('fecha_fin')
        serializer = PlanSepareSerializer(planes, many=True)
        return Response({'total_activos': planes.count(), 'planes': serializer.data})

    @action(detail=False, methods=['get'])
    def vencidos(self, request):
        hoy = timezone.now().date()
        planes = PlanesSepare.objects.filter(estado='activo', fecha_fin__lt=hoy).order_by('fecha_fin')
        serializer = PlanSepareSerializer(planes, many=True)
        return Response({'total_vencidos': planes.count(), 'planes': serializer.data})

    @action(detail=False, methods=['get'], url_path='cliente/(?P<id_cliente>[^/.]+)')
    def por_cliente(self, request, id_cliente=None):
        planes = PlanesSepare.objects.filter(id_cliente=id_cliente).order_by('-fecha_creacion')
        serializer = PlanSepareSerializer(planes, many=True)
        return Response(serializer.data)


class EntregaViewSet(viewsets.ModelViewSet):
    queryset = Entregas.objects.all().order_by('-fecha_entrega')
    serializer_class = EntregaSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            serializer.save(fecha_entrega=timezone.now())
            return Response({
                'mensaje': 'Entrega registrada correctamente',
                'data': serializer.data
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)