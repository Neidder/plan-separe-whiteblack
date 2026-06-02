from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import ValidationError
from django.db import transaction
from django.utils import timezone
from django.shortcuts import get_object_or_404

from .serializers import RegistrarCambioSerializer
from .models import Cambios, DetalleCambioEntrada, DetalleCambioSalida
from clientes.models import Clientes
from productos.models import Productos, ProductoTalla, Kardex
from ventas.models import Ventas
from planes_separe.models import PlanesSepare


class ObtenerDetallesOrigenView(APIView):
    def get(self, request):
        tipo = request.query_params.get('tipo')
        id_origen = request.query_params.get('id')

        if not tipo or not id_origen:
            return Response({"error": "Faltan parámetros obligatorios 'tipo' o 'id'"}, status=status.HTTP_400_BAD_REQUEST)

        if tipo == 'venta':
            venta = Ventas.objects.filter(pk=id_origen).first()
            if not venta:
                return Response({"error": "La factura de venta especificada no existe."}, status=status.HTTP_404_NOT_FOUND)

            detalles = [{
                "id_producto": d.id_producto.id_producto,
                "nombre_producto": d.id_producto.nombre,
                "talla": d.talla,
                "cantidad_maxima": d.cantidad,
                "precio_unitario": float(d.precio_unitario),
                "subtotal": float(d.precio_unitario * d.cantidad)
            } for d in venta.detalles.all()]

            return Response({
                "id_cliente": venta.id_cliente.id_cliente if venta.id_cliente else None,
                "nombre_cliente": f"{venta.id_cliente.nombre} {venta.id_cliente.apellido or ''}".strip() if venta.id_cliente else "Cliente ocasional",
                "total_transaccion": float(venta.total),
                "detalles": detalles
            }, status=status.HTTP_200_OK)

        elif tipo == 'plan_separe':
            plan = PlanesSepare.objects.filter(pk=id_origen).first()
            if not plan:
                return Response({"error": "El registro de Plan Separe especificado no existe."}, status=status.HTTP_404_NOT_FOUND)

            detalles = [{
                "id_producto": d.id_producto.id_producto,
                "nombre_producto": d.id_producto.nombre,
                "talla": d.talla,
                "cantidad_maxima": d.cantidad,
                "precio_unitario": float(d.precio_unitario),
                "subtotal": float(d.precio_unitario * d.cantidad)
            } for d in plan.detalles.all()]

            return Response({
                "id_cliente": plan.id_cliente.id_cliente if plan.id_cliente else None,
                "nombre_cliente": f"{plan.id_cliente.nombre} {plan.id_cliente.apellido or ''}".strip() if plan.id_cliente else "Cliente ocasional",
                "total_transaccion": float(plan.valor_total),
                "detalles": detalles
            }, status=status.HTTP_200_OK)

        return Response({"error": "Tipo de origen inválido. Use 'venta' o 'plan_separe'."}, status=status.HTTP_400_BAD_REQUEST)


# =====================================================================
# NUEVA VISTA: Lista todos los cambios registrados con sus detalles
# =====================================================================
class ListarCambiosView(APIView):
    def get(self, request):
        cambios = Cambios.objects.all().order_by('-fecha_cambio')
        resultado = []

        for c in cambios:
            # Cliente
            nombre_cliente = "Cliente ocasional"
            if c.id_cliente:
                nombre_cliente = f"{c.id_cliente.nombre} {c.id_cliente.apellido or ''}".strip()

            # Origen del cambio
            tipo_origen = None
            id_origen = None
            if c.id_venta:
                tipo_origen = "venta"
                id_origen = c.id_venta.id_venta
            elif c.id_plan_separe:
                tipo_origen = "plan_separe"
                id_origen = c.id_plan_separe.id_plan_separe

            # Prendas devueltas (entradas al inventario)
            entradas = []
            for e in c.entradas.all():
                entradas.append({
                    "id_producto": e.id_producto.id_producto,
                    "nombre_producto": e.id_producto.nombre,
                    "talla": e.talla,
                    "cantidad": e.cantidad,
                    "precio_unitario": float(e.precio_unitario),
                    "subtotal": float(e.precio_unitario * e.cantidad),
                })

            # Prendas nuevas entregadas (salidas del inventario)
            salidas = []
            for s in c.salidas.all():
                salidas.append({
                    "id_producto": s.id_producto.id_producto,
                    "nombre_producto": s.id_producto.nombre,
                    "talla": s.talla,
                    "cantidad": s.cantidad,
                    "precio_venta": float(s.precio_venta),
                    "subtotal": float(s.precio_venta * s.cantidad),
                })

            resultado.append({
                "id_cambio": c.id_cambio,
                "fecha_cambio": c.fecha_cambio.strftime('%d/%m/%Y %H:%M') if c.fecha_cambio else "—",
                "nombre_cliente": nombre_cliente,
                "tipo_origen": tipo_origen,
                "id_origen": id_origen,
                "total_diferencia": float(c.total_diferencia),
                "entradas": entradas,
                "salidas": salidas,
            })

        return Response(resultado, status=status.HTTP_200_OK)


class RegistrarCambioView(APIView):

    @transaction.atomic
    def post(self, request):
        serializer = RegistrarCambioSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data

        cliente = None
        if data.get('id_cliente'):
            cliente = Clientes.objects.filter(pk=data['id_cliente']).first()

        venta_obj = Ventas.objects.filter(pk=data.get('id_venta')).first() if data.get('id_venta') else None
        plan_obj = PlanesSepare.objects.filter(pk=data.get('id_plan_separe')).first() if data.get('id_plan_separe') else None

        if not cliente and venta_obj and venta_obj.id_cliente:
            cliente = venta_obj.id_cliente

        if not cliente and plan_obj and plan_obj.id_cliente:
            cliente = plan_obj.id_cliente

        cambio = Cambios.objects.create(
            id_cliente=cliente,
            id_venta=venta_obj,
            id_plan_separe=plan_obj,
            fecha_cambio=timezone.now()
        )

        total_devuelto = 0
        total_nuevo = 0

        for item in data['productos_devueltos']:
            producto = get_object_or_404(Productos, pk=item['id_producto'])
            prod_talla, _ = ProductoTalla.objects.get_or_create(
                id_producto=producto, talla=item['talla'], defaults={'cantidad': 0}
            )
            stock_global_anterior = producto.stock
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

        diferencia = total_nuevo - total_devuelto
        cambio.total_diferencia = diferencia
        cambio.save()

        mensaje = ""

        if diferencia < 0:
            if not cliente:
                raise ValidationError({
                    "error": "No se puede generar saldo a favor para un 'Cliente ocasional'. Por favor, seleccione o registre un cliente real."
                })
            saldo_generado = abs(diferencia)
            cliente.saldo_a_favor += saldo_generado
            cliente.save()
            mensaje = f"Cambio exitoso. Se asignaron ${saldo_generado:,.0f} como saldo a favor de {cliente.nombre}."

        elif diferencia > 0:
            if plan_obj:
                plan_obj.valor_total += diferencia
                plan_obj.saldo_restante += diferencia
                plan_obj.save()
                mensaje = f"Cambio exitoso. Se sumaron ${diferencia:,.0f} al saldo pendiente del Plan Separe."
            else:
                mensaje = f"Cambio exitoso. Se generó un excedente de ${diferencia:,.0f}. Cobrar el saldo restante en caja."
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