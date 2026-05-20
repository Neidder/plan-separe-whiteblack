import React, { useState, useEffect } from 'react';
import axios from 'axios'; // O tu cliente API configurado
import Sidebar from '../components/Sidebar'; 
import { registrarCambio } from '../api/cambios';
import { getProductos } from '../api/productos'; // Para la lista de prendas nuevas

const CambiosPage = () => {
    const [tipoOrigen, setTipoOrigen] = useState('venta');
    const [idOrigen, setIdOrigen] = useState('');
    const [cargandoOrigen, setCargandoOrigen] = useState(false);
    
    // Datos cargados desde la Factura/Plan original
    const [datosOrigen, setDatosOrigen] = useState(null); 
    const [productosDisponiblesNuevos, setProductosDisponiblesNuevos] = useState([]);

    // Estructuras del cambio actual
    const [productosDevueltos, setProductosDevueltos] = useState([]);
    const [productosNuevos, setProductosNuevos] = useState([]);

    // Feedbacks
    const [loading, setLoading] = useState(false);
    const [mensaje, setMensaje] = useState(null);
    const [error, setError] = useState(null);

    // Cargar catálogo de productos para cuando se escojan las prendas nuevas
    useEffect(() => {
        getProductos().then(setProductosDisponiblesNuevos).catch(() => {});
    }, []);

    // 1. Buscar Factura o Plan Separe en el Backend
    const consultarOrigen = async () => {
        if (!idOrigen) return;
        setCargandoOrigen(true);
        setError(null);
        setMensaje(null);
        setProductosDevueltos([]);
        try {
            // Reemplaza por tu URL base correspondiente de Axios si es necesario
            const res = await axios.get(`http://localhost:8000/api/cambios/detalles-origen/?tipo=${tipoOrigen}&id=${idOrigen}`);
            setDatosOrigen(res.data);
        } catch (err) {
            setError(err.response?.data?.error || "No se encontró el registro solicitado.");
            setDatosOrigen(null);
        } finally {
            setCargandoOrigen(false);
        }
    };

    // 2. Gestionar productos elegidos para devolver
    const toggleSeleccionDevolucion = (prodOriginal) => {
        const existe = productosDevueltos.find(p => p.id_producto === prodOriginal.id_producto && p.talla === prodOriginal.talla);
        if (existe) {
            setProductosDevueltos(productosDevueltos.filter(p => !(p.id_producto === prodOriginal.id_producto && p.talla === prodOriginal.talla)));
        } else {
            setProductosDevueltos([...productosDevueltos, {
                id_producto: prodOriginal.id_producto,
                nombre_producto: prodOriginal.nombre_producto,
                talla: prodOriginal.talla,
                cantidad: 1,
                cantidad_maxima: prodOriginal.cantidad_maxima
            }]);
        }
    };

    const manejarCantidadDevuelta = (index, valor) => {
        const nuevasFilas = [...productosDevueltos];
        const cant = parseInt(valor) || 1;
        // Impedir devolver más de lo comprado
        nuevasFilas[index].cantidad = Math.min(cant, nuevasFilas[index].cantidad_maxima);
        setProductosDevueltos(nuevasFilas);
    };

    // 3. Gestionar prendas nuevas que se lleva
    const agregarProductoNuevo = () => {
        setProductosNuevos([...productosNuevos, { id_producto: '', talla: '', cantidad: 1 }]);
    };

    const manejarCambioNuevo = (index, campo, valor) => {
        const nuevasFilas = [...productosNuevos];
        nuevasFilas[index][campo] = valor;
        setProductosNuevos(nuevasFilas);
    };

    const eliminarProductoNuevo = (index) => {
        setProductosNuevos(productosNuevos.filter((_, i) => i !== index));
    };

    // 4. Procesamiento final
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (productosDevueltos.length === 0) {
            setError("Debe seleccionar al menos un producto original para devolver.");
            return;
        }

        setLoading(true);
        setMensaje(null);
        setError(null);

        const payload = {
            id_cliente: datosOrigen.id_cliente, // Heredado automáticamente de la consulta original
            id_venta: tipoOrigen === 'venta' ? parseInt(idOrigen) : null,
            id_plan_separe: tipoOrigen === 'plan_separe' ? parseInt(idOrigen) : null,
            productos_devueltos: productosDevueltos.map(p => ({
                id_producto: p.id_producto,
                talla: p.talla,
                cantidad: p.cantidad
            })),
            productos_nuevos: productosNuevos.map(p => ({
                id_producto: parseInt(p.id_producto),
                talla: p.talla,
                cantidad: parseInt(p.cantidad)
            }))
        };

        try {
            const respuesta = await registrarCambio(payload);
            setMensaje(respuesta.message);
            setProductosDevueltos([]);
            setProductosNuevos([]);
            setDatosOrigen(null);
            setIdOrigen('');
        } catch (err) {
            setError(err.response?.data?.error || err.detail || "Error al procesar el cambio.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.layout}>
            <Sidebar />
            <div style={styles.contenido}>
                <h2>🔄 Devoluciones y Cambios</h2>
                <p style={{ color: '#666', fontSize: '14px' }}>Busca el documento de venta para procesar retornos sin errores manuales.</p>
                <hr style={{ border: '0.5px solid #e0ede6', marginBottom: '20px' }} />

                {mensaje && <div style={{ padding: '12px 15px', backgroundColor: '#e8f5ee', color: '#2e7d52', borderRadius: '8px', marginBottom: '15px' }}>{mensaje}</div>}
                {error && <div style={{ padding: '12px 15px', backgroundColor: '#fdecea', color: '#e53935', borderRadius: '8px', marginBottom: '15px' }}>⚠️ {error}</div>}

                {/* PASO 1: LOCALIZADOR DE LA COMPRA */}
                <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e0ede6', marginBottom: '20px', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
                    <h4 style={{ margin: '0 0 12px 0', color: '#2e7d52' }}>🔍 Paso 1: Localizar Compra Original</h4>
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                        <div>
                            <label style={styles.label}>Buscar en:</label>
                            <select value={tipoOrigen} onChange={(e) => setTipoOrigen(e.target.value)} style={styles.select}>
                                <option value="venta">Venta Normal</option>
                                <option value="plan_separe">Plan Separe</option>
                            </select>
                        </div>
                        <div>
                            <label style={styles.label}>Número de ID (Factura / Plan):</label>
                            <input type="number" value={idOrigen} onChange={(e) => setIdOrigen(e.target.value)} placeholder="Ej: 10" style={styles.input} />
                        </div>
                        <button type="button" onClick={consultarOrigen} disabled={cargandoOrigen} style={{ ...styles.botonNuevo, backgroundColor: '#1565c0' }}>
                            {cargandoOrigen ? 'Buscando...' : 'Cargar Detalles'}
                        </button>
                    </div>
                </div>

                {datosOrigen && (
                    <form onSubmit={handleSubmit}>
                        {/* IDENTIFICACIÓN DEL CLIENTE DETECTADO */}
                        <div style={{ backgroundColor: '#f0faf4', padding: '12px 20px', borderRadius: '8px', marginBottom: '25px', borderLeft: '4px solid #2e7d52' }}>
                            <span>Comprador Vinculado: <strong>👤 {datosOrigen.nombre_cliente}</strong></span>
                        </div>

                        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                            {/* COLUMNA IZQUIERDA: SELECCIÓN DE PRENDAS COMPRADAS */}
                            <div style={{ flex: 1, minWidth: '320px', backgroundColor: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e0ede6' }}>
                                <h3 style={{ margin: '0 0 15px 0', color: '#bc4747' }}>⬇️ 2. ¿Qué prenda va a devolver?</h3>
                                <p style={{ fontSize: '12px', color: '#777', marginTop: '-10px', marginBottom: '15px' }}>Artículos hallados en la transacción original:</p>
                                
                                {datosOrigen.detalles.map((prod) => {
                                    const seleccionado = productosDevueltos.some(p => p.id_producto === prod.id_producto && p.talla === prod.talla);
                                    const idxDev = productosDevueltos.findIndex(p => p.id_producto === prod.id_producto && p.talla === prod.talla);
                                    
                                    return (
                                        <div key={`${prod.id_producto}-${prod.talla}`} style={{ padding: '12px', border: '1px solid #e0ede6', borderRadius: '8px', marginBottom: '10px', backgroundColor: seleccionado ? '#fdf2f2' : '#fff' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{prod.nombre_producto}</span><br />
                                                    <span style={{ fontSize: '12px', color: '#666' }}>Talla: <span style={styles.tallaPill}>{prod.talla}</span> | Llevó: {prod.cantidad_maxima} ud(s)</span>
                                                </div>
                                                <button type="button" onClick={() => toggleSeleccionDevolucion(prod)} style={{ padding: '6px 12px', backgroundColor: seleccionado ? '#dc3545' : '#2e7d52', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
                                                    {seleccionado ? 'Quitar' : 'Devolver'}
                                                </button>
                                            </div>

                                            {seleccionado && (
                                                <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '10px', borderTop: '1px dashed #e0ede6', paddingTop: '8px' }}>
                                                    <label style={{ fontSize: '12px' }}>Cant. a retornar:</label>
                                                    <input type="number" min="1" max={prod.cantidad_maxima} value={productosDevueltos[idxDev].cantidad} onChange={(e) => manejarCantidadDevuelta(idxDev, e.target.value)} style={{ ...styles.input, width: '70px', padding: '5px' }} />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* COLUMNA DERECHA: ASIGNACIÓN DE PRENDAS NUEVAS */}
                            <div style={{ flex: 1, minWidth: '320px', backgroundColor: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e0ede6' }}>
                                <h3 style={{ margin: '0 0 15px 0', color: '#2e7d52' }}>⬆️ 3. ¿Qué prendas nuevas se lleva?</h3>
                                {productosNuevos.map((item, idx) => (
                                    <div key={idx} style={{ marginBottom: '10px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        <select value={item.id_producto} onChange={(e) => manejarCambioNuevo(idx, 'id_producto', e.target.value)} style={{ ...styles.select, flex: 2 }}>
                                            <option value="">-- Seleccione Producto --</option>
                                            {productosDisponiblesNuevos.map(p => (
                                                <option key={p.id_producto} value={p.id_producto}>{p.nombre} (${Number(p.precio_venta).toLocaleString()})</option>
                                            ))}
                                        </select>
                                        <input type="text" placeholder="Talla" style={{ ...styles.input, width: '65px' }} required value={item.talla} onChange={(e) => manejarCambioNuevo(idx, 'talla', e.target.value)} />
                                        <input type="number" placeholder="Cant" style={{ ...styles.input, width: '60px' }} min="1" required value={item.cantidad} onChange={(e) => manejarCambioNuevo(idx, 'cantidad', e.target.value)} />
                                        <button type="button" onClick={() => eliminarProductoNuevo(idx)} style={{ backgroundColor: '#fdecea', color: '#e53935', border: 'none', padding: '10px', borderRadius: '6px', cursor: 'pointer' }}>✕</button>
                                    </div>
                                ))}
                                <button type="button" onClick={agregarProductoNuevo} style={styles.botonAgregar}>+ Vincular Nueva Prenda al Cambio</button>
                            </div>
                        </div>

                        <button type="submit" disabled={loading} style={styles.botonEnviar}>
                            {loading ? 'Procesando en Servidor...' : 'Confirmar e Inyectar Transmisión de Cambio'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

// Estilos unificados con Ventas.jsx
const styles = {
    layout: { display: 'flex', minHeight: '100vh', backgroundColor: '#f0f4f0' },
    contenido: { marginLeft: '250px', flex: 1, padding: '30px', fontFamily: 'sans-serif' },
    label: { fontSize: '13px', color: '#555', fontWeight: '600', display: 'block', marginBottom: '4px' },
    input: { padding: '10px 14px', border: '1.5px solid #e0ede6', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', backgroundColor: 'white' },
    select: { padding: '10px 14px', border: '1.5px solid #e0ede6', borderRadius: '8px', fontSize: '14px', outline: 'none', backgroundColor: 'white' },
    botonNuevo: { backgroundColor: '#2e7d52', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' },
    tallaPill: { backgroundColor: '#e8f5ee', color: '#2e7d52', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' },
    botonAgregar: { backgroundColor: 'transparent', color: '#2e7d52', border: '1.5px dashed #2e7d52', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', width: '100%', marginTop: '8px' },
    botonEnviar: { marginTop: '25px', width: '100%', padding: '14px', backgroundColor: '#2e7d52', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '15px', fontWeight: 'bold', boxShadow: '0 4px 12px rgba(46, 125, 82, 0.2)' }
};

export default CambiosPage;