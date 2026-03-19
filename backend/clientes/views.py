from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import Clientes
from .serializers import ClienteSerializer


class ClienteViewSet(viewsets.ModelViewSet):
    queryset = Clientes.objects.all().order_by('nombre')
    serializer_class = ClienteSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            serializer.save(fecha_registro=timezone.now())
            return Response({
                'mensaje': 'Cliente registrado correctamente',
                'data': serializer.data
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({
                'mensaje': 'Cliente actualizado correctamente',
                'data': serializer.data
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.delete()
        return Response(
            {'mensaje': 'Cliente eliminado correctamente'},
            status=status.HTTP_200_OK
        )

    @action(detail=False, methods=['get'], url_path='buscar')
    def buscar(self, request):
        query = request.query_params.get('q', '')
        if not query:
            return Response(
                {'error': 'Ingresa un término de búsqueda'},
                status=status.HTTP_400_BAD_REQUEST
            )
        clientes = Clientes.objects.filter(
            nombre__icontains=query
        ) | Clientes.objects.filter(
            apellido__icontains=query
        ) | Clientes.objects.filter(
            documento__icontains=query
        )
        serializer = self.get_serializer(clientes, many=True)
        return Response(serializer.data)