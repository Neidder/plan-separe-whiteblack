from django.shortcuts import render
from rest_framework import viewsets
from .models import Compras, DetalleCompra
from .serializers import CompraSerializer, DetalleCompraSerializer

class CompraViewSet(viewsets.ModelViewSet):
    queryset = Compras.objects.all()
    serializer_class = CompraSerializer

class DetalleCompraViewSet(viewsets.ModelViewSet):
    queryset = DetalleCompra.objects.all()
    serializer_class = DetalleCompraSerializer