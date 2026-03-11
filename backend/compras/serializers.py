from rest_framework import serializers
from .models import Compras, DetalleCompra

class DetalleCompraSerializer(serializers.ModelSerializer):
    class Meta:
        model = DetalleCompra
        fields = '__all__'

class CompraSerializer(serializers.ModelSerializer):
    detalles = DetalleCompraSerializer(many=True, read_only=True)
    class Meta:
        model = Compras
        fields = '__all__'