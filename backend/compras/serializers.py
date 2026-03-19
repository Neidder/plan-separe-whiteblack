from rest_framework import serializers
from .models import Compras, DetalleCompra
from productos.models import Productos


class DetalleCompraSerializer(serializers.ModelSerializer):
    class Meta:
        model = DetalleCompra
        fields = '__all__'

    def validate(self, data):
        cantidad = data.get('cantidad', 0)
        precio_unitario = data.get('precio_unitario', 0)
        if cantidad <= 0:
            raise serializers.ValidationError('La cantidad debe ser mayor a 0.')
        if precio_unitario <= 0:
            raise serializers.ValidationError('El precio unitario debe ser mayor a 0.')
        data['subtotal'] = cantidad * precio_unitario
        return data


class CompraSerializer(serializers.ModelSerializer):
    detalles = DetalleCompraSerializer(many=True, read_only=True,
                                        source='detallecompra_set')

    class Meta:
        model = Compras
        fields = '__all__'


class CrearCompraSerializer(serializers.Serializer):
    id_proveedor = serializers.IntegerField()
    id_usuario = serializers.IntegerField()
    detalles = DetalleCompraSerializer(many=True)