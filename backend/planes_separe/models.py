from django.db import models
from clientes.models import Clientes
from productos.models import Productos
from usuarios.models import Usuarios


class PlanesSepare(models.Model):
    id_plan_separe = models.AutoField(primary_key=True)
    id_cliente = models.ForeignKey(Clientes, models.DO_NOTHING, db_column='id_cliente', blank=True, null=True)
    id_producto = models.ForeignKey(Productos, models.DO_NOTHING, db_column='id_producto', blank=True, null=True)
    id_vendedor = models.ForeignKey(Usuarios, models.DO_NOTHING, db_column='id_vendedor', blank=True, null=True)
    valor_total = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    anticipo = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    saldo_restante = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    fecha_inicio = models.DateField(blank=True, null=True)
    fecha_fin = models.DateField(blank=True, null=True)
    estado = models.CharField(max_length=50, blank=True, null=True)
    fecha_creacion = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'planes_separe'


class DetallePlanSepare(models.Model):
    id_detalle = models.AutoField(primary_key=True)
    id_plan_separe = models.ForeignKey(
        PlanesSepare, models.CASCADE,
        db_column='id_plan_separe',
        related_name='detalles'
    )
    id_producto = models.ForeignKey(
        Productos, models.DO_NOTHING,
        db_column='id_producto',
        null=True,      
        blank=True,
    )
    talla = models.CharField(max_length=10)
    cantidad = models.IntegerField(default=1)
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        managed = False
        db_table = 'detalle_plan_separe'


class Entregas(models.Model):
    id_entrega = models.AutoField(primary_key=True)
    id_plan_separe = models.ForeignKey(
        PlanesSepare, models.DO_NOTHING,
        db_column='id_plan_separe',
        blank=True, null=True
    )
    fecha_entrega = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'entregas'