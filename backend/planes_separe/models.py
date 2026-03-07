from django.db import models
from clientes.models import Cliente

class PlanSepare(models.Model):

    ESTADOS = (
        ('activo', 'Activo'),
        ('pagado', 'Pagado'),
        ('entregado', 'Entregado'),
        ('cancelado', 'Cancelado')
    )

    cliente = models.ForeignKey(
        Cliente,
        on_delete=models.CASCADE
    )

    #tipo_plan = models.ForeignKey(
     #   TipoPlan,
      #  on_delete=models.CASCADE
    #)

    fecha_creacion = models.DateTimeField(auto_now_add=True)

    total = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    saldo_pendiente = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    estado = models.CharField(
        max_length=20,
        choices=ESTADOS,
        default='activo'
    )

    def __str__(self):
        return f"Plan {self.id} - {self.cliente}"



