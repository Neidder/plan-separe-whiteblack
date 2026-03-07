from django.db import models

class Categoria(models.Model):

    nombre = models.CharField(max_length=100)

    def __str__(self):
        return self.nombre


class Producto(models.Model):

    codigo = models.CharField(max_length=50, unique=True)
    nombre = models.CharField(max_length=150)

    descripcion = models.TextField(blank=True)

    categoria = models.ForeignKey(
        Categoria,
        on_delete=models.CASCADE
    )

    talla = models.CharField(max_length=10)
    color = models.CharField(max_length=30)

    precio_costo = models.DecimalField(max_digits=10, decimal_places=2)
    precio_venta = models.DecimalField(max_digits=10, decimal_places=2)

    stock = models.IntegerField()
    stock_minimo = models.IntegerField(default=5)

    fecha_registro = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.nombre