from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from .models import Usuarios, Roles
from .serializers import UsuarioSerializer, RolSerializer, LoginSerializer
import hashlib


class RolViewSet(viewsets.ModelViewSet):
    queryset = Roles.objects.all()
    serializer_class = RolSerializer


class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = Usuarios.objects.all()
    serializer_class = UsuarioSerializer


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        correo = serializer.validated_data['correo']
        contrasena = hashlib.sha256(
            serializer.validated_data['contrasena'].encode()
        ).hexdigest()

        try:
            usuario = Usuarios.objects.get(correo=correo, contrasena=contrasena)
            return Response({
                'mensaje': 'Login exitoso',
                'id_usuario': usuario.id_usuario,
                'nombre': usuario.nombre,
                'apellido': usuario.apellido,
                'correo': usuario.correo,
                'id_rol': usuario.id_rol_id
            }, status=status.HTTP_200_OK)
        except Usuarios.DoesNotExist:
            return Response(
                {'error': 'Correo o contraseña incorrectos'},
                status=status.HTTP_401_UNAUTHORIZED
            )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)