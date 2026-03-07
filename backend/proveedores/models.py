# Create your models here.
from django.db import models

class Proveedor(models.Model):

    razon_social = models.CharField(max_length=150)
    ruc = models.CharField(max_length=20, unique=True)
    telefono = models.CharField(max_length=20)
    correo = models.EmailField()
    direccion = models.CharField(max_length=200)

    def __str__(self):
        return self.razon_social