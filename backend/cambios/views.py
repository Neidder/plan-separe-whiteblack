from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import ValidationError  # <- Corrección para lanzar excepciones de DRF
from django.db import transaction
from django.utils import timezone
from django.shortcuts import get_object_or_404

from .serializers import RegistrarCambioSerializer
from .models import Cambios, DetalleCambioEntrada, DetalleCambioSalida
from clientes.models import Clientes
from productos.models import Productos, ProductoTalla, Kardex
from ventas.models import Ventas
from planes_separe.models import PlanesSepare


# =========================================================================
# VISTA NUEVA: Obtiene los productos originales de la Venta o Plan Separe
# =========================================================================
class ObtenerDetallesOrigenView(APIView):
    def get(self, request):
        tipo = request.query_params.get('tipo')  # 'venta' o 'plan_separe'
        id_origen = request.query_params.get('id')

        if not tipo or not id_origen:
            return Response({"error": "Faltan parámetros obligatorios 'tipo' o 'id'"}, status=status.HTTP_400_BAD_REQUEST)

        # Buscar en las Ventas del negocio
        if tipo == 'venta':
            venta = Ventas.objects.filter(pk=id_origen).first()
            if not venta:
                return Response({"error": "La factura de venta especificada no existe."}, status=status.HTTP_404_NOT_FOUND)
            
            # Extraer los productos asociados mediante los detalles de la venta
            # Nota: Asegúrate de que el related_name en tus modelos coincida con '.detalles'
            detalles = [{
                "id_producto": d.id_producto.id_producto,
                "nombre_producto": d.id_producto.nombre,
                "talla": d.talla,
                "cantidad_maxima": d.cantidad,  # El tope máximo que puede devolver el cliente
                "precio_unitario": float(d.precio_unitario)
            } for d in venta.detalles.all()]

            return Response({
                "id_cliente": venta.id_cliente.id_cliente if venta.id_cliente else None,
                "nombre_cliente": f"{venta.id_cliente.nombre} {venta.id_cliente.apellido or ''}".strip() if venta.id_cliente else "Cliente ocasional",
                "detalles": detalles
            }, status=status.HTTP_200_OK)

        # Buscar en los Planes Separe del negocio
        elif tipo == 'plan_separe':
            plan = PlanesSepare.objects.filter(pk=id_origen).first()
            if not plan:
                return Response({"error": "El registro de Plan Separe especificado no existe."}, status=status.HTTP_404_NOT_FOUND)
            
            detalles = [{
                "id_producto": d.id_producto.id_producto,
                "nombre_producto": d.id_producto.nombre,
                "talla": d.talla,
                "cantidad_maxima": d.cantidad,
                "precio_unitario": float(d.precio_unitario)
            } for d in plan.detalles.all()]

            return Response({
                "id_cliente": plan.id_cliente.id_cliente,
                "nombre_cliente": f"{plan.id_cliente.nombre} {plan.id_cliente.apellido or ''}".strip(),
                "detalles": detalles
            }, status=status.HTTP_200_OK)

        return Response({"error": "Tipo de origen inválido. Use 'venta' o 'plan_separe'."}, status=status.HTTP_400_BAD_REQUEST)


