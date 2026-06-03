import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom'; // 👈 Agregamos useLocation
import Sidebar from '../components/Sidebar';
import { getReporteCompraId, getListaComprasReportes } from '../api/reporteCompras';

const ReporteCompraDetalle = () => {
    const { id_compra } = useParams(); 
    const navigate = useNavigate();
    const location = useLocation(); // 👈 Captura los datos enviados desde la lista

    // --- ESTADOS DE CONTROL DE VISTA ---
    const [vista, setVista] = useState(id_compra ? 'detalle' : 'lista');
    const [idSeleccionado, setIdSeleccionado] = useState(id_compra || null);

    // --- ESTADOS PARA LA VISTA: HISTORIAL GENERAL ---
    const [listaCompras, setListaCompras] = useState([]);
    const [busqueda, setBusqueda] = useState('');
    const [cargandoLista, setCargandoLista] = useState(false);

    // --- ESTADOS PARA LA VISTA: DETALLE FACTURA ---
    const [reporte, setReporte] = useState(null);
    const [cargandoDetalle, setCargandoDetalle] = useState(false);
    const [error, setError] = useState('');

    // --- EFECTO 1: CARGAR EL HISTORIAL GENERAL DE COMPRAS ---
    useEffect(() => {
        if (vista === 'lista') {
            const cargarListaGeneral = async () => {
                setCargandoLista(true);
                setError('');
                try {
                    const data = await getListaComprasReportes();
                    setListaCompras(Array.isArray(data) ? data : data.compras || []);
                } catch (err) {
                    console.error(err);
                    setError('No se pudo cargar el historial general de compras.');
                } finally {
                    setCargandoLista(false);
                }
            };
            cargarListaGeneral();
        }
    }, [vista]);

    // --- EFECTO 2: CARGAR EL DETALLE DE UNA FACTURA SELECCIONADA ---
    useEffect(() => {
        if (vista === 'detalle' && idSeleccionado) {
            const obtenerDatosReporte = async () => {
                setCargandoDetalle(true);
                setError('');
                try {
                    const response = await getReporteCompraId(idSeleccionado);
                    let datosApi = response && response.data ? response.data : response;

                    // 🔥 EL TRUCO DEFINITIVO: Si entramos desde la lista, usamos la fecha original de la lista
                    if (location.state && location.state.compraOriginal) {
                        datosApi = {
                            ...datosApi,
                            // Forzamos a que use la fecha exacta que viste en la tabla
                            fecha_compra: location.state.compraOriginal.fecha_compra || location.state.compraOriginal.fecha,
                            usuario_comprador: location.state.compraOriginal.nombre_usuario || datosApi.usuario_comprador
                        };
                    }

                    setReporte(datosApi);
                } catch (err) {
                    console.error(err);
                    setError('No se pudo obtener el reporte detallado de esta compra.');
                } finally {
                    setCargandoDetalle(false);
                }
            };
            obtenerDatosReporte();
        }
    }, [vista, idSeleccionado, location.state]); // 👈 Escucha cambios en el state de la ruta

    // Escuchar si la URL cambia dinámicamente
    useEffect(() => {
        if (id_compra) {
            setIdSeleccionado(id_compra);
            setVista('detalle');
        }
    }, [id_compra]);

    // --- FILTRADO DE BÚSQUEDA ---
    const comprasFiltradas = listaCompras.filter(compra => 
        compra.id_compra?.toString().includes(busqueda) ||
        compra.nombre_proveedor?.toLowerCase().includes(busqueda.toLowerCase()) ||
        compra.nombre_usuario?.toLowerCase().includes(busqueda.toLowerCase())
    );

    // --- NAVEGACIÓN INTERNA ENVIANDO EL OBJETO ORIGINAL ---
    const manejarVerDetalle = (compra) => {
        setIdSeleccionado(compra.id_compra);
        setVista('detalle');
        // 👈 Pasamos toda la información de la fila en el "state" del router
        navigate(`/reporte-compra/${compra.id_compra}`, { state: { compraOriginal: compra } });
    };

    const manejarVolverALista = () => {
        setVista('lista');
        setReporte(null);
        navigate('/reporte-compras-lista', { state: null }); 
    };

    // --- FUNCIÓN AUXILIAR PARA FORMATEAR FECHA Y HORA ---
    const formatearFechaHora = (fechaString) => {
        if (!fechaString) return 'No disponible';
        try {
            const fechaLimpia = typeof fechaString === 'string' ? fechaString.trim() : fechaString;
            const fechaObj = new Date(fechaLimpia);
            
            if (isNaN(fechaObj.getTime())) return fechaString; 
            
            return fechaObj.toLocaleString('es-CO', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true,
                timeZone: 'America/Bogota'
            });
        } catch (e) {
            return fechaString;
        }
    };

    return (
        <div style={styles.layout}>
            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    #contenido-dinamico { 
                        margin-left: 0 !important; 
                        padding: 0 !important; 
                        width: 100% !important;
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                    }
                    .factura-box { 
                        border: none !important; 
                        box-shadow: none !important; 
                        padding: 10px !important; 
                        width: 100% !important;
                    }
                    table {
                        width: 100% !important;
                        border-collapse: collapse !important;
                        table-layout: fixed !important;
                    }
                    th, td { word-wrap: break-word !important; }
                    @page { size: auto; margin: 15mm 12mm 20mm 12mm; }
                    body { background-color: white !important; color: black !important; }
                }
            `}</style>

            <div className="no-print">
                <Sidebar />
            </div>

            <div id="contenido-dinamico" style={styles.contenido}>
                
                {/* ========================================================= */}
                {/* VISTA 1: HISTORIAL GENERAL DE COMPRAS                     */}
                {/* ========================================================= */}
                {vista === 'lista' && (
                    <div>
                        <div style={styles.header}>
                            <div>
                                <h1 style={styles.titulo}>📦 Historial de Reportes de Compras</h1>
                                <p style={styles.subtitulo}>Selecciona una adquisición para auditar o imprimir su comprobante</p>
                            </div>
                        </div>

                        <div style={styles.buscadorContainer}>
                            <input 
                                type="text" 
                                placeholder="🔍 Buscar compra por ID, Proveedor o Encargado..." 
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                style={styles.inputBuscador}
                            />
                        </div>

                        {cargandoLista && <div style={styles.centro}>Cargando historial de adquisiciones...</div>}
                        {error && <div style={styles.error}>⚠️ {error}</div>}

                        {!cargandoLista && !error && (
                            <div style={styles.tablaContainer}>
                                <table style={styles.tabla}>
                                    <thead>
                                        <tr style={styles.tablaHeaderRow}>
                                            <th style={styles.th}>ID Compra</th>
                                            <th style={styles.th}>Fecha y Hora</th>
                                            <th style={styles.th}>Proveedor</th>
                                            <th style={styles.th}>Registrado Por</th>
                                            <th style={{...styles.th, textAlign: 'right'}}>Total Invertido</th>
                                            <th style={{...styles.th, textAlign: 'center'}}>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {comprasFiltradas.length > 0 ? (
                                            comprasFiltradas.map((compra) => (
                                                <tr key={compra.id_compra} style={styles.tablaRow}>
                                                    <td style={{...styles.td, fontWeight: 'bold', color: '#2e7d52'}}>#{compra.id_compra}</td>
                                                    <td style={styles.td}>
                                                        {formatearFechaHora(compra.fecha_compra || compra.fecha)}
                                                    </td>
                                                    <td style={styles.td}>{compra.nombre_proveedor}</td>
                                                    <td style={styles.td}>{compra.nombre_usuario}</td>
                                                    <td style={{...styles.td, textAlign: 'right', fontWeight: 'bold'}}>
                                                        ${Number(compra.total).toLocaleString('es-CO')}
                                                    </td>
                                                    <td style={{...styles.td, textAlign: 'center'}}>
                                                        {/* 👇 Modificado para pasar todo el objeto de la compra */}
                                                        <button 
                                                            onClick={() => manejarVerDetalle(compra)}
                                                            style={styles.botonVer}
                                                        >
                                                            👁️ Ver Reporte
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="6" style={styles.noDatos}>No se encontraron compras en el registro.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* ========================================================= */}
                {/* VISTA 2: DETALLE DE FACTURA SELECCIONADA                  */}
                {/* ========================================================= */}
                {vista === 'detalle' && (
                    <div>
                        <div style={styles.header} className="no-print">
                            <div>
                                <h1 style={styles.titulo}>📊 Reporte Detallado de Compra</h1>
                                <p style={styles.subtitulo}>Visualización y descarga en formato de comprobante</p>
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button onClick={manejarVolverALista} style={styles.botonRegresar}>
                                    ← Volver al Historial
                                </button>
                                <button 
                                    onClick={() => window.print()} 
                                    style={styles.botonImprimir}
                                    disabled={cargandoDetalle || error || !reporte}
                                >
                                    🖨️ Imprimir / Guardar PDF
                                </button>
                            </div>
                        </div>

                        {cargandoDetalle && <div style={styles.centro}>Generando vista de factura...</div>}
                        {error && <div style={styles.error}>⚠️ {error}</div>}

                        {!cargandoDetalle && !error && reporte && (
                            <div className="factura-box" style={styles.facturaContainer}>
                                
                                {/* Cabecera del Comprobante */}
                                <div style={styles.facturaHeader}>
                                    <div>
                                        <h2 style={styles.empresaTitulo}>PLAN SEPARÉ WHITE & BLACK</h2>
                                        <p style={styles.empresaSub}>Control de Inventario y Adquisiciones</p>
                                    </div>
                                    <div style={styles.facturaMeta}>
                                        <div style={styles.numeroFactura}>COMPRA N° #{reporte.id_compra}</div>
                                        <p style={styles.metaTexto}>
                                            <strong>Fecha:</strong> {formatearFechaHora(reporte.fecha_compra)}
                                        </p>
                                        <p style={styles.metaTexto}><strong>Encargado:</strong> {reporte.usuario_comprador || 'Administrador'}</p>
                                    </div>
                                </div>

                                {/* Datos del Proveedor */}
                                <div style={styles.proveedorSeccion}>
                                    <h3 style={styles.seccionTitulo}>🏭 DATOS DEL PROVEEDOR</h3>
                                    <div style={styles.proveedorGrid}>
                                        <p style={styles.infoItem}><strong>Razón Social:</strong> {reporte.proveedor?.nombre_empresa || reporte.nombre_proveedor || 'Proveedor No Asignado'}</p>
                                        <p style={styles.infoItem}><strong>Contacto:</strong> {reporte.proveedor?.contacto || 'No registrado'}</p>
                                        <p style={styles.infoItem}><strong>Teléfono:</strong> {reporte.proveedor?.telefono || 'No registrado'}</p>
                                        <p style={styles.infoItem}><strong>Correo:</strong> {reporte.proveedor?.correo || 'No registrado'}</p>
                                        <p style={styles.infoItem}><strong>Dirección:</strong> {reporte.proveedor?.direccion || 'No registrado'}</p>
                                    </div>
                                </div>

                                {/* Detalles de los Productos Comprados */}
                                <table style={styles.tabla}>
                                    <thead>
                                        <tr style={styles.tablaHeaderRow}>
                                            <th style={{...styles.tablaTh, textAlign: 'left'}}>Descripción del Producto</th>
                                            <th style={{...styles.tablaTh, textAlign: 'center', width: '100px'}}>Cantidad</th>
                                            <th style={{...styles.tablaTh, textAlign: 'right', width: '150px'}}>Precio Unitario</th>
                                            <th style={{...styles.tablaTh, textAlign: 'right', width: '150px'}}>Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reporte.items && reporte.items.length > 0 ? (
                                            reporte.items.map((item, index) => (
                                                <tr key={index} style={styles.tablaRow}>
                                                    <td style={{...styles.tablaTd, textAlign: 'left', fontWeight: '500', color: '#2d2d2d'}}>
                                                        {item.producto || item.nombre_producto}
                                                    </td>
                                                    <td style={{...styles.tablaTd, textAlign: 'center'}}>{item.cantidad}</td>
                                                    <td style={{...styles.tablaTd, textAlign: 'right'}}>
                                                        ${Number(item.precio_unitario || item.precio || 0).toLocaleString('es-CO')}
                                                    </td>
                                                    <td style={{...styles.tablaTd, textAlign: 'right', fontWeight: 'bold', color: '#2d2d2d'}}>
                                                        ${Number(item.subtotal || (item.cantidad * (item.precio_unitario || item.precio || 0)) || 0).toLocaleString('es-CO')}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="4" style={{...styles.tablaTd, textAlign: 'center', color: '#999'}}>
                                                    No se encontraron productos en este reporte.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>

                                {/* Cierre y Totales */}
                                <div style={styles.totalSeccion}>
                                    <div style={{ textAlign: 'right' }}>
                                        <p style={styles.totalLabel}>TOTAL ADQUISICIÓN</p>
                                        <p style={styles.totalMonto}>${Number(reporte.total || 0).toLocaleString('es-CO')}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

// --- HOJA DE ESTILOS CORREGIDA ---
const styles = {
    layout: { display: 'flex', minHeight: '100vh', backgroundColor: '#f0f4f0', fontFamily: 'system-ui, sans-serif' },
    contenido: { marginLeft: '250px', flex: 1, padding: '30px' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #e0ede6' },
    titulo: { fontSize: '26px', color: '#2e7d52', fontWeight: 'bold', margin: 0 },
    subtitulo: { color: '#666', marginTop: '4px', fontSize: '14px' },
    buscadorContainer: { marginBottom: '20px' },
    inputBuscador: { width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1.5px solid #ced4da', fontSize: '14px', outline: 'none' },
    centro: { textAlign: 'center', padding: '50px', color: '#666', fontSize: '14px' },
    error: { color: '#e53935', backgroundColor: '#fdecea', padding: '10px 15px', borderRadius: '8px', marginBottom: '15px', fontSize: '14px' },
    tablaContainer: { backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', border: '1px solid #e0ede6', overflow: 'hidden' },
    tabla: { width: '100%', borderCollapse: 'collapse' },
    tablaHeaderRow: { backgroundColor: '#e8f5ee', borderBottom: '2px solid #2e7d52' },
    th: { padding: '14px 16px', fontSize: '13px', fontWeight: 'bold', color: '#2e7d52', textAlign: 'left' },
    tablaRow: { borderBottom: '1px solid #f0f4f0' },
    td: { padding: '14px 16px', fontSize: '13px', color: '#444' },
    botonVer: { backgroundColor: '#2e7d52', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }, // <-- Corregido y asegurado aquí
    noDatos: { textAlign: 'center', padding: '30px', color: '#999', fontSize: '14px' },
    botonImprimir: { backgroundColor: '#2e7d52', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' },
    botonRegresar: { backgroundColor: 'white', color: '#666', border: '1.5px solid #ddd', padding: '10px 18px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' },
    facturaContainer: { backgroundColor: 'white', borderRadius: '16px', padding: '40px', paddingBottom: '70px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1.5px solid #e0ede6', marginBottom: '50px' },
    facturaHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #2e7d52', paddingBottom: '20px', marginBottom: '25px' },
    empresaTitulo: { fontSize: '22px', fontWeight: 'bold', color: '#2e7d52', margin: 0 },
    empresaSub: { fontSize: '13px', color: '#666', margin: '4px 0 0 0' },
    facturaMeta: { textAlign: 'right' },
    numeroFactura: { fontSize: '16px', fontWeight: 'bold', color: 'white', backgroundColor: '#2e7d52', padding: '6px 14px', borderRadius: '6px', display: 'inline-block', marginBottom: '8px' },
    metaTexto: { fontSize: '13px', color: '#555', margin: '3px 0' },
    proveedorSeccion: { backgroundColor: '#fafdfb', border: '1px solid #e0ede6', borderRadius: '10px', padding: '20px', marginBottom: '30px' },
    seccionTitulo: { fontSize: '13px', fontWeight: 'bold', color: '#2e7d52', margin: '0 0 12px 0' },
    proveedorGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' },
    infoItem: { fontSize: '13px', color: '#444', margin: 0 },
    tablaTh: { padding: '12px 16px', fontSize: '13px', fontWeight: 'bold', color: '#2e7d52' },
    tablaTd: { padding: '14px 16px', fontSize: '13px', color: '#555' },
    totalSeccion: { display: 'flex', justifyContent: 'flex-end', marginTop: '25px', paddingTop: '20px', borderTop: '2px solid #e0ede6' },
    totalLabel: { fontSize: '12px', color: '#666', fontWeight: 'bold', margin: 0 },
    totalMonto: { fontSize: '28px', fontWeight: 'bold', color: '#2e7d52', margin: '5px 0 0 0', lineHeight: '1.2' },
};

export default ReporteCompraDetalle;