import api from "./axios";

export const getProveedores = async () => {
    const response = await api.get('/proveedores/proveedores/');
    return response.data;
};

export const crearProveedor = async (data) => {
    const response = await api.post('/proveedores/proveedores/', data);
    return response.data;
};

export const actualizarProveedor = async (id, data) => {
    const response = await api.put(`/proveedores/proveedores/${id}/`, data);
    return response.data;
};

export const eliminarProveedor = async (id) => {
    const response = await api.delete(`/proveedores/proveedores/${id}/`);
    return response.data;
};
