from django.shortcuts import render
from rest_framework import viewsets
from .models import Proveedores
from .serializers import ProveedorSerializer

class ProveedorViewSet(viewsets.ModelViewSet):
    queryset = Proveedores.objects.all()
    serializer_class = ProveedorSerializer