from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import Pagos
from .serializers import PagoSerializer, CrearPagoSerializer
from planes_separe.models import PlanesSepare
from usuarios.models import Usuarios


class PagoViewSet(viewsets.ModelViewSet):
    queryset = Pagos.objects.all().order_by('-fecha_pago')
    serializer_class = PagoSerializer

    def create(self, request, *args, **kwargs):
        serializer = CrearPagoSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data

        # Verificar que el plan existe
        try:
            plan = PlanesSepare.objects.get(pk=data['id_plan_separe'])
        except PlanesSepare.DoesNotExist:
            return Response(
                {'error': 'Plan separe no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )

            # Verificar que el plan esté activo
        if plan.estado == 'pagado':
            return Response(
                {'error': 'Este plan ya está pagado, no se pueden registrar más pagos'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if plan.estado == 'cancelado':
            return Response(
                {'error': 'Este plan está cancelado, no se pueden registrar pagos'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Verificar que el monto no supere el saldo restante
        if data['monto'] > plan.saldo_restante:
            return Response({
                'error': f'El monto ${data["monto"]} supera el saldo restante ${plan.saldo_restante}'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Verificar que el usuario existe
        try:
            usuario = Usuarios.objects.get(pk=data['registrado_por'])
        except Usuarios.DoesNotExist:
            return Response(
                {'error': 'Usuario no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Registrar el pago
        pago = Pagos.objects.create(
            id_plan_separe=plan,
            monto=data['monto'],
            metodo_pago=data['metodo_pago'],
            fecha_pago=timezone.now(),
            registrado_por=usuario
        )

        # Actualizar saldo restante del plan
        plan.saldo_restante -= data['monto']

        # Si el saldo llega a 0 el plan se marca como pagado
        if plan.saldo_restante <= 0:
            plan.saldo_restante = 0
            plan.estado = 'pagado'

        plan.save()

        return Response({
            'mensaje': 'Pago registrado correctamente',
            'id_pago': pago.id_pago,
            'monto_pagado': pago.monto,
            'metodo_pago': pago.metodo_pago,
            'saldo_anterior': plan.saldo_restante + data['monto'],
            'saldo_restante': plan.saldo_restante,
            'estado_plan': plan.estado
        }, status=status.HTTP_201_CREATED)

    def destroy(self, request, *args, **kwargs):
        return Response(
            {'error': 'Los pagos no se pueden eliminar'},
            status=status.HTTP_400_BAD_REQUEST
        )

    @action(detail=False, methods=['get'], url_path='plan/(?P<id_plan>[^/.]+)')
    def por_plan(self, request, id_plan=None):
        try:
            plan = PlanesSepare.objects.get(pk=id_plan)
        except PlanesSepare.DoesNotExist:
            return Response(
                {'error': 'Plan no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )

        pagos = Pagos.objects.filter(
            id_plan_separe=plan
        ).order_by('-fecha_pago')
        serializer = PagoSerializer(pagos, many=True)

        return Response({
            'plan': {
                'id_plan_separe': plan.id_plan_separe,
                'valor_total': plan.valor_total,
                'anticipo': plan.anticipo,
                'saldo_restante': plan.saldo_restante,
                'estado': plan.estado,
                'fecha_fin': plan.fecha_fin
            },
            'total_pagos': pagos.count(),
            'pagos': serializer.data
        })