import api from './axios';

export const getClientes = async () => {
    const response = await api.get('/clientes/clientes/');
    return response.data;
};

export const crearCliente = async (data) => {
    const response = await api.post('/clientes/clientes/', data);
    return response.data;
};

export const actualizarCliente = async (id, data) => {
    const response = await api.put(`/clientes/clientes/${id}/`, data);
    return response.data;
};

export const eliminarCliente = async (id) => {
    const response = await api.delete(`/clientes/clientes/${id}/`);
    return response.data;
};


