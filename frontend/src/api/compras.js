import api from './axios';

export const getCompras = async () => {
    const response = await api.get('/compras/compras/');
    return response.data;
};

export const crearCompra = async (data) => {
    const response = await api.post('/compras/compras/', data);
    return response.data;
};

export const getDetallesCompra = async (id) => {
    const response = await api.get(`/compras/compras/${id}/detalles/`);
    return response.data;
};