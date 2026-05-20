from rest_framework import serializers

class ItemCambioSerializer(serializers.Serializer):
    id_producto = serializers.IntegerField()
    talla = serializers.CharField(max_length=10)
    cantidad = serializers.IntegerField(min_value=1)

class RegistrarCambioSerializer(serializers.Serializer):
    id_cliente = serializers.IntegerField(required=False, allow_null=True)
    id_venta = serializers.IntegerField(required=False, allow_null=True)
    id_plan_separe = serializers.IntegerField(required=False, allow_null=True)
    productos_devueltos = ItemCambioSerializer(many=True)
    productos_nuevos = ItemCambioSerializer(many=True)

    def validate(self, data):
        if not data.get('id_venta') and not data.get('id_plan_separe'):
            raise serializers.ValidationError("Debe ingresar obligatoriamente un id_venta o un id_plan_separe.")
        return data