import api from './axios';

export const getProductos = async () => {
    const response = await api.get('/productos/productos/');
    return response.data;
};

export const crearProducto = async (data) => {
    const response = await api.post('/productos/productos/', data);
    return response.data;
};

export const actualizarProducto = async (id, data) => {
    const response = await api.put(`/productos/productos/${id}/`, data);
    return response.data;
};

export const eliminarProducto = async (id) => {
    const response = await api.delete(`/productos/productos/${id}/`);
    return response.data;
};