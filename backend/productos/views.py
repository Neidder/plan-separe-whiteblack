from django.shortcuts import render
from rest_framework import viewsets
from .models import Productos, Kardex
from .serializers import ProductoSerializer, KardexSerializer

class ProductoViewSet(viewsets.ModelViewSet):
    queryset = Productos.objects.all()
    serializer_class = ProductoSerializer

class KardexViewSet(viewsets.ModelViewSet):
    queryset = Kardex.objects.all()
    serializer_class = KardexSerializer