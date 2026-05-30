import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
// Importamos las funciones modulares conectadas con Django
import { getMetricasFinancieras, getTopProductos, getEstadoInventario } from '../api/reportes';

const Reportes = () => {
    const [periodo, setPeriodo] = useState('mes'); // hoy, semana, mes

    // Estados para almacenar las respuestas de tu servidor Django
    const [financieros, setFinancieros] = useState(null);
    const [topProductos, setTopProductos] = useState([]);
    const [inventario, setInventario] = useState(null);
    const [cargando, setCargando] = useState(false);

    useEffect(() => {
        cargarDatosGenerales();
    }, [periodo]);

    const cargarDatosGenerales = async () => {
        setCargando(true);
        try {
            // Ejecutamos las tres consultas simultáneamente en tu backend Django
            const [dataFin, dataTop, dataInv] = await Promise.all([
                getMetricasFinancieras(periodo),
                getTopProductos(),
                getEstadoInventario()
            ]);

            setFinancieros(dataFin);
            setTopProductos(dataTop);
            setInventario(dataInv);
        } catch (err) {
            console.error("Error al conectar con los endpoints de Django:", err);
        } finally {
            setCargando(false);
        }
    };

    return (
        <div style={styles.layout}>
            <Sidebar />
            <div style={styles.contenido}>
                
                {/* Título de la sección */}
                <div style={styles.header}>
                    <div>
                        <h1 style={styles.titulo}>📊 Centro de Reportes y Analítica</h1>
                        <p style={styles.subtitulo}>Monitorea las finanzas, rendimiento e inventario en tiempo real</p>
                    </div>
                </div>

               <div style={styles.filtroPeriodoRow}>
    <span style={{ fontSize: '14px', fontWeight: '600', color: '#555' }}>Filtrar periodo de ventas:</span>
    
    {/* Botones rápidos de siempre */}
    {[
        { key: 'hoy', label: 'Hoy' },
        { key: 'semana', label: 'Esta Semana' },
        { key: 'mes', label: 'Últimos 30 días' }
    ].map(p => (
        <button 
            key={p.key} 
            onClick={() => setPeriodo(p.key)} 
            style={{
                ...styles.periodoBton,
                backgroundColor: periodo === p.key ? '#2e7d52' : 'white',
                color: periodo === p.key ? 'white' : '#555',
                borderColor: periodo === p.key ? '#2e7d52' : '#e0ede6'
            }}
        >
            {p.label}
        </button>
    ))}

    {/* Barra separadora visual */}
    <span style={{ color: '#ccc', margin: '0 5px' }}>|</span>

    {/* 🌟 NUEVO: Selector de meses anteriores del año actual */}
    <select 
        value={periodo.startswith?.('mes_') ? periodo : ''} 
        onChange={(e) => {
            if (e.target.value) {
                setPeriodo(e.target.value); // Guardará "mes_1", "mes_2", etc.
            }
        }}
        style={{
            ...styles.periodoBton,
            padding: '5px 12px',
            backgroundColor: periodo.startsWith?.('mes_') ? '#2e7d52' : 'white',
            color: periodo.startsWith?.('mes_') ? 'white' : '#555',
            borderColor: periodo.startsWith?.('mes_') ? '#2e7d52' : '#e0ede6',
            outline: 'none',
            cursor: 'pointer'
        }}
    >
        <option value="" style={{ color: '#333', backgroundColor: 'white' }}>📅 Ver mes específico...</option>
        <option value="mes_1" style={{ color: '#333', backgroundColor: 'white' }}>Enero</option>
        <option value="mes_2" style={{ color: '#333', backgroundColor: 'white' }}>Febrero</option>
        <option value="mes_3" style={{ color: '#333', backgroundColor: 'white' }}>Marzo</option>
        <option value="mes_4" style={{ color: '#333', backgroundColor: 'white' }}>Abril</option>
        <option value="mes_5" style={{ color: '#333', backgroundColor: 'white' }}>Mayo</option>
        <option value="mes_6" style={{ color: '#333', backgroundColor: 'white' }}>Junio</option>
        <option value="mes_7" style={{ color: '#333', backgroundColor: 'white' }}>Julio</option>
        <option value="mes_8" style={{ color: '#333', backgroundColor: 'white' }}>Agosto</option>
        <option value="mes_9" style={{ color: '#333', backgroundColor: 'white' }}>Septiembre</option>
        <option value="mes_10" style={{ color: '#333', backgroundColor: 'white' }}>Octubre</option>
        <option value="mes_11" style={{ color: '#333', backgroundColor: 'white' }}>Noviembre</option>
        <option value="mes_12" style={{ color: '#333', backgroundColor: 'white' }}>Diciembre</option>
    </select>
</div>

                {cargando ? (
                    <div style={styles.loading}>Consultando base de datos en Django...</div>
                ) : (
                    <>
                        {/* Grid de Tarjetas KPI principales */}
                        <div style={styles.kpiGrid}>
                            <div style={styles.kpiCard}>
                                <span style={styles.kpiIcon}>💰</span>
                                <div>
                                    <p style={styles.kpiLabel}>Ingresos por Ventas</p>
                                    <p style={styles.kpiValor}>
                                        ${financieros?.ingresos_totales ? Number(financieros.ingresos_totales).toLocaleString() : 0}
                                    </p>
                                </div>
                            </div>
                            
                            <div style={{ ...styles.kpiCard, borderLeft: '4px solid #2e7d52' }}>
                                <span style={{ ...styles.kpiIcon, backgroundColor: '#e8f5ee' }}>📈</span>
                                <div>
                                    <p style={styles.kpiLabel}>Utilidad Estimada</p>
                                    <p style={{ ...styles.kpiValor, color: '#2e7d52' }}>
                                        ${financieros?.utilidad_neta ? Number(financieros.utilidad_neta).toLocaleString() : 0}
                                    </p>
                                </div>
                            </div>
                            
                            <div style={{ ...styles.kpiCard, borderLeft: '4px solid #1565c0' }}>
                                <span style={{ ...styles.kpiIcon, backgroundColor: '#e3f2fd' }}>📋</span>
                                <div>
                                    <p style={styles.kpiLabel}>Ventas Realizadas</p>
                                    <p style={{ ...styles.kpiValor, color: '#1565c0' }}>
                                        {financieros?.ventas_count || 0} operaciones
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Contenedor de bloques inferiores (Tablas y Resúmenes) */}
                        <div style={styles.dashboardSecciones}>
                            
                            {/* Panel Izquierdo: Tabla de productos más vendidos */}
                            <div style={styles.panelCard}>
                                <h3 style={styles.panelTitulo}>⭐ Top 5 Productos Más Vendidos</h3>
                                <table style={styles.tabla}>
                                    <thead>
                                        <tr style={{ backgroundColor: '#f8faf8' }}>
                                            <th style={styles.th}>Prenda</th>
                                            <th style={{ ...styles.th, textAlign: 'center' }}>Unidades</th>
                                            <th style={styles.th}>Total Generado</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {topProductos.length === 0 ? (
                                            <tr>
                                                <td colSpan="3" style={{ ...styles.td, textAlign: 'center', color: '#999', padding: '20px' }}>
                                                    No hay datos registrados en este periodo.
                                                </td>
                                            </tr>
                                        ) : (
                                            topProductos.map((p, i) => (
                                                <tr key={i} style={styles.tr}>
                                                    <td style={styles.td}>{p.nombre}</td>
                                                    <td style={{ ...styles.td, textAlign: 'center', fontWeight: 'bold' }}>{p.cantidad}</td>
                                                    <td style={{ ...styles.td, color: '#2e7d52', fontWeight: '600' }}>
                                                        ${Number(p.ingresos).toLocaleString()}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Panel Derecho: Balance de Inventario */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
                                <div style={styles.panelCard}>
                                    <h3 style={styles.panelTitulo}>📦 Auditoría de Inventario Actual</h3>
                                    <div style={styles.invInfoGrid}>
                                        <div>
                                            <span style={styles.invSub}>Capital en Bodega (Costo)</span>
                                            <p style={styles.invVal}>
                                                ${inventario?.valor_costo_total ? Number(inventario.valor_costo_total).toLocaleString() : 0}
                                            </p>
                                        </div>
                                        <div>
                                            <span style={styles.invSub}>Prendas Totales</span>
                                            <p style={styles.invVal}>{inventario?.prendas_totales || 0} uds</p>
                                        </div>
                                    </div>
                                    {inventario?.productos_bajo_stock > 0 && (
                                        <div style={styles.alertaStock}>
                                            ⚠️ Tienes <strong>{inventario.productos_bajo_stock}</strong> referencias con stock bajo o en cero.
                                        </div>
                                    )}
                                </div>
                            </div>

                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

// Objeto de estilos idéntico a la paleta limpia y estilizada de tu proyecto
const styles = {
    layout: { display: 'flex', minHeight: '100vh', backgroundColor: '#f0f4f0' },
    contenido: { marginLeft: '250px', flex: 1, padding: '30px' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid #e0ede6' },
    titulo: { fontSize: '26px', color: '#1e4630', fontWeight: 'bold', margin: 0 },
    subtitulo: { color: '#666', marginTop: '4px', fontSize: '14px' },
    filtroPeriodoRow: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' },
    periodoBton: { border: '1.5px solid #e0ede6', padding: '6px 14px', borderRadius: '20px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', transition: 'all 0.2s' },
    kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '25px' },
    kpiCard: { backgroundColor: 'white', padding: '20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '15px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', borderLeft: '4px solid #e65100' },
    kpiIcon: { width: '45px', height: '45px', backgroundColor: '#fff3e0', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' },
    kpiLabel: { fontSize: '12px', color: '#777', margin: 0, fontWeight: '500' },
    kpiValor: { fontSize: '22px', fontWeight: 'bold', margin: '2px 0 0 0', color: '#2d2d2d' },
    dashboardSecciones: { display: 'flex', gap: '20px', alignItems: 'flex-start' },
    panelCard: { backgroundColor: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', flex: 1.3 },
    panelTitulo: { fontSize: '15px', fontWeight: '700', color: '#1e4630', marginTop: 0, marginBottom: '15px' },
    tabla: { width: '100%', borderCollapse: 'collapse' },
    th: { padding: '10px 12px', textAlign: 'left', fontSize: '12px', color: '#555', borderBottom: '1px solid #e8f0ec' },
    td: { padding: '12px', fontSize: '13px', color: '#333' },
    tr: { borderBottom: '1px solid #f5f9f6' },
    invInfoGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' },
    invSub: { fontSize: '12px', color: '#888', display: 'block' },
    invVal: { fontSize: '18px', fontWeight: 'bold', color: '#2d2d2d', margin: '4px 0 0 0' },
    alertaStock: { backgroundColor: '#fff3e0', color: '#e65100', padding: '10px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '500' },
    loading: { textAlign: 'center', padding: '40px', color: '#666', fontSize: '14px' }
};

export default Reportes;