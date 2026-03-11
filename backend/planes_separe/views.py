from django.shortcuts import render
from rest_framework import viewsets
from .models import PlanesSepare, Entregas
from .serializers import PlanSepareSerializer, EntregaSerializer

class PlanSepareViewSet(viewsets.ModelViewSet):
    queryset = PlanesSepare.objects.all()
    serializer_class = PlanSepareSerializer

class EntregaViewSet(viewsets.ModelViewSet):
    queryset = Entregas.objects.all()
    serializer_class = EntregaSerializer