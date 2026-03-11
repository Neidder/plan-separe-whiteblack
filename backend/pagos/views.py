from django.shortcuts import render
from rest_framework import viewsets
from .models import Pagos
from .serializers import PagoSerializer

class PagoViewSet(viewsets.ModelViewSet):
    queryset = Pagos.objects.all()
    serializer_class = PagoSerializer