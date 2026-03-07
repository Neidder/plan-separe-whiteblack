from django.db import models
from proveedores.models import Proveedor

class Compra(models.Model):

    proveedor = models.ForeignKey(
        Proveedor,
        on_delete=models.CASCADE
    )

    fecha = models.DateTimeField(auto_now_add=True)

    total = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    def __str__(self):
        return f"Compra {self.id}"