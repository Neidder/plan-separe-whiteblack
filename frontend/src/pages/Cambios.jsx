import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import { registrarCambio, getCambios } from '../api/cambios';
import { getProductos } from '../api/productos';

const STOCK_MINIMO = 3;

const CambiosPage = () => {
    // ── Vista activa: 'nuevo' | 'historial' ──
    const [vistaActiva, setVistaActiva] = useState('historial');

    // ── Historial ──
    const [historial, setHistorial] = useState([]);
    const [cargandoHistorial, setCargandoHistorial] = useState(false);
    const [expandidoHistorial, setExpandidoHistorial] = useState(null);
    const [busqueda, setBusqueda] = useState('');

    // ── Formulario de nuevo cambio ──
    const [tipoOrigen, setTipoOrigen] = useState('venta');
    const [idOrigen, setIdOrigen] = useState('');
    const [cargandoOrigen, setCargandoOrigen] = useState(false);
    const [datosOrigen, setDatosOrigen] = useState(null);
    const [productosDisponiblesNuevos, setProductosDisponiblesNuevos] = useState([]);
    const [productosDevueltos, setProductosDevueltos] = useState([]);
    const [productosNuevos, setProductosNuevos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [mensaje, setMensaje] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        getProductos().then(setProductosDisponiblesNuevos).catch(() => {});
        cargarHistorial();
    }, []);

    const cargarHistorial = async () => {
        setCargandoHistorial(true);
        try {
            const data = await getCambios();
            setHistorial(data);
        } catch {
            // silencioso, puede no haber cambios aún
        } finally {
            setCargandoHistorial(false);
        }
    };

    // ── Localizar compra original ──
    const consultarOrigen = async () => {
        if (!idOrigen) return;
        setCargandoOrigen(true);
        setError(null);
        setMensaje(null);
        setProductosDevueltos([]);
        setProductosNuevos([]);
        try {
            const res = await axios.get(`http://localhost:8000/api/cambios/detalles-origen/?tipo=${tipoOrigen}&id=${idOrigen}`);
            setDatosOrigen(res.data);
        } catch (err) {
            setError(err.response?.data?.error || 'No se encontró el registro solicitado.');
            setDatosOrigen(null);
        } finally {
            setCargandoOrigen(false);
        }
    };

    // ── Prendas devueltas ──
    const toggleSeleccionDevolucion = (prod) => {
        const existe = productosDevueltos.find(p => p.id_producto === prod.id_producto && p.talla === prod.talla);
        if (existe) {
            setProductosDevueltos(productosDevueltos.filter(p => !(p.id_producto === prod.id_producto && p.talla === prod.talla)));
        } else {
            setProductosDevueltos([...productosDevueltos, {
                id_producto: prod.id_producto,
                nombre_producto: prod.nombre_producto,
                talla: prod.talla,
                cantidad: 1,
                cantidad_maxima: prod.cantidad_maxima,
                precio_unitario: parseFloat(prod.precio_unitario),
            }]);
        }
    };

    const manejarCantidadDevuelta = (index, valor) => {
        const nuevas = [...productosDevueltos];
        const cant = parseInt(valor) || 1;
        nuevas[index].cantidad = Math.max(1, Math.min(cant, nuevas[index].cantidad_maxima));
        setProductosDevueltos(nuevas);
    };

    // ── Prendas nuevas ──
    const agregarProductoNuevo = () => {
        setProductosNuevos([...productosNuevos, { id_producto: '', talla: '', cantidad: 1, precio_unitario: 0 }]);
    };

    const handleProductoNuevoChange = (index, idProducto) => {
        const nuevas = [...productosNuevos];
        nuevas[index].id_producto = idProducto;
        nuevas[index].talla = '';
        nuevas[index].cantidad = 1;
        const prod = productosDisponiblesNuevos.find(p => p.id_producto === parseInt(idProducto));
        nuevas[index].precio_unitario = prod ? parseFloat(prod.precio_venta) : 0;
        setProductosNuevos(nuevas);
    };

    const handleTallaCantidadNuevo = (index, talla, valor) => {
        const nuevas = [...productosNuevos];
        nuevas[index].talla = talla;
        nuevas[index].cantidad = parseInt(valor) || 1;
        setProductosNuevos(nuevas);
    };

    const manejarCambioNuevo = (index, campo, valor) => {
        const nuevas = [...productosNuevos];
        nuevas[index][campo] = valor;
        setProductosNuevos(nuevas);
    };

    const eliminarProductoNuevo = (index) => {
        setProductosNuevos(productosNuevos.filter((_, i) => i !== index));
    };

    // ── Cálculos financieros ──
    const totalDevuelto = productosDevueltos.reduce((s, p) => s + p.precio_unitario * p.cantidad, 0);
    const totalNuevo = productosNuevos.reduce((s, p) => s + p.precio_unitario * (parseInt(p.cantidad) || 0), 0);
    const diferencia = totalNuevo - totalDevuelto;

    // ── Enviar cambio ──
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (productosDevueltos.length === 0) {
            setError('Debe seleccionar al menos un producto original para devolver.');
            return;
        }
        if (diferencia < 0 && !datosOrigen.id_cliente) {
            setError("No se puede generar saldo a favor para un 'Cliente ocasional'. Ajuste los artículos nuevos o vincule un cliente real.");
            return;
        }
        setLoading(true);
        setMensaje(null);
        setError(null);

        const payload = {
            id_cliente: datosOrigen.id_cliente,
            id_venta: tipoOrigen === 'venta' ? parseInt(idOrigen) : null,
            id_plan_separe: tipoOrigen === 'plan_separe' ? parseInt(idOrigen) : null,
            productos_devueltos: productosDevueltos.map(p => ({
                id_producto: p.id_producto,
                talla: p.talla,
                cantidad: p.cantidad,
            })),
            productos_nuevos: productosNuevos.map(p => ({
                id_producto: parseInt(p.id_producto),
                talla: p.talla,
                cantidad: parseInt(p.cantidad),
            })),
        };

        try {
            const respuesta = await registrarCambio(payload);
            setMensaje(respuesta.message);
            setProductosDevueltos([]);
            setProductosNuevos([]);
            setDatosOrigen(null);
            setIdOrigen('');
            cargarHistorial();
            // Cambiar a historial para ver el nuevo registro
            setTimeout(() => setVistaActiva('historial'), 1500);
        } catch (err) {
            setError(err.response?.data?.error || 'Error al procesar el cambio.');
        } finally {
            setLoading(false);
        }
    };

    // ── Filtrar historial ──
    const historialFiltrado = historial.filter(c => {
        if (!busqueda) return true;
        return (
            c.nombre_cliente.toLowerCase().includes(busqueda.toLowerCase()) ||
            String(c.id_cambio).includes(busqueda) ||
            String(c.id_origen).includes(busqueda)
        );
    });

    // ── Color de diferencia ──
    const colorDiferencia = (valor) => {
        if (valor > 0) return '#e65100';
        if (valor < 0) return '#1565c0';
        return '#2e7d52';
    };

    const textoDiferencia = (valor) => {
        if (valor > 0) return `Cliente debe +$${valor.toLocaleString()}`;
        if (valor < 0) return `Saldo a favor $${Math.abs(valor).toLocaleString()}`;
        return 'Cambio directo ($0)';
    };

    return (
        <div style={styles.layout}>
            <Sidebar />
            <div style={styles.contenido}>

                {/* Encabezado */}
                <div style={styles.header}>
                    <div>
                        <h1 style={styles.titulo}>🔄 Cambios y Devoluciones</h1>
                        <p style={styles.subtitulo}>Gestiona los cambios de prendas de tus clientes</p>
                    </div>
                 
                </div>

                {/* Pestañas */}
                <div style={styles.tabs}>
                    <button
                        onClick={() => setVistaActiva('historial')}
                        style={{ ...styles.tab, ...(vistaActiva === 'historial' ? styles.tabActivo : {}) }}
                    >
                        📋 Historial de Cambios ({historial.length})
                    </button>
                    <button
                        onClick={() => setVistaActiva('nuevo')}
                        style={{ ...styles.tab, ...(vistaActiva === 'nuevo' ? styles.tabActivo : {}) }}
                    >
                        ➕ Nuevo Cambio
                    </button>
                </div>

                {/* ══════════════════════════════════════════ */}
                {/*              VISTA: HISTORIAL              */}
                {/* ══════════════════════════════════════════ */}
                {vistaActiva === 'historial' && (
                    <div>
                        {/* Buscador */}
                        <div style={styles.buscadorContainer}>
                            <span>🔍</span>
                            <input
                                placeholder="Buscar por cliente, # cambio o # venta/plan..."
                                value={busqueda}
                                onChange={e => setBusqueda(e.target.value)}
                                style={styles.buscador}
                            />
                        </div>

                        {cargandoHistorial ? (
                            <div style={styles.sinDatos}>Cargando historial...</div>
                        ) : historialFiltrado.length === 0 ? (
                            <div style={styles.sinDatos}>
                                <p style={{ fontSize: '40px', margin: 0 }}>🔄</p>
                                <p>{busqueda ? 'No se encontraron resultados' : 'No hay cambios registrados aún'}</p>
                            </div>
                        ) : (
                            <div style={styles.lista}>
                                {historialFiltrado.map(cambio => (
                                    <div key={cambio.id_cambio} style={styles.cambioCard}>
                                        <div style={styles.cambioFila}>
                                            {/* Ícono */}
                                            <div style={styles.cambioIcono}>
                                                <span style={{ fontSize: '28px' }}>🔄</span>
                                            </div>

                                            {/* Info principal */}
                                            <div style={styles.cambioInfo}>
                                                <p style={styles.cambioId}>
                                                    Cambio #{cambio.id_cambio}
                                                    <span style={{
                                                        ...styles.origenBadge,
                                                        backgroundColor: cambio.tipo_origen === 'venta' ? '#e3f2fd' : '#f3e5f5',
                                                        color: cambio.tipo_origen === 'venta' ? '#1565c0' : '#6a1b9a',
                                                    }}>
                                                        {cambio.tipo_origen === 'venta' ? `💵 Venta #${cambio.id_origen}` : `📋 Plan #${cambio.id_origen}`}
                                                    </span>
                                                </p>
                                                <p style={styles.cambioCliente}>👤 {cambio.nombre_cliente}</p>
                                                <p style={styles.cambioFecha}>📅 {cambio.fecha_cambio}</p>
                                            </div>

                                            {/* Resumen prendas */}
                                            <div style={styles.cambioResumen}>
                                                <div style={styles.resumenItem}>
                                                    <span style={styles.resumenLabel}>Devuelve</span>
                                                    <span style={{ color: '#bc4747', fontWeight: 'bold' }}>
                                                        {cambio.entradas.reduce((s, e) => s + e.cantidad, 0)} prenda{cambio.entradas.length !== 1 ? 's' : ''}
                                                    </span>
                                                </div>
                                                <div style={styles.resumenItem}>
                                                    <span style={styles.resumenLabel}>Se lleva</span>
                                                    <span style={{ color: '#2e7d52', fontWeight: 'bold' }}>
                                                        {cambio.salidas.reduce((s, e) => s + e.cantidad, 0)} prenda{cambio.salidas.length !== 1 ? 's' : ''}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Diferencia financiera */}
                                            <div style={styles.cambioDiferencia}>
                                                <span style={styles.diferenciaLabel}>Diferencia</span>
                                                <span style={{ fontSize: '18px', fontWeight: 'bold', color: colorDiferencia(cambio.total_diferencia) }}>
                                                    {cambio.total_diferencia > 0 ? '+' : ''}${Number(cambio.total_diferencia).toLocaleString()}
                                                </span>
                                                <span style={{ fontSize: '11px', color: colorDiferencia(cambio.total_diferencia) }}>
                                                    {textoDiferencia(cambio.total_diferencia)}
                                                </span>
                                            </div>

                                            {/* Botón detalle */}
                                            <button
                                                onClick={() => setExpandidoHistorial(expandidoHistorial === cambio.id_cambio ? null : cambio.id_cambio)}
                                                style={styles.botonVer}
                                            >
                                                {expandidoHistorial === cambio.id_cambio ? '▲ Ocultar' : '▼ Detalle'}
                                            </button>
                                        </div>

                                        {/* Detalle expandible */}
                                        {expandidoHistorial === cambio.id_cambio && (
                                            <div style={styles.detalleExpandido}>
                                                <div style={styles.detalleGrid}>

                                                    {/* Prendas devueltas */}
                                                    <div>
                                                        <p style={styles.detalleTitulo}>⬇️ Prendas devueltas al inventario</p>
                                                        {cambio.entradas.length === 0 ? (
                                                            <p style={{ color: '#aaa', fontSize: '13px' }}>Ninguna</p>
                                                        ) : (
                                                            <table style={styles.tabla}>
                                                                <thead>
                                                                    <tr style={{ backgroundColor: '#fff5f5' }}>
                                                                        <th style={styles.th}>Producto</th>
                                                                        <th style={styles.th}>Talla</th>
                                                                        <th style={styles.th}>Cant.</th>
                                                                        <th style={styles.th}>Precio</th>
                                                                        <th style={styles.th}>Subtotal</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {cambio.entradas.map((e, i) => (
                                                                        <tr key={i} style={{ borderTop: '1px solid #f0e0e0' }}>
                                                                            <td style={styles.td}>{e.nombre_producto}</td>
                                                                            <td style={styles.td}>
                                                                                <span style={styles.tallaPillRojo}>{e.talla}</span>
                                                                            </td>
                                                                            <td style={styles.td}>{e.cantidad} uds</td>
                                                                            <td style={styles.td}>${Number(e.precio_unitario).toLocaleString()}</td>
                                                                            <td style={{ ...styles.td, color: '#bc4747', fontWeight: 'bold' }}>
                                                                                ${Number(e.subtotal).toLocaleString()}
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        )}
                                                    </div>

                                                    {/* Prendas nuevas */}
                                                    <div>
                                                        <p style={styles.detalleTitulo}>⬆️ Prendas nuevas entregadas</p>
                                                        {cambio.salidas.length === 0 ? (
                                                            <p style={{ color: '#aaa', fontSize: '13px' }}>Ninguna</p>
                                                        ) : (
                                                            <table style={styles.tabla}>
                                                                <thead>
                                                                    <tr style={{ backgroundColor: '#f0faf4' }}>
                                                                        <th style={styles.th}>Producto</th>
                                                                        <th style={styles.th}>Talla</th>
                                                                        <th style={styles.th}>Cant.</th>
                                                                        <th style={styles.th}>Precio</th>
                                                                        <th style={styles.th}>Subtotal</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {cambio.salidas.map((s, i) => (
                                                                        <tr key={i} style={{ borderTop: '1px solid #e0f0e8' }}>
                                                                            <td style={styles.td}>{s.nombre_producto}</td>
                                                                            <td style={styles.td}>
                                                                                <span style={styles.tallaPillVerde}>{s.talla}</span>
                                                                            </td>
                                                                            <td style={styles.td}>{s.cantidad} uds</td>
                                                                            <td style={styles.td}>${Number(s.precio_venta).toLocaleString()}</td>
                                                                            <td style={{ ...styles.td, color: '#2e7d52', fontWeight: 'bold' }}>
                                                                                ${Number(s.subtotal).toLocaleString()}
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Balance final */}
                                                <div style={{ ...styles.balanceBox, borderColor: colorDiferencia(cambio.total_diferencia) }}>
                                                    <span style={{ fontSize: '14px', color: '#555' }}>Balance final del cambio:</span>
                                                    <span style={{ fontSize: '20px', fontWeight: 'bold', color: colorDiferencia(cambio.total_diferencia) }}>
                                                        {cambio.total_diferencia > 0 ? '+' : ''}${Number(cambio.total_diferencia).toLocaleString()} — {textoDiferencia(cambio.total_diferencia)}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ══════════════════════════════════════════ */}
                {/*           VISTA: NUEVO CAMBIO             */}
                {/* ══════════════════════════════════════════ */}
                {vistaActiva === 'nuevo' && (
                    <div>
                        {mensaje && (
                            <div style={styles.alertaExito}>✅ {mensaje}</div>
                        )}
                        {error && (
                            <div style={styles.alertaError}>⚠️ {error}</div>
                        )}

                        {/* Paso 1: Localizar compra */}
                        <div style={styles.pasoCard}>
                            <h4 style={styles.pasoTitulo}>🔍 Paso 1: Localizar Compra Original</h4>
                            <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                                <div>
                                    <label style={styles.label}>Buscar en:</label>
                                    <select value={tipoOrigen} onChange={e => setTipoOrigen(e.target.value)} style={styles.selectField}>
                                        <option value="venta">💵 Venta Normal</option>
                                        <option value="plan_separe">📋 Plan Separe</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={styles.label}>Número de ID:</label>
                                    <input
                                        type="number"
                                        value={idOrigen}
                                        onChange={e => setIdOrigen(e.target.value)}
                                        placeholder="Ej: 10"
                                        style={styles.inputField}
                                        onKeyDown={e => e.key === 'Enter' && consultarOrigen()}
                                    />
                                </div>
                                <button onClick={consultarOrigen} disabled={cargandoOrigen} style={styles.botonBuscar}>
                                    {cargandoOrigen ? 'Buscando...' : '🔍 Cargar Detalles'}
                                </button>
                            </div>
                        </div>

                        {/* Formulario si hay datos */}
                        {datosOrigen && (
                            <form onSubmit={handleSubmit}>
                                {/* Banner del cliente */}
                                <div style={styles.bannerCliente}>
                                    <span>👤 <strong>{datosOrigen.nombre_cliente}</strong></span>
                                    <span style={{ color: '#555', fontSize: '14px' }}>
                                        Total original: <strong>${parseFloat(datosOrigen.total_transaccion).toLocaleString()}</strong>
                                    </span>
                                </div>

                                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'flex-start' }}>

                                    {/* Columna izquierda: devolver */}
                                    <div style={styles.columnaForm}>
                                        <h3 style={{ ...styles.columnaTitulo, color: '#bc4747' }}>⬇️ Paso 2: ¿Qué prenda devuelve?</h3>
                                        <p style={styles.columnaSubtitulo}>Selecciona los artículos que el cliente entrega:</p>

                                        {datosOrigen.detalles.map(prod => {
                                            const seleccionado = productosDevueltos.some(p => p.id_producto === prod.id_producto && p.talla === prod.talla);
                                            const idx = productosDevueltos.findIndex(p => p.id_producto === prod.id_producto && p.talla === prod.talla);

                                            return (
                                                <div key={`${prod.id_producto}-${prod.talla}`} style={{
                                                    ...styles.prodCard,
                                                    backgroundColor: seleccionado ? '#fff5f5' : '#fff',
                                                    borderColor: seleccionado ? '#e53935' : '#e0ede6',
                                                }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <div>
                                                            <p style={{ fontWeight: 'bold', fontSize: '14px', margin: '0 0 4px 0' }}>{prod.nombre_producto}</p>
                                                            <span style={{ fontSize: '12px', color: '#666' }}>
                                                                Talla: <span style={styles.tallaPillRojo}>{prod.talla}</span> &nbsp;|&nbsp; ${parseFloat(prod.precio_unitario).toLocaleString()} c/u
                                                            </span>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleSeleccionDevolucion(prod)}
                                                            style={{
                                                                ...styles.botonToggle,
                                                                backgroundColor: seleccionado ? '#e53935' : '#2e7d52',
                                                            }}
                                                        >
                                                            {seleccionado ? '✕ Quitar' : '+ Devolver'}
                                                        </button>
                                                    </div>
                                                    {seleccionado && (
                                                        <div style={styles.cantidadRow}>
                                                            <label style={{ fontSize: '12px', color: '#555' }}>Cantidad (máx {prod.cantidad_maxima}):</label>
                                                            <input
                                                                type="number"
                                                                min="1"
                                                                max={prod.cantidad_maxima}
                                                                value={productosDevueltos[idx].cantidad}
                                                                onChange={e => manejarCantidadDevuelta(idx, e.target.value)}
                                                                style={{ ...styles.inputField, width: '70px', textAlign: 'center', padding: '5px' }}
                                                            />
                                                            <span style={{ fontWeight: 'bold', color: '#bc4747' }}>
                                                                -${(productosDevueltos[idx].precio_unitario * productosDevueltos[idx].cantidad).toLocaleString()}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Columna derecha: prendas nuevas */}
                                    <div style={styles.columnaForm}>
                                        <h3 style={{ ...styles.columnaTitulo, color: '#2e7d52' }}>⬆️ Paso 3: ¿Qué prendas nuevas se lleva?</h3>
                                        <p style={styles.columnaSubtitulo}>Agrega y selecciona las tallas disponibles:</p>

                                        {productosNuevos.map((item, idx) => {
                                            const prod = productosDisponiblesNuevos.find(p => p.id_producto === parseInt(item.id_producto));
                                            return (
                                                <div key={idx} style={styles.itemCard}>
                                                    <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', marginBottom: '10px' }}>
                                                        <div style={{ flex: 1 }}>
                                                            <label style={styles.labelSmall}>Producto</label>
                                                            <select
                                                                value={item.id_producto}
                                                                onChange={e => handleProductoNuevoChange(idx, e.target.value)}
                                                                style={styles.selectField}
                                                            >
                                                                <option value="">-- Seleccione --</option>
                                                                {productosDisponiblesNuevos.map(p => (
                                                                    <option key={p.id_producto} value={p.id_producto}>
                                                                        {p.nombre} (stock: {p.stock})
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                        <button type="button" onClick={() => eliminarProductoNuevo(idx)} style={styles.botonQuitar}>✕</button>
                                                    </div>

                                                    {/* Grid de tallas */}
                                                    {prod && prod.tallas && prod.tallas.length > 0 && (
                                                        <div style={styles.tallasGrid}>
                                                            {prod.tallas.map(t => {
                                                                const seleccionada = item.talla === t.talla;
                                                                const sinStock = t.cantidad === 0;
                                                                const stockBajo = t.cantidad > 0 && t.cantidad < STOCK_MINIMO;
                                                                return (
                                                                    <div
                                                                        key={t.talla}
                                                                        onClick={() => !sinStock && handleTallaCantidadNuevo(idx, t.talla, 1)}
                                                                        style={{
                                                                            ...styles.tallaCard,
                                                                            borderColor: seleccionada ? '#2e7d52' : stockBajo ? '#e65100' : sinStock ? '#ddd' : '#e0ede6',
                                                                            backgroundColor: seleccionada ? '#e8f5ee' : sinStock ? '#f9f9f9' : 'white',
                                                                            opacity: sinStock ? 0.5 : 1,
                                                                            cursor: sinStock ? 'not-allowed' : 'pointer',
                                                                        }}
                                                                    >
                                                                        <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{t.talla}</div>
                                                                        <div style={{ fontSize: '11px', color: sinStock ? '#ccc' : stockBajo ? '#e65100' : '#2e7d52', fontWeight: '600' }}>
                                                                            {sinStock ? 'Sin stock' : `${t.cantidad} disp.`}
                                                                            {stockBajo && !sinStock && ' ⚠️'}
                                                                        </div>
                                                                        {seleccionada && (
                                                                            <input
                                                                                type="number"
                                                                                min="1"
                                                                                max={t.cantidad}
                                                                                value={item.cantidad}
                                                                                onClick={e => e.stopPropagation()}
                                                                                onChange={e => manejarCambioNuevo(idx, 'cantidad', e.target.value)}
                                                                                style={{ width: '50px', padding: '3px', border: '1.5px solid #2e7d52', borderRadius: '6px', textAlign: 'center', fontSize: '13px', marginTop: '4px' }}
                                                                            />
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}

                                                    {item.talla && item.precio_unitario > 0 && (
                                                        <div style={styles.itemResumen}>
                                                            <span>Talla <strong>{item.talla}</strong> × {item.cantidad} ud(s)</span>
                                                            <span style={{ color: '#2e7d52', fontWeight: 'bold' }}>
                                                                +${(item.precio_unitario * (parseInt(item.cantidad) || 0)).toLocaleString()}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}

                                        <button type="button" onClick={agregarProductoNuevo} style={styles.botonAgregar}>
                                            + Vincular nueva prenda
                                        </button>
                                    </div>
                                </div>

                                {/* Balance financiero */}
                                <div style={styles.balanceFinal}>
                                    <div style={styles.balanceFila}>
                                        <span>Total devuelto por cliente:</span>
                                        <span style={{ color: '#bc4747', fontWeight: 'bold' }}>-${totalDevuelto.toLocaleString()}</span>
                                    </div>
                                    <div style={styles.balanceFila}>
                                        <span>Total prendas nuevas:</span>
                                        <span style={{ color: '#2e7d52', fontWeight: 'bold' }}>+${totalNuevo.toLocaleString()}</span>
                                    </div>
                                    <hr style={{ border: '0.5px solid #cce3d5', margin: '10px 0' }} />
                                    <div style={styles.balanceFila}>
                                        <span style={{ fontSize: '16px', fontWeight: 'bold' }}>Diferencia neta:</span>
                                        <span style={{ fontSize: '22px', fontWeight: 'bold', color: colorDiferencia(diferencia) }}>
                                            {diferencia > 0 ? `+$${diferencia.toLocaleString()}` : diferencia < 0 ? `-$${Math.abs(diferencia).toLocaleString()}` : '$0'}
                                        </span>
                                    </div>
                                    <div style={{ marginTop: '10px', padding: '10px 14px', backgroundColor: 'white', borderRadius: '8px', fontSize: '13px', color: '#444', border: '1px solid #cce3d5' }}>
                                        <strong>Efecto:</strong>{' '}
                                        {diferencia === 0 && 'Cambio directo neto — sin movimiento de dinero.'}
                                        {diferencia > 0 && (tipoOrigen === 'plan_separe'
                                            ? `Se suman $${diferencia.toLocaleString()} al saldo pendiente del Plan Separe.`
                                            : `El cliente debe pagar $${diferencia.toLocaleString()} adicionales en caja.`)}
                                        {diferencia < 0 && (datosOrigen.id_cliente
                                            ? `Se asignan $${Math.abs(diferencia).toLocaleString()} como saldo a favor de ${datosOrigen.nombre_cliente}.`
                                            : '❌ No se puede generar saldo a favor para cliente ocasional.')}
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading || (diferencia < 0 && !datosOrigen.id_cliente)}
                                    style={{
                                        ...styles.botonEnviar,
                                        opacity: (loading || (diferencia < 0 && !datosOrigen.id_cliente)) ? 0.6 : 1,
                                    }}
                                >
                                    {loading ? 'Procesando...' : '✅ Confirmar Cambio'}
                                </button>
                            </form>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
};

const styles = {
    layout: { display: 'flex', minHeight: '100vh', backgroundColor: '#f0f4f0' },
    contenido: { marginLeft: '250px', flex: 1, padding: '30px' },

    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #e0ede6' },
    titulo: { fontSize: '26px', color: '#2e7d52', fontWeight: 'bold', margin: 0 },
    subtitulo: { color: '#666', marginTop: '4px', fontSize: '14px' },
    botonNuevo: { backgroundColor: '#2e7d52', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' },

    tabs: { display: 'flex', gap: '8px', marginBottom: '20px' },
    tab: { padding: '10px 20px', border: '1.5px solid #e0ede6', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', backgroundColor: 'white', color: '#555' },
    tabActivo: { backgroundColor: '#2e7d52', color: 'white', borderColor: '#2e7d52' },

    buscadorContainer: { display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: 'white', border: '1.5px solid #e0ede6', borderRadius: '10px', padding: '0 15px', marginBottom: '16px' },
    buscador: { border: 'none', outline: 'none', padding: '11px 0', fontSize: '14px', width: '100%' },

    lista: { display: 'flex', flexDirection: 'column', gap: '10px' },
    cambioCard: { backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', overflow: 'hidden' },
    cambioFila: { display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px' },
    cambioIcono: { flexShrink: 0 },
    cambioInfo: { flex: 1 },
    cambioId: { fontSize: '14px', fontWeight: 'bold', color: '#2d2d2d', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' },
    origenBadge: { padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '600' },
    cambioCliente: { fontSize: '13px', color: '#555', margin: '0 0 2px 0' },
    cambioFecha: { fontSize: '12px', color: '#aaa', margin: 0 },
    cambioResumen: { display: 'flex', gap: '20px' },
    resumenItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' },
    resumenLabel: { fontSize: '11px', color: '#aaa' },
    cambioDiferencia: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', minWidth: '140px' },
    diferenciaLabel: { fontSize: '11px', color: '#aaa' },
    botonVer: { backgroundColor: '#f0f4f0', color: '#555', border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', flexShrink: 0 },

    detalleExpandido: { borderTop: '1px solid #f0f4f0', padding: '20px', backgroundColor: '#fafffe' },
    detalleGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '16px' },
    detalleTitulo: { fontSize: '13px', fontWeight: '700', margin: '0 0 10px 0' },
    tabla: { width: '100%', borderCollapse: 'collapse' },
    th: { padding: '8px 12px', textAlign: 'left', fontSize: '12px', color: '#555', fontWeight: '600' },
    td: { padding: '8px 12px', fontSize: '13px', color: '#333' },
    tallaPillRojo: { backgroundColor: '#fdecea', color: '#e53935', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' },
    tallaPillVerde: { backgroundColor: '#e8f5ee', color: '#2e7d52', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' },
    balanceBox: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderRadius: '8px', border: '2px solid', backgroundColor: 'white' },

    sinDatos: { backgroundColor: 'white', borderRadius: '12px', padding: '50px', textAlign: 'center', color: '#999' },
    alertaExito: { backgroundColor: '#e8f5ee', color: '#2e7d52', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontWeight: '500' },
    alertaError: { backgroundColor: '#fdecea', color: '#e53935', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px' },

    pasoCard: { backgroundColor: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e0ede6', marginBottom: '20px', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' },
    pasoTitulo: { margin: '0 0 12px 0', color: '#2e7d52', fontSize: '15px' },
    label: { fontSize: '13px', color: '#555', fontWeight: '600', display: 'block', marginBottom: '4px' },
    labelSmall: { fontSize: '12px', color: '#777', fontWeight: '600', display: 'block', marginBottom: '4px' },
    inputField: { padding: '10px 14px', border: '1.5px solid #e0ede6', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', backgroundColor: 'white' },
    selectField: { padding: '10px 14px', border: '1.5px solid #e0ede6', borderRadius: '8px', fontSize: '14px', outline: 'none', backgroundColor: 'white', width: '100%', boxSizing: 'border-box' },
    botonBuscar: { backgroundColor: '#1565c0', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' },

    bannerCliente: { backgroundColor: '#f0faf4', padding: '12px 20px', borderRadius: '8px', marginBottom: '20px', borderLeft: '4px solid #2e7d52', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },

    columnaForm: { flex: 1, minWidth: '350px', backgroundColor: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e0ede6' },
    columnaTitulo: { margin: '0 0 4px 0', fontSize: '15px' },
    columnaSubtitulo: { fontSize: '12px', color: '#777', marginBottom: '14px', marginTop: '2px' },
    prodCard: { padding: '14px', border: '1.5px solid #e0ede6', borderRadius: '8px', marginBottom: '10px', transition: 'all 0.2s' },
    cantidadRow: { display: 'flex', alignItems: 'center', gap: '12px', marginTop: '10px', borderTop: '1px dashed #e0ede6', paddingTop: '8px' },
    botonToggle: { padding: '6px 14px', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', flexShrink: 0 },

    itemCard: { backgroundColor: '#f8fffe', border: '1px solid #e0ede6', borderRadius: '10px', padding: '14px', marginBottom: '10px' },
    botonQuitar: { backgroundColor: '#fdecea', color: '#e53935', border: 'none', width: '36px', height: '36px', borderRadius: '6px', cursor: 'pointer', flexShrink: 0, fontWeight: 'bold' },
    tallasGrid: { display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' },
    tallaCard: { border: '2px solid #e0ede6', borderRadius: '10px', padding: '8px 12px', minWidth: '70px', textAlign: 'center', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' },
    itemResumen: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f0faf4', borderRadius: '6px', padding: '8px 12px', fontSize: '13px', color: '#555', marginTop: '6px' },
    botonAgregar: { backgroundColor: 'transparent', color: '#2e7d52', border: '1.5px dashed #2e7d52', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', width: '100%', marginTop: '8px' },

    balanceFinal: { backgroundColor: '#e8f5ee', padding: '18px 22px', borderRadius: '10px', marginTop: '20px', border: '1px solid #cbdcd0' },
    balanceFila: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' },
    botonEnviar: { marginTop: '16px', width: '100%', padding: '14px', backgroundColor: '#2e7d52', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '15px', fontWeight: 'bold', boxShadow: '0 4px 12px rgba(46,125,82,0.2)' },
};

export default CambiosPage;
