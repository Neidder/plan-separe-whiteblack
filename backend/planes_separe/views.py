from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import PlanesSepare, Entregas
from .serializers import PlanSepareSerializer, EntregaSerializer, CrearPlanSepareSerializer
from clientes.models import Clientes
from productos.models import Productos
from usuarios.models import Usuarios


class PlanSepareViewSet(viewsets.ModelViewSet):
    queryset = PlanesSepare.objects.all().order_by('-fecha_creacion')
    serializer_class = PlanSepareSerializer

    def create(self, request, *args, **kwargs):
        serializer = CrearPlanSepareSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data

        try:
            cliente = Clientes.objects.get(pk=data['id_cliente'])
            producto = Productos.objects.get(pk=data['id_producto'])
            vendedor = Usuarios.objects.get(pk=data['id_vendedor'])
        except Clientes.DoesNotExist:
            return Response({'error': 'Cliente no encontrado'},
                            status=status.HTTP_404_NOT_FOUND)
        except Productos.DoesNotExist:
            return Response({'error': 'Producto no encontrado'},
                            status=status.HTTP_404_NOT_FOUND)
        except Usuarios.DoesNotExist:
            return Response({'error': 'Vendedor no encontrado'},
                            status=status.HTTP_404_NOT_FOUND)

        # Verificar stock disponible
        if producto.stock < 1:
            return Response(
                {'error': f'El producto "{producto.nombre}" no tiene stock disponible'},
                status=status.HTTP_400_BAD_REQUEST
            )

        saldo_restante = data['valor_total'] - data['anticipo']

        # Determinar estado inicial
        if saldo_restante == 0:
            estado = 'pagado'
        else:
            estado = 'activo'

        plan = PlanesSepare.objects.create(
            id_cliente=cliente,
            id_producto=producto,
            id_vendedor=vendedor,
            valor_total=data['valor_total'],
            anticipo=data['anticipo'],
            saldo_restante=saldo_restante,
            fecha_inicio=timezone.now().date(),
            fecha_fin=data['fecha_fin'],
            estado=estado,
            fecha_creacion=timezone.now()
        )

        return Response({
            'mensaje': 'Plan separe creado correctamente',
            'id_plan_separe': plan.id_plan_separe,
            'cliente': cliente.nombre,
            'producto': producto.nombre,
            'valor_total': plan.valor_total,
            'anticipo': plan.anticipo,
            'saldo_restante': plan.saldo_restante,
            'fecha_inicio': plan.fecha_inicio,
            'fecha_fin': plan.fecha_fin,
            'estado': plan.estado
        }, status=status.HTTP_201_CREATED)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.estado == 'activo':
            return Response(
                {'error': 'No se puede eliminar un plan activo'},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            # Primero elimina los pagos asociados
            from pagos.models import Pagos
            Pagos.objects.filter(id_plan_separe=instance).delete()
            # Luego elimina el plan
            instance.delete()
            return Response(
                {'mensaje': 'Plan eliminado correctamente'},
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {'error': f'No se pudo eliminar el plan: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['get'], url_path='cliente/(?P<id_cliente>[^/.]+)')
    def por_cliente(self, request, id_cliente=None):
        planes = PlanesSepare.objects.filter(
            id_cliente=id_cliente
        ).order_by('-fecha_creacion')
        serializer = PlanSepareSerializer(planes, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def activos(self, request):
        planes = PlanesSepare.objects.filter(
            estado='activo'
        ).order_by('fecha_fin')
        serializer = PlanSepareSerializer(planes, many=True)
        return Response({
            'total_activos': planes.count(),
            'planes': serializer.data
        })

    @action(detail=False, methods=['get'])
    def vencidos(self, request):
        hoy = timezone.now().date()
        planes = PlanesSepare.objects.filter(
            estado='activo',
            fecha_fin__lt=hoy
        ).order_by('fecha_fin')
        serializer = PlanSepareSerializer(planes, many=True)
        return Response({
            'total_vencidos': planes.count(),
            'planes': serializer.data
        })


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