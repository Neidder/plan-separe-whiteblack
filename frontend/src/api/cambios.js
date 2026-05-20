import axios from 'axios'; // O la instancia personalizada de axios que uses en tu proyecto

const API_URL = 'http://localhost:8000/api/cambios/'; // Ajusta el puerto según tu entorno

export const registrarCambio = async (datosCambio) => {
    try {
        const response = await axios.post(`${API_URL}registrar/`, datosCambio);
        return response.data;
    } catch (error) {
        // Lanza el error capturado en el backend para manejarlo en la interfaz
        throw error.response ? error.response.data : new Error("Error de conexión");
    }
};