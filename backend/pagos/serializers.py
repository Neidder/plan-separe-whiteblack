from rest_framework import serializers
from .models import Pagos


class PagoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pagos
        fields = '__all__'


class CrearPagoSerializer(serializers.Serializer):
    id_plan_separe = serializers.IntegerField()
    monto = serializers.DecimalField(max_digits=10, decimal_places=2)
    metodo_pago = serializers.ChoiceField(choices=[
        ('efectivo', 'Efectivo'),
        ('transferencia', 'Transferencia'),
        ('tarjeta', 'Tarjeta'),
    ])
    registrado_por = serializers.IntegerField()

    def validate_monto(self, value):
        if value <= 0:
            raise serializers.ValidationError('El monto debe ser mayor a 0.')
        return value