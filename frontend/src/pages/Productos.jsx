import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { getProductos, crearProducto, actualizarProducto, eliminarProducto } from '../api/productos';

const Productos = () => {
    const [productos, setProductos] = useState([]);
    const [mostrarForm, setMostrarForm] = useState(false);
    const [productoEditando, setProductoEditando] = useState(null);
    const [error, setError] = useState('');
    const [form, setForm] = useState({
        nombre: '',
        descripcion: '',
        precio_venta: '',
        costo_promedio: '',
        stock: '',
    });

    useEffect(() => {
        cargarProductos();
    }, []);

    const cargarProductos = async () => {
        try {
            const data = await getProductos();
            setProductos(data);
        } catch {
            setError('No se pudieron cargar los productos');
        }
    };

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleNuevo = () => {
        setProductoEditando(null);
        setForm({ nombre: '', descripcion: '', precio_venta: '', costo_promedio: '', stock: '' });
        setMostrarForm(true);
        setError('');
    };

    const handleEditar = (producto) => {
        setProductoEditando(producto);
        setForm({
            nombre: producto.nombre,
            descripcion: producto.descripcion,
            precio_venta: producto.precio_venta,
            costo_promedio: producto.costo_promedio,
            stock: producto.stock,
        });
        setMostrarForm(true);
        setError('');
    };

    const handleGuardar = async () => {
        if (!form.nombre || !form.precio_venta || !form.stock) {
            setError('Nombre, precio y stock son obligatorios');
            return;
        }
        try {
            if (productoEditando) {
                await actualizarProducto(productoEditando.id_producto, form);
            } else {
                await crearProducto(form);
            }
            setMostrarForm(false);
            cargarProductos();
        } catch {
            setError('Error al guardar el producto');
        }
    };

    const handleEliminar = async (id) => {
        if (!confirm('¿Seguro que quieres eliminar este producto?')) return;
        try {
            await eliminarProducto(id);
            cargarProductos();
        } catch {
            setError('Error al eliminar el producto');
        }
    };

    return (
        <div style={styles.layout}>
            <Sidebar />
            <div style={styles.contenido}>

                <div style={styles.header}>
                    <div>
                        <h1 style={styles.titulo}>📦 Productos</h1>
                        <p style={styles.subtitulo}>Gestiona tu inventario</p>
                    </div>
                    <button onClick={handleNuevo} style={styles.botonNuevo}>
                        + Nuevo Producto
                    </button>
                </div>

                {error && <p style={styles.error}>{error}</p>}

                {mostrarForm && (
                    <div style={styles.formulario}>
                        <h3 style={styles.formTitulo}>
                            {productoEditando ? '✏️ Editar Producto' : '➕ Nuevo Producto'}
                        </h3>
                        <div style={styles.formGrid}>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Nombre *</label>
                                <input
                                    name="nombre"
                                    placeholder="Ej: Pantalón Levis"
                                    value={form.nombre}
                                    onChange={handleChange}
                                    style={styles.input}
                                />
                            </div>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Stock *</label>
                                <input
                                    name="stock"
                                    placeholder="Ej: 10"
                                    type="number"
                                    value={form.stock}
                                    onChange={handleChange}
                                    style={styles.input}
                                />
                            </div>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Precio de Venta *</label>
                                <input
                                    name="precio_venta"
                                    placeholder="Ej: 50000"
                                    type="number"
                                    value={form.precio_venta}
                                    onChange={handleChange}
                                    style={styles.input}
                                />
                            </div>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Costo Promedio</label>
                                <input
                                    name="costo_promedio"
                                    placeholder="Ej: 30000"
                                    type="number"
                                    value={form.costo_promedio}
                                    onChange={handleChange}
                                    style={styles.input}
                                />
                            </div>
                            <div style={{ ...styles.inputGroup, gridColumn: '1 / -1' }}>
                                <label style={styles.label}>Descripción</label>
                                <input
                                    name="descripcion"
                                    placeholder="Ej: Tipo polo, talla M"
                                    value={form.descripcion}
                                    onChange={handleChange}
                                    style={styles.input}
                                />
                            </div>
                        </div>
                        <div style={styles.formBotones}>
                            <button onClick={handleGuardar} style={styles.botonGuardar}>
                                💾 Guardar
                            </button>
                            <button onClick={() => setMostrarForm(false)} style={styles.botonCancelar}>
                                Cancelar
                            </button>
                        </div>
                    </div>
                )}

                <div style={styles.tablaContainer}>
                    <table style={styles.tabla}>
                        <thead>
                            <tr style={styles.tablaHeader}>
                                <th style={styles.th}>#</th>
                                <th style={styles.th}>Nombre</th>
                                <th style={styles.th}>Descripción</th>
                                <th style={styles.th}>Precio Venta</th>
                                <th style={styles.th}>Costo Prom.</th>
                                <th style={styles.th}>Stock</th>
                                <th style={styles.th}>Estado</th>
                                <th style={styles.th}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {productos.length === 0 ? (
                                <tr>
                                    <td colSpan="8" style={styles.sinDatos}>
                                        No hay productos registrados
                                    </td>
                                </tr>
                            ) : (
                                productos.map((p) => (
                                    <tr key={p.id_producto} style={styles.fila}>
                                        <td style={styles.td}>{p.id_producto}</td>
                                        <td style={styles.td}><strong>{p.nombre}</strong></td>
                                        <td style={styles.td}>{p.descripcion || '—'}</td>
                                        <td style={styles.td}>${Number(p.precio_venta).toLocaleString()}</td>
                                        <td style={styles.td}>${Number(p.costo_promedio).toLocaleString()}</td>
                                        <td style={styles.td}>
                                            <span style={{
                                                ...styles.badge,
                                                backgroundColor: p.stock > 5 ? '#e8f5ee' : '#fff3e0',
                                                color: p.stock > 5 ? '#2e7d52' : '#e65100',
                                            }}>
                                                {p.stock} uds
                                            </span>
                                        </td>
                                        <td style={styles.td}>
                                            <span style={{
                                                ...styles.badge,
                                                backgroundColor: p.activo ? '#e8f5ee' : '#fdecea',
                                                color: p.activo ? '#2e7d52' : '#e53935',
                                            }}>
                                                {p.activo ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </td>
                                        <td style={styles.td}>
                                            <button onClick={() => handleEditar(p)} style={styles.botonEditar}>
                                                ✏️ Editar
                                            </button>
                                            <button onClick={() => handleEliminar(p.id_producto)} style={styles.botonEliminar}>
                                                🗑️ Eliminar
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

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
    formTitulo: { color: '#2e7d52', marginBottom: '20px', marginTop: 0, fontSize: '16px' },
    formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' },
    inputGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
    label: { fontSize: '13px', color: '#555', fontWeight: '600' },
    input: { padding: '10px 14px', border: '1.5px solid #e0ede6', borderRadius: '8px', fontSize: '14px', outline: 'none' },
    formBotones: { display: 'flex', gap: '10px' },
    botonGuardar: { backgroundColor: '#2e7d52', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' },
    botonCancelar: { backgroundColor: 'white', color: '#666', border: '1px solid #ddd', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' },
    tablaContainer: { backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 15px rgba(0,0,0,0.06)', overflow: 'hidden' },
    tabla: { width: '100%', borderCollapse: 'collapse' },
    tablaHeader: { backgroundColor: '#f0f4f0' },
    th: { padding: '14px 16px', textAlign: 'left', fontSize: '13px', color: '#555', fontWeight: '600' },
    fila: { borderTop: '1px solid #f0f4f0' },
    td: { padding: '14px 16px', fontSize: '14px', color: '#333' },
    sinDatos: { padding: '40px', textAlign: 'center', color: '#999', fontSize: '15px' },
    badge: { padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' },
    botonEditar: { backgroundColor: '#e8f5ee', color: '#2e7d52', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', marginRight: '8px', fontSize: '13px' },
    botonEliminar: { backgroundColor: '#fdecea', color: '#e53935', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' },
};

export default Productos;
