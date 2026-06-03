from django.db.models import Sum
from django.utils import timezone
from rest_framework.decorators import api_view
from rest_framework.response import Response
from datetime import timedelta

# Importación de modelos originales
from clientes.models import Clientes
from productos.models import Productos
from proveedores.models import Proveedores
from compras.models import Compras
from planes_separe.models import PlanesSepare
from pagos.models import Pagos
from ventas.models import Ventas

@api_view(['GET'])
def resumen_dashboard(request):
    # --- Tiempos de referencia ---
    hoy_dt = timezone.now()
    hoy_fecha = hoy_dt.date()
    inicio_mes = hoy_dt.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    hace_30_dias = hoy_dt - timedelta(days=30)

    # --- Conteos Generales ---
    total_clientes = Clientes.objects.filter(activo=True).count()
    total_productos = Productos.objects.filter(activo=True).count()
    total_proveedores = Proveedores.objects.filter(activo=True).count()
    planes_activos = PlanesSepare.objects.filter(estado='activo').count()

    # --- Ventas de HOY ---
    ventas_hoy_qs = Ventas.objects.filter(fecha_venta__date=hoy_fecha)
    total_ventas_dia = ventas_hoy_qs.aggregate(total=Sum('total'))['total'] or 0
    cantidad_ventas_dia = ventas_hoy_qs.count()

    # --- Finanzas del Mes ---
    total_ventas_mes = Ventas.objects.filter(
        fecha_venta__gte=inicio_mes
    ).aggregate(total=Sum('total'))['total'] or 0

    total_recaudado_mes = Pagos.objects.filter(
        fecha_pago__gte=inicio_mes
    ).aggregate(monto=Sum('monto'))['monto'] or 0

    total_ingresos_mes = float(total_ventas_mes) + float(total_recaudado_mes)

    total_compras_mes = Compras.objects.filter(
        fecha_compra__gte=inicio_mes
    ).aggregate(total=Sum('total'))['total'] or 0

    # --- Planes Separe Adicional ---
    planes_vencidos = PlanesSepare.objects.filter(
        estado='activo', 
        fecha_fin__lt=hoy_fecha
    ).count()
    
    saldo_pendiente = sum(float(p.saldo_restante or 0) for p in PlanesSepare.objects.filter(estado='activo'))

    # --- PROCESAMIENTO DE STOCK BAJO REAL (Por Tallas) ---
    productos_stock_bajo = []
    
    # Recorremos los productos activos
    for p in Productos.objects.filter(activo=True):
        # Buscamos de forma dinámica el gestor de la relación de tallas que usa tu modelo
        relacion_tallas = None
        for attr in dir(p):
            if attr.endswith('_set') or attr in ['tallas', 'variantes', 'imagenes_tallas']:
                relacion_tallas = getattr(p, attr)
                break
        
        if relacion_tallas:
            try:
                # Filtramos las tallas con stock menor o igual a 3
                for item_talla in relacion_tallas.filter(stock__lte=3):
                    talla_nombre = getattr(item_talla, 'talla', '') or getattr(item_talla, 'nombre_talla', '')
                    productos_stock_bajo.append({
                        'nombre': f"{p.nombre} (Talla {talla_nombre})",
                        'stock': int(item_talla.stock)
                    })
            except Exception:
                pass

    # Si por alguna razón la estructura dinámica no encuentra datos, usamos el respaldo plano
    if not productos_stock_bajo:
        for p in Productos.objects.filter(activo=True, stock__lte=3)[:5]:
            productos_stock_bajo.append({
                'nombre': p.nombre,
                'stock': p.stock
            })
    else:
        # Ordenamos de menor a mayor stock y tomamos los 5 críticos
        productos_stock_bajo = sorted(productos_stock_bajo, key=lambda x: x['stock'])[:5]

    # --- Listados (Top 5 con select_related optimizado) ---
    ultimas_compras = []
    for c in Compras.objects.select_related('id_proveedor').order_by('-fecha_compra')[:5]:
        ultimas_compras.append({
            'id': c.id_compra,
            'proveedor': c.id_proveedor.nombre_empresa if c.id_proveedor else '—',
            'total': float(c.total or 0),
            'fecha': c.fecha_compra.strftime('%d/%m/%Y') if c.fecha_compra else '—',
        })

    ultimos_pagos = []
    for p in Pagos.objects.select_related('id_plan_separe__id_cliente').order_by('-fecha_pago')[:5]:
        try:
            cliente = p.id_plan_separe.id_cliente
            nombre_cliente = f'{cliente.nombre} {cliente.apellido or ""}'.strip()
        except Exception:
            nombre_cliente = '—'
        ultimos_pagos.append({
            'id': p.id_pago,
            'cliente': nombre_cliente,
            'monto': float(p.monto or 0),
            'metodo': p.metodo_pago,
            'fecha': p.fecha_pago.strftime('%d/%m/%Y %H:%M') if p.fecha_pago else '—',
        })

    # --- Pagos por método ---
    metodos = {}
    for p in Pagos.objects.filter(fecha_pago__gte=hace_30_dias):
        m = p.metodo_pago or 'otro'
        metodos[m] = metodos.get(m, 0) + float(p.monto or 0)

    return Response({
        'generales': {
            'clientes': total_clientes,
            'productos': total_productos,
            'proveedores': total_proveedores,
            'planes_activos': planes_activos,
        },
        'ventas_hoy': {
            'monto': float(total_ventas_dia),
            'cantidad': cantidad_ventas_dia,
        },
        'finanzas': {
            'recaudado_mes': float(total_recaudado_mes),
            'ventas_directas_mes': float(total_ventas_mes),
            'ingresos_totales_mes': float(total_ingresos_mes),
            'compras_mes': float(total_compras_mes),
            'saldo_pendiente': float(saldo_pendiente),
            'planes_vencidos': planes_vencidos,
        },
        'productos_stock_bajo': productos_stock_bajo,
        'ultimas_compras': ultimas_compras,
        'ultimos_pagos': ultimos_pagos,
        'pagos_por_metodo': metodos,
    })