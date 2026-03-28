import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { getCompras, crearCompra, getDetallesCompra } from '../api/compras';
import { getProductos } from '../api/productos';
import { getProveedores } from '../api/proveedores';

const Compras = () => {
    const [compras, setCompras] = useState([]);
    const [productos, setProductos] = useState([]);
    const [proveedores, setProveedores] = useState([]);
    const [mostrarForm, setMostrarForm] = useState(false);
    const [expandido, setExpandido] = useState(null);
    const [detallesExpandido, setDetallesExpandido] = useState({});
    const [error, setError] = useState('');
    const [cargando, setCargando] = useState(false);

    // Datos del formulario de compra
    const [idProveedor, setIdProveedor] = useState('');
    const [items, setItems] = useState([
        { id_producto: '', cantidad: 1, precio_unitario: '' }
    ]);

    const usuario = JSON.parse(localStorage.getItem('usuario'));

    useEffect(() => {
        cargarTodo();
    }, []);

    const cargarTodo = async () => {
        setCargando(true);
        try {
            const [c, p, prov] = await Promise.all([
                getCompras(),
                getProductos(),
                getProveedores(),
            ]);
            setCompras(c);
            setProductos(p);
            setProveedores(prov);
        } catch {
            setError('Error al cargar los datos');
        } finally {
            setCargando(false);
        }
    };

    // Manejo de items del formulario
    const handleItemChange = (index, campo, valor) => {
        const nuevos = [...items];
        nuevos[index][campo] = valor;

        // Si cambia el producto, autocompletar precio con costo_promedio
        if (campo === 'id_producto' && valor) {
            const prod = productos.find(p => p.id_producto === parseInt(valor));
            if (prod) {
                nuevos[index].precio_unitario = prod.costo_promedio || '';
            }
        }
        setItems(nuevos);
    };

    const agregarItem = () => {
        setItems([...items, { id_producto: '', cantidad: 1, precio_unitario: '' }]);
    };

    const quitarItem = (index) => {
        if (items.length === 1) return;
        setItems(items.filter((_, i) => i !== index));
    };

    const calcularTotal = () => {
        return items.reduce((sum, item) => {
            return sum + (parseFloat(item.precio_unitario) || 0) * (parseInt(item.cantidad) || 0);
        }, 0);
    };

    const handleNuevaCompra = () => {
        setIdProveedor('');
        setItems([{ id_producto: '', cantidad: 1, precio_unitario: '' }]);
        setMostrarForm(true);
        setError('');
    };

    const handleGuardar = async () => {
        if (!idProveedor) {
            setError('Selecciona un proveedor');
            return;
        }
        const itemsValidos = items.filter(i => i.id_producto && i.cantidad > 0 && i.precio_unitario > 0);
        if (itemsValidos.length === 0) {
            setError('Agrega al menos un producto con cantidad y precio válidos');
            return;
        }

        const payload = {
            id_proveedor: parseInt(idProveedor),
            id_usuario: usuario?.id_usuario || usuario?.id,
            detalles: itemsValidos.map(i => ({
                id_producto: parseInt(i.id_producto),
                cantidad: parseInt(i.cantidad),
                precio_unitario: parseFloat(i.precio_unitario),
            }))
        };

        try {
            await crearCompra(payload);
            setMostrarForm(false);
            cargarTodo();
            setError('');
        } catch (err) {
            const msg = err.response?.data?.error || 'Error al registrar la compra';
            setError(msg);
        }
    };

    const handleVerDetalles = async (id) => {
        if (expandido === id) {
            setExpandido(null);
            return;
        }
        setExpandido(id);
        if (!detallesExpandido[id]) {
            try {
                const data = await getDetallesCompra(id);
                setDetallesExpandido(prev => ({ ...prev, [id]: data }));
            } catch {
                setError('Error al cargar los detalles');
            }
        }
    };

    const getNombreProducto = (id) => {
        const p = productos.find(p => p.id_producto === id);
        return p ? p.nombre : `Producto #${id}`;
    };

    const getNombreProveedor = (id) => {
        const p = proveedores.find(p => p.id_proveedor === id);
        return p ? p.nombre_empresa : `Proveedor #${id}`;
    };

    return (
        <div style={styles.layout}>
            <Sidebar />
            <div style={styles.contenido}>

                {/* Encabezado */}
                <div style={styles.header}>
                    <div>
                        <h1 style={styles.titulo}>🛒 Compras</h1>
                        <p style={styles.subtitulo}>
                            {compras.length} compra{compras.length !== 1 ? 's' : ''} registrada{compras.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                    <button onClick={handleNuevaCompra} style={styles.botonNuevo}>
                        + Nueva Compra
                    </button>
                </div>

                {error && <p style={styles.error}>{error}</p>}

                {/* Formulario nueva compra */}
                {mostrarForm && (
                    <div style={styles.formulario}>
                        <h3 style={styles.formTitulo}>🛒 Registrar Nueva Compra</h3>

                        {/* Proveedor */}
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Proveedor *</label>
                            <select
                                value={idProveedor}
                                onChange={(e) => setIdProveedor(e.target.value)}
                                style={styles.select}
                            >
                                <option value="">-- Selecciona un proveedor --</option>
                                {proveedores.map(p => (
                                    <option key={p.id_proveedor} value={p.id_proveedor}>
                                        {p.nombre_empresa}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Productos */}
                        <div style={styles.productosSeccion}>
                            <p style={styles.seccionTitulo}>📦 Productos comprados</p>

                            {items.map((item, i) => (
                                <div key={i} style={styles.itemRow}>
                                    {/* Producto */}
                                    <div style={{ flex: 2 }}>
                                        <label style={styles.labelSmall}>Producto</label>
                                        <select
                                            value={item.id_producto}
                                            onChange={(e) => handleItemChange(i, 'id_producto', e.target.value)}
                                            style={styles.select}
                                        >
                                            <option value="">-- Producto --</option>
                                            {productos.map(p => (
                                                <option key={p.id_producto} value={p.id_producto}>
                                                    {p.nombre}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Cantidad */}
                                    <div style={{ flex: 1 }}>
                                        <label style={styles.labelSmall}>Cantidad</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={item.cantidad}
                                            onChange={(e) => handleItemChange(i, 'cantidad', e.target.value)}
                                            style={styles.input}
                                        />
                                    </div>

                                    {/* Precio */}
                                    <div style={{ flex: 1 }}>
                                        <label style={styles.labelSmall}>Precio Unitario</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={item.precio_unitario}
                                            onChange={(e) => handleItemChange(i, 'precio_unitario', e.target.value)}
                                            style={styles.input}
                                            placeholder="$"
                                        />
                                    </div>

                                    {/* Subtotal */}
                                    <div style={{ flex: 1 }}>
                                        <label style={styles.labelSmall}>Subtotal</label>
                                        <div style={styles.subtotalBox}>
                                            ${((parseFloat(item.precio_unitario) || 0) * (parseInt(item.cantidad) || 0)).toLocaleString()}
                                        </div>
                                    </div>

                                    {/* Quitar */}
                                    <button
                                        onClick={() => quitarItem(i)}
                                        style={styles.botonQuitar}
                                        title="Quitar producto"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}

                            <button onClick={agregarItem} style={styles.botonAgregar}>
                                + Agregar otro producto
                            </button>
                        </div>

                        {/* Total */}
                        <div style={styles.totalBox}>
                            <span style={styles.totalLabel}>TOTAL DE LA COMPRA</span>
                            <span style={styles.totalValor}>
                                ${calcularTotal().toLocaleString()}
                            </span>
                        </div>

                        <div style={styles.formBotones}>
                            <button onClick={handleGuardar} style={styles.botonGuardar}>
                                💾 Registrar Compra
                            </button>
                            <button onClick={() => setMostrarForm(false)} style={styles.botonCancelar}>
                                Cancelar
                            </button>
                        </div>
                    </div>
                )}

                {/* Lista de compras */}
                {cargando ? (
                    <div style={styles.sinDatos}>Cargando compras...</div>
                ) : compras.length === 0 ? (
                    <div style={styles.sinDatos}>
                        <p style={{ fontSize: '40px', margin: 0 }}>🛒</p>
                        <p>No hay compras registradas</p>
                    </div>
                ) : (
                    <div style={styles.listaCompras}>
                        {compras.map((c) => {
                            const detalles = detallesExpandido[c.id_compra];
                            return (
                                <div key={c.id_compra} style={styles.compraCard}>

                                    {/* Fila principal */}
                                    <div style={styles.compraFila}>
                                        <div style={styles.compraIcono}>🛒</div>
                                        <div style={styles.compraInfo}>
                                            <p style={styles.compraId}>
                                                Compra #{c.id_compra}
                                            </p>
                                            <p style={styles.compraProveedor}>
                                                🏭 {getNombreProveedor(c.id_proveedor)}
                                            </p>
                                            <p style={styles.compraFecha}>
                                                📅 {c.fecha_compra
                                                    ? new Date(c.fecha_compra).toLocaleDateString('es-CO', {
                                                        day: '2-digit', month: 'short', year: 'numeric',
                                                        hour: '2-digit', minute: '2-digit'
                                                    })
                                                    : '—'}
                                            </p>
                                        </div>
                                        <div style={styles.compraTotal}>
                                            <span style={styles.compraTotalLabel}>Total</span>
                                            <span style={styles.compraTotalValor}>
                                                ${Number(c.total).toLocaleString()}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => handleVerDetalles(c.id_compra)}
                                            style={styles.botonDetalles}
                                        >
                                            {expandido === c.id_compra ? '▲ Ocultar' : '▼ Ver detalle'}
                                        </button>
                                    </div>

                                    {/* Detalles expandidos */}
                                    {expandido === c.id_compra && (
                                        <div style={styles.detallesContainer}>
                                            {!detalles ? (
                                                <p style={{ color: '#999', fontSize: '13px' }}>Cargando...</p>
                                            ) : (
                                                <table style={styles.tablaDetalles}>
                                                    <thead>
                                                        <tr style={styles.tablaHeader}>
                                                            <th style={styles.th}>Producto</th>
                                                            <th style={styles.th}>Cantidad</th>
                                                            <th style={styles.th}>Precio Unit.</th>
                                                            <th style={styles.th}>Subtotal</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {detalles.detalles?.map((d) => (
                                                            <tr key={d.id_detalle} style={styles.tablaFila}>
                                                                <td style={styles.td}>
                                                                    {getNombreProducto(d.id_producto)}
                                                                </td>
                                                                <td style={styles.td}>{d.cantidad} uds</td>
                                                                <td style={styles.td}>
                                                                    ${Number(d.precio_unitario).toLocaleString()}
                                                                </td>
                                                                <td style={styles.td}>
                                                                    ${Number(d.subtotal).toLocaleString()}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

            </div>
        </div>
    );
};

const styles = {
    layout: { display: 'flex', minHeight: '100vh', backgroundColor: '#f0f4f0' },
    contenido: { marginLeft: '250px', flex: 1, padding: '30px' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', paddingBottom: '20px', borderBottom: '1px solid #e0ede6' },
    titulo: { fontSize: '26px', color: '#2e7d52', fontWeight: 'bold', margin: 0 },
    subtitulo: { color: '#666', marginTop: '4px', fontSize: '14px' },
    botonNuevo: { backgroundColor: '#2e7d52', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' },
    error: { color: '#e53935', backgroundColor: '#fdecea', padding: '10px 15px', borderRadius: '8px', marginBottom: '15px', fontSize: '14px' },

    formulario: { backgroundColor: 'white', padding: '25px', borderRadius: '12px', marginBottom: '25px', boxShadow: '0 2px 15px rgba(0,0,0,0.06)' },
    formTitulo: { color: '#2e7d52', marginBottom: '20px', marginTop: 0 },
    inputGroup: { display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' },
    label: { fontSize: '13px', color: '#555', fontWeight: '600' },
    labelSmall: { fontSize: '12px', color: '#777', fontWeight: '600', display: 'block', marginBottom: '4px' },
    select: { padding: '10px 14px', border: '1.5px solid #e0ede6', borderRadius: '8px', fontSize: '14px', outline: 'none', backgroundColor: 'white', width: '100%' },
    input: { padding: '10px 14px', border: '1.5px solid #e0ede6', borderRadius: '8px', fontSize: '14px', outline: 'none', width: '100%', boxSizing: 'border-box' },

    productosSeccion: { backgroundColor: '#f8fffe', border: '1.5px solid #e0ede6', borderRadius: '10px', padding: '18px', marginBottom: '20px' },
    seccionTitulo: { fontSize: '14px', fontWeight: '700', color: '#2e7d52', marginBottom: '15px', marginTop: 0 },

    itemRow: { display: 'flex', gap: '12px', alignItems: 'flex-end', marginBottom: '12px', backgroundColor: 'white', padding: '12px', borderRadius: '8px', border: '1px solid #e0ede6' },
    subtotalBox: { padding: '10px 14px', backgroundColor: '#f0f4f0', borderRadius: '8px', fontSize: '14px', fontWeight: '600', color: '#2e7d52' },
    botonQuitar: { backgroundColor: '#fdecea', color: '#e53935', border: 'none', width: '32px', height: '32px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', flexShrink: 0, alignSelf: 'flex-end' },
    botonAgregar: { backgroundColor: 'transparent', color: '#2e7d52', border: '1.5px dashed #2e7d52', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', marginTop: '4px' },

    totalBox: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#e8f5ee', padding: '15px 20px', borderRadius: '10px', marginBottom: '20px' },
    totalLabel: { fontSize: '14px', fontWeight: '700', color: '#2e7d52' },
    totalValor: { fontSize: '22px', fontWeight: 'bold', color: '#2e7d52' },

    formBotones: { display: 'flex', gap: '10px' },
    botonGuardar: { backgroundColor: '#2e7d52', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
    botonCancelar: { backgroundColor: 'white', color: '#666', border: '1px solid #ddd', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' },

    listaCompras: { display: 'flex', flexDirection: 'column', gap: '12px' },
    compraCard: { backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', overflow: 'hidden' },
    compraFila: { display: 'flex', alignItems: 'center', gap: '16px', padding: '18px 20px' },
    compraIcono: { fontSize: '28px' },
    compraInfo: { flex: 1 },
    compraId: { fontSize: '15px', fontWeight: 'bold', color: '#2d2d2d', margin: '0 0 3px 0' },
    compraProveedor: { fontSize: '13px', color: '#555', margin: '0 0 3px 0' },
    compraFecha: { fontSize: '12px', color: '#999', margin: 0 },
    compraTotal: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end' },
    compraTotalLabel: { fontSize: '11px', color: '#999' },
    compraTotalValor: { fontSize: '18px', fontWeight: 'bold', color: '#2e7d52' },
    botonDetalles: { backgroundColor: '#f0f4f0', color: '#555', border: 'none', padding: '8px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', flexShrink: 0 },

    detallesContainer: { borderTop: '1px solid #f0f4f0', padding: '15px 20px', backgroundColor: '#fafffe' },
    tablaDetalles: { width: '100%', borderCollapse: 'collapse' },
    tablaHeader: { backgroundColor: '#f0f4f0' },
    th: { padding: '10px 14px', textAlign: 'left', fontSize: '12px', color: '#555', fontWeight: '600' },
    tablaFila: { borderTop: '1px solid #f0f4f0' },
    td: { padding: '10px 14px', fontSize: '13px', color: '#333' },

    sinDatos: { backgroundColor: 'white', borderRadius: '12px', padding: '50px', textAlign: 'center', color: '#999' },
};

export default Compras;