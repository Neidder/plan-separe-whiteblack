import api from './axios';
 
export const registrarCambio = async (datosCambio) => {
    const response = await api.post('/cambios/registrar/', datosCambio);
    return response.data;
};
 
export const getCambios = async () => {
    const response = await api.get('/cambios/listar/');
    return response.data;
};
 