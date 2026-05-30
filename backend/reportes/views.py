from django.db import connection
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny # Cambiar por IsAuthenticated si manejas tokens

class MetricasFinancierasAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        periodo = request.query_params.get('periodo', 'mes')
        
        # 1. Evaluamos si el periodo arranca con "mes_" (Ej: mes_4, mes_5)
        if periodo.startswith('mes_'):
            try:
                # Extraemos el número del mes (ej: '5')
                numero_mes = int(periodo.split('_')[1])
                # Filtramos por el mes actual del año en curso
                filtro_tiempo = f"MONTH(v.fecha_venta) = {numero_mes} AND YEAR(v.fecha_venta) = YEAR(CURDATE())"
            except (IndexError, ValueError):
                filtro_tiempo = "v.fecha_venta >= DATE_SUB(NOW(), INTERVAL 30 DAY)"
        
        # 2. Si no es un mes histórico, usamos los filtros rápidos de siempre
        elif periodo == 'hoy':
            filtro_tiempo = "v.fecha_venta >= CURDATE()"
        elif periodo == 'semana':
            filtro_tiempo = "v.fecha_venta >= DATE_SUB(NOW(), INTERVAL 7 DAY)"
        else: # 'mes' (Últimos 30 días flotantes)
            filtro_tiempo = "v.fecha_venta >= DATE_SUB(NOW(), INTERVAL 30 DAY)"

        # El resto de tu código de consultas SQL se queda EXACTAMENTE IGUAL...
        with connection.cursor() as cursor:
            query_financiera = f"""
                SELECT 
                    COALESCE(SUM(dv.cantidad * dv.precio_unitario), 0) AS ingresos_totales,
                    COALESCE(SUM(dv.cantidad * (dv.precio_unitario - p.costo_promedio)), 0) AS utilidad_neta,
                    COUNT(DISTINCT v.id_venta) AS ventas_count
                FROM detalle_venta dv
                INNER JOIN ventas v ON dv.id_venta = v.id_venta
                INNER JOIN productos p ON dv.id_producto = p.id_producto
                WHERE {filtro_tiempo};
            """
            cursor.execute(query_financiera)
            row = cursor.fetchone()
            
            # 2. Recaudo Plan Separe (Sumamos los anticipos del periodo)
            query_separe = f"""
                SELECT COALESCE(SUM(anticipo), 0) 
                FROM planes_separe 
                WHERE fecha_creacion >= DATE_SUB(NOW(), INTERVAL 30 DAY);
            """ # Nota: Asegúrate de que tu tabla de planes tenga un campo de fecha similar
            cursor.execute(query_separe)
            recaudo_separe = cursor.fetchone()[0]

        data = {
            "ingresos_totales": float(row[0]),
            "utilidad_neta": float(row[1]),
            "ventas_count": row[2],
            "recando_separe": float(recaudo_separe),
            "metodos_pago": { "efectivo": 50, "transferencia: ": 40, "tarjeta": 10 } # Valores de ejemplo o dinámicos
        }
        return Response(data)

class TopProductosAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        query = """
            SELECT 
                p.nombre,
                SUM(dv.cantidad) AS cantidad,
                SUM(dv.cantidad * dv.precio_unitario) AS ingresos
            FROM detalle_venta dv
            INNER JOIN productos p ON dv.id_producto = p.id_producto
            GROUP BY p.id_producto, p.nombre
            ORDER BY cantidad DESC
            LIMIT 5;
        """
        with connection.cursor() as cursor:
            cursor.execute(query)
            columnas = [col[0] for col in cursor.description]
            resultados = [dict(zip(columnas, row)) for row in cursor.fetchall()]
            
        return Response(resultados)

class EstadoInventarioAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        query = """
            SELECT 
                SUM(stock * costo_promedio) AS valor_costo_total,
                SUM(stock) AS prendas_totales,
                COUNT(CASE WHEN stock <= 5 THEN 1 END) AS productos_bajo_stock
            FROM productos
            WHERE activo = 1;
        """
        with connection.cursor() as cursor:
            cursor.execute(query)
            row = cursor.fetchone()

        data = {
            "valor_costo_total": float(row[0]) if row[0] else 0,
            "prendas_totales": int(row[1]) if row[1] else 0,
            "productos_bajo_stock": row[2] if row[2] else 0
        }
        return Response(data)