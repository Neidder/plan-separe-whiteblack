from rest_framework import serializers
from .models import PlanesSepare, Entregas

class EntregaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Entregas
        fields = '__all__'

class PlanSepareSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlanesSepare
        fields = '__all__'