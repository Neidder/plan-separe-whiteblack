import axios from './axios'; // Tu instancia de Axios que ya le pone el '/api' adelante automáticamente

// FUNCIÓN 1: Traer el detalle de una compra específica
export const getReporteCompraId = async (id_compra) => {
    try {
        // Apunta a: /api/reporte-compras/ID/
        const response = await axios.get(`/reporte-compras/${id_compra}/`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

// FUNCIÓN 2: Traer la lista general de todas las compras
export const getListaComprasReportes = async () => {
    try {
        // Apunta a: /api/reporte-compras/
        const response = await axios.get('/reporte-compras/'); 
        return response.data;
    } catch (error) {
        throw error;
    }
};