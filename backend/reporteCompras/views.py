from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from compras.models import Compras  

# =====================================================================
# 1. NUEVA VISTA: LISTA GENERAL DE TODAS LAS COMPRAS (Para la Tabla)
# =====================================================================
def reporte_compras_lista(request):
    try:
        # Traemos todas las compras ordenadas de la más reciente a la más antigua
        # Optimizamos trayendo de un solo golpe el proveedor y usuario relacionado
        compras = Compras.objects.select_related('id_proveedor', 'id_usuario').all().order_by('-fecha_compra')
        
        lista_reportes = []
        
        for compra in compras:
            # Concatenamos de forma limpia el nombre del usuario encargado
            if compra.id_usuario:
                nombre_completo = f"{compra.id_usuario.nombre} {compra.id_usuario.apellido}".strip()
                usuario_str = nombre_completo if nombre_completo else compra.id_usuario.correo
            else:
                usuario_str = "Sistema"
            
            # Armamos el objeto con las llaves que React necesita mapear en las columnas
            lista_reportes.append({
                "id_compra": compra.id_compra,
                "fecha_compra": compra.fecha_compra.isoformat() if compra.fecha_compra else None,
                "nombre_proveedor": compra.id_proveedor.nombre_empresa if compra.id_proveedor else "Proveedor No Asignado",
                "nombre_usuario": usuario_str,
                "total": float(compra.total) if compra.total else 0.00
            })
            
        # Retornamos directamente la lista para que React la lea como un Array plano
        return JsonResponse(lista_reportes, safe=False, status=200)

    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)}, status=500)


# =====================================================================
# 2. VISTA EXISTENTE: DETALLE INDIVIDUAL (Para la Factura Limpia)
# =====================================================================
def api_reporte_compra_detalle(request, id_compra):
    try:
        # Consultamos la compra optimizando relaciones
        compra = get_object_or_404(
            Compras.objects.prefetch_related('detallecompra_set__id_producto', 'id_proveedor', 'id_usuario'), 
            pk=id_compra
        )
        
        # Concatenamos de forma limpia el nombre y apellido de tu modelo Usuarios
        if compra.id_usuario:
            nombre_completo = f"{compra.id_usuario.nombre} {compra.id_usuario.apellido}".strip()
            usuario_str = nombre_completo if nombre_completo else compra.id_usuario.correo
        else:
            usuario_str = "Sistema"

        # 1. Estructura de la Cabecera (Tipo Factura)
        reporte = {
            "id_compra": compra.id_compra,
            "fecha_compra": compra.fecha_compra.strftime('%d/%m/%Y %H:%M') if compra.fecha_compra else None,
            "total": float(compra.total) if compra.total else 0.00,
            "usuario_comprador": usuario_str,
            "proveedor": {
                "nombre_empresa": compra.id_proveedor.nombre_empresa if compra.id_proveedor else "Proveedor No Asignado",
                "contacto": compra.id_proveedor.contacto if compra.id_proveedor else "",
                "telefono": compra.id_proveedor.telefono if compra.id_proveedor else "",
                "correo": compra.id_proveedor.correo if compra.id_proveedor else "",
                "direccion": compra.id_proveedor.direccion if compra.id_proveedor else ""
            },
            "items": []  
        }
        
        # 2. Estructura del Cuerpo (Detalles)
        for detalle in compra.detallecompra_set.all():
            reporte["items"].append({
                "id_detalle": detalle.id_detalle,
                "producto": detalle.id_producto.nombre if detalle.id_producto else "Producto no encontrado",
                "cantidad": detalle.cantidad,
                "precio_unitario": float(detalle.precio_unitario),
                "subtotal": float(detalle.subtotal) if detalle.subtotal else (detalle.cantidad * float(detalle.precio_unitario))
            })
            
        return JsonResponse({"status": "success", "data": reporte}, status=200)

    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)}, status=500)