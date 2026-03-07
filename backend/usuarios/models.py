from django.contrib.auth.models import AbstractUser
from django.db import models



# Create your models here.

class Usuario(AbstractUser):

    ROLES = (
        ('admin', 'Administrador'),
        ('vendedor', 'Vendedor'),
    )

    rol = models.CharField(max_length=20, choices=ROLES)
    telefono = models.CharField(max_length=20, blank=True)

    def __str__(self):
        return self.username