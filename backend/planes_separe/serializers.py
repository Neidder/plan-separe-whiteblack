from rest_framework import serializers
from .models import PlanesSepare, DetallePlanSepare, Entregas


class EntregaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Entregas
        fields = '__all__'


class DetallePlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = DetallePlanSepare
        fields = ['id_detalle', 'id_producto', 'talla', 'cantidad', 'precio_unitario', 'subtotal']


class PlanSepareSerializer(serializers.ModelSerializer):
    detalles = DetallePlanSerializer(many=True, read_only=True)

    class Meta:
        model = PlanesSepare
        fields = '__all__'


class CrearDetallePlanSerializer(serializers.Serializer):
    id_producto = serializers.IntegerField()
    talla = serializers.CharField(max_length=10)
    cantidad = serializers.IntegerField(min_value=1)
    precio_unitario = serializers.DecimalField(max_digits=10, decimal_places=2)


class CrearPlanSepareSerializer(serializers.Serializer):
    id_cliente = serializers.IntegerField()
    id_vendedor = serializers.IntegerField()
    anticipo = serializers.DecimalField(max_digits=10, decimal_places=2)
    fecha_fin = serializers.DateField()
    detalles = CrearDetallePlanSerializer(many=True)

    def validate(self, data):
        if not data.get('detalles'):
            raise serializers.ValidationError('Debe agregar al menos un producto')
        if data['anticipo'] < 0:
            raise serializers.ValidationError('El anticipo no puede ser negativo')
        return data