from rest_framework import serializers
from .models import Productos, Kardex

class ProductoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Productos
        fields = '__all__'

class KardexSerializer(serializers.ModelSerializer):
    producto_nombre = serializers.CharField(
        source='id_producto.nombre', read_only=True
    )
    class Meta:
        model = Kardex
        fields = '__all__'