# =========================================================================
# VISTA EXISTENTE: Procesa e inyecta la transacción del cambio
# =========================================================================
class RegistrarCambioView(APIView):

    @transaction.atomic
    def post(self, request):
        serializer = RegistrarCambioSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        
        # Intentar obtener el cliente si se envió en el JSON
        cliente = None
        if data.get('id_cliente'):
            cliente = Clientes.objects.filter(pk=data['id_cliente']).first()
        
        venta_obj = Ventas.objects.filter(pk=data.get('id_venta')).first() if data.get('id_venta') else None
        plan_obj = PlanesSepare.objects.filter(pk=data.get('id_plan_separe')).first() if data.get('id_plan_separe') else None

        # Si no pasaron id_cliente, pero la venta sí tenía un cliente real, lo tomamos de la venta
        if not cliente and venta_obj and venta_obj.id_cliente:
            cliente = venta_obj.id_cliente
            
        # Si es un Plan Separe, obligatoriamente hay un cliente real asociado
        if not cliente and plan_obj and plan_obj.id_cliente:
            cliente = plan_obj.id_cliente

        # Guardar la cabecera del cambio (puede quedar id_cliente en NULL en la BD si es ocasional)
        cambio = Cambios.objects.create(
            id_cliente=cliente,  # Puede ser None
            id_venta=venta_obj,
            id_plan_separe=plan_obj,
            fecha_cambio=timezone.now()
        )

        total_devuelto = 0
        total_nuevo = 0

        # === 1. PROCESAR PRODUCTOS DEVUELTOS (ENTRADAS) ===
        for item in data['productos_devueltos']:
            producto = get_object_or_404(Productos, pk=item['id_producto'])
            prod_talla, _ = ProductoTalla.objects.get_or_create(
                id_producto=producto, talla=item['talla'], defaults={'cantidad': 0}
            )
            stock_global_anterior = producto.stock
            prod_talla.checkpoint = True # Bandera de control interna si fuera necesaria
            prod_talla.cantidad += item['cantidad']
            prod_talla.save()

            producto.stock += item['cantidad']
            producto.save()

            subtotal_item = producto.precio_venta * item['cantidad']
            total_devuelto += subtotal_item

            DetalleCambioEntrada.objects.create(
                id_cambio=cambio, id_producto=producto,
                talla=item['talla'], cantidad=item['cantidad'], precio_unitario=producto.precio_venta
            )

            Kardex.objects.create(
                id_producto=producto, tipo_movimiento='DEV_ENTRADA', cantidad=item['cantidad'],
                precio_unitario=producto.precio_venta, subtotal=subtotal_item,
                stock_anterior=stock_global_anterior, stock_nuevo=producto.stock,
                fecha_movimiento=timezone.now(), referencia=f"Cambio ID: {cambio.id_cambio}"
            )

        # === 2. PROCESAR PRODUCTOS NUEVOS (SALIDAS) ===
        for item in data['productos_nuevos']:
            producto = get_object_or_404(Productos, pk=item['id_producto'])
            prod_talla = ProductoTalla.objects.filter(id_producto=producto, talla=item['talla']).first()
            
            if not prod_talla or prod_talla.cantidad < item['cantidad']:
                raise ValidationError({
                    "error": f"Stock insuficiente para '{producto.nombre}' en talla {item['talla']}."
                })

            stock_global_anterior = producto.stock
            prod_talla.cantidad -= item['cantidad']
            prod_talla.save()

            producto.stock -= item['cantidad']
            producto.save()

            subtotal_item = producto.precio_venta * item['cantidad']
            total_nuevo += subtotal_item

            DetalleCambioSalida.objects.create(
                id_cambio=cambio, id_producto=producto,
                talla=item['talla'], cantidad=item['cantidad'], precio_venta=producto.precio_venta
            )

            Kardex.objects.create(
                id_producto=producto, tipo_movimiento='DEV_SALIDA', cantidad=item['cantidad'],
                precio_unitario=producto.precio_venta, subtotal=subtotal_item,
                stock_anterior=stock_global_anterior, stock_nuevo=producto.stock,
                fecha_movimiento=timezone.now(), referencia=f"Cambio ID: {cambio.id_cambio}"
            )

        # === 3. EVALUACIÓN DE SALDOS FINANCIEROS Y VALIDACIÓN DE CLIENTE ===
        diferencia = total_nuevo - total_devuelto
        cambio.total_diferencia = diferencia
        cambio.save()

        mensaje = ""
        
        # CASO A: Queda dinero a favor del comprador
        if diferencia < 0:
            if not cliente:
                # !!! REGLA DE ORO: Si es un cliente ocasional, impedimos que continúe si sobra dinero !!!
                raise ValidationError({
                    "error": "No se puede generar saldo a favor para un 'Cliente ocasional'. Por favor, seleccione o registre un cliente real para conservar su saldo."
                })
            
            saldo_generado = abs(diferencia)
            cliente.saldo_a_favor += saldo_generado
            cliente.save()
            mensaje = f"Cambio exitoso. Se asignaron ${saldo_generado:,.0f} como saldo a favor de {cliente.nombre}."

        # CASO B: El cliente debe pagar un excedente
        elif diferencia > 0:
            if plan_obj:
                plan_obj.valor_total += diferencia
                plan_obj.saldo_restante += diferencia
                plan_obj.save()
                mensaje = f"Cambio exitoso. Se sumaron ${diferencia:,.0f} al saldo pendiente del Plan Separe."
            else:
                # Si fue una venta a cliente ocasional, simplemente se cobra la diferencia en la caja normal
                mensaje = f"Cambio exitoso. Se generó un excedente de ${diferencia:,.0f}. Cobrar el saldo restante en caja."
        
        # CASO C: El valor es idéntico
        else:
            mensaje = "Cambio realizado de forma directa (Diferencia de $0). No se requieren movimientos de dinero."

        return Response({
            "status": "success",
            "id_cambio": cambio.id_cambio,
            "total_devuelto": total_devuelto,
            "total_nuevo": total_nuevo,
            "diferencia": diferencia,
            "message": mensaje
        }, status=status.HTTP_201_CREATED)