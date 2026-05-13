import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({
    children,
    adminOnly = false,
    vendedorOnly = false
}) => {

    const usuario = JSON.parse(
        localStorage.getItem('usuario')
    );

    // Usuario no logueado
    if (!usuario) {
        return <Navigate to="/login" />;
    }

    // SOLO ADMINISTRADOR
    if (
        adminOnly &&
        usuario.id_rol !== 1
    ) {
        return <Navigate to="/dashboard" />;
    }

    // SOLO VENDEDOR
    if (
        vendedorOnly &&
        usuario.id_rol !== 2
    ) {
        return <Navigate to="/dashboard" />;
    }

    return children;
};

export default ProtectedRoute;