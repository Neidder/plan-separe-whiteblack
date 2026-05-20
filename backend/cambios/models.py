from django.db import models
from clientes.models import Clientes
from ventas.models import Ventas
from planes_separe.models import PlanesSepare
from productos.models import Productos

class Cambios(models.Model):
    id_cambio = models.AutoField(primary_key=True)
    # MODIFICADO: Cambiado a SET_NULL, blank=True, null=True para soportar Cliente Ocasional
    id_cliente = models.ForeignKey(
        Clientes, 
        on_delete=models.SET_NULL, 
        db_column='id_cliente', 
        blank=True, 
        null=True
    )
    id_venta = models.ForeignKey(Ventas, models.DO_NOTHING, db_column='id_venta', blank=True, null=True)
    id_plan_separe = models.ForeignKey(PlanesSepare, models.DO_NOTHING, db_column='id_plan_separe', blank=True, null=True)
    fecha_cambio = models.DateTimeField()
    total_diferencia = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    class Meta:
        managed = True  # <-- CAMBIADO A TRUE para que Django pueda aplicar la modificación en MySQL
        db_table = 'cambios'

class DetalleCambioEntrada(models.Model):
    id_detalle_entrada = models.AutoField(primary_key=True)
    id_cambio = models.ForeignKey(Cambios, models.CASCADE, db_column='id_cambio', related_name='entradas')
    id_producto = models.ForeignKey(Productos, models.DO_NOTHING, db_column='id_producto')
    talla = models.CharField(max_length=10)
    cantidad = models.IntegerField()
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        managed = True  # <-- CAMBIADO A TRUE
        db_table = 'detalle_cambio_entrada'

class DetalleCambioSalida(models.Model):
    id_detalle_salida = models.AutoField(primary_key=True)
    id_cambio = models.ForeignKey(Cambios, models.CASCADE, db_column='id_cambio', related_name='salidas')
    id_producto = models.ForeignKey(Productos, models.DO_NOTHING, db_column='id_producto')
    talla = models.CharField(max_length=10)
    cantidad = models.IntegerField()
    precio_venta = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        managed = True  # <-- CAMBIADO A TRUE
        db_table = 'detalle_cambio_salida'