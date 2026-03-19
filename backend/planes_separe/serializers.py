from rest_framework import serializers
from .models import PlanesSepare, Entregas
from clientes.models import Clientes
from productos.models import Productos
from usuarios.models import Usuarios


class EntregaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Entregas
        fields = '__all__'


class PlanSepareSerializer(serializers.ModelSerializer):
    entregas = EntregaSerializer(many=True, read_only=True,
                                  source='entregas_set')

    class Meta:
        model = PlanesSepare
        fields = '__all__'


class CrearPlanSepareSerializer(serializers.Serializer):
    id_cliente = serializers.IntegerField()
    id_producto = serializers.IntegerField()
    id_vendedor = serializers.IntegerField()
    valor_total = serializers.DecimalField(max_digits=10, decimal_places=2)
    anticipo = serializers.DecimalField(max_digits=10, decimal_places=2)
    fecha_fin = serializers.DateField()

    def validate(self, data):
        if data['anticipo'] > data['valor_total']:
            raise serializers.ValidationError(
                'El anticipo no puede ser mayor al valor total.'
            )
        if data['anticipo'] < 0:
            raise serializers.ValidationError(
                'El anticipo no puede ser negativo.'
            )
        return data