from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta
from clientes.models import Clientes
from productos.models import Productos
from proveedores.models import Proveedores
from compras.models import Compras
from planes_separe.models import PlanesSepare
from pagos.models import Pagos


@api_view(['GET'])
def resumen_dashboard(request):
    hoy = timezone.now()
    inicio_mes = hoy.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    hace_30_dias = hoy - timedelta(days=30)

    # ── Conteos generales ──
    total_clientes = Clientes.objects.filter(activo=True).count()
    total_productos = Productos.objects.filter(activo=True).count()
    total_proveedores = Proveedores.objects.filter(activo=True).count()

    # ── Planes separe ──
    planes_activos = PlanesSepare.objects.filter(estado='activo').count()
    planes_vencidos = PlanesSepare.objects.filter(
        estado='activo', fecha_fin__lt=hoy.date()
    ).count()
    saldo_pendiente = sum(
        float(p.saldo_restante or 0)
        for p in PlanesSepare.objects.filter(estado='activo')
    )

    # ── Pagos del mes ──
    pagos_mes = Pagos.objects.filter(fecha_pago__gte=inicio_mes)
    total_recaudado_mes = sum(float(p.monto or 0) for p in pagos_mes)

    # ── Compras del mes ──
    compras_mes = Compras.objects.filter(fecha_compra__gte=inicio_mes)
    total_compras_mes = sum(float(c.total or 0) for c in compras_mes)

    # ── Productos con stock bajo (menos de 5 unidades) ──
    productos_stock_bajo = Productos.objects.filter(
        activo=True, stock__lt=5
    ).values('nombre', 'stock')[:5]

    # ── Últimas 5 compras ──
    ultimas_compras = []
    for c in Compras.objects.order_by('-fecha_compra')[:5]:
        ultimas_compras.append({
            'id': c.id_compra,
            'proveedor': c.id_proveedor.nombre_empresa if c.id_proveedor else '—',
            'total': float(c.total or 0),
            'fecha': c.fecha_compra.strftime('%d/%m/%Y') if c.fecha_compra else '—',
        })

    # ── Últimos 5 pagos ──
    ultimos_pagos = []
    for p in Pagos.objects.order_by('-fecha_pago')[:5]:
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

    # ── Pagos por método (para gráfica) ──
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
        'finanzas': {
            'recaudado_mes': total_recaudado_mes,
            'compras_mes': total_compras_mes,
            'saldo_pendiente': saldo_pendiente,
            'planes_vencidos': planes_vencidos,
        },
        'productos_stock_bajo': list(productos_stock_bajo),
        'ultimas_compras': ultimas_compras,
        'ultimos_pagos': ultimos_pagos,
        'pagos_por_metodo': metodos,
    })