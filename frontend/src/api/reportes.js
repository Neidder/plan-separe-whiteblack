import axios from 'axios';

// Cambia esta URL si tu servidor Django corre en otro puerto (por ejemplo http://localhost:8000)
const API_URL = 'http://localhost:8000/api/reportes'; 

// Obtiene los ingresos, utilidades y cantidad de ventas según el periodo ('hoy', 'semana', 'mes')
export const getMetricasFinancieras = async (periodo = 'mes') => {
    const res = await axios.get(`${API_URL}/financieros?periodo=${periodo}`);
    return res.data;
};

// Obtiene la lista de los 5 productos más vendidos
export const getTopProductos = async () => {
    const res = await axios.get(`${API_URL}/top-productos`);
    return res.data;
};

// Obtiene el capital invertido, prendas totales y productos con bajo stock
export const getEstadoInventario = async () => {
    const res = await axios.get(`${API_URL}/inventario`);
    return res.data;
};