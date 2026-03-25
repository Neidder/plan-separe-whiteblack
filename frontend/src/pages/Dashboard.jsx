import Sidebar from '../components/Sidebar';


const Dashboard = () => {
    const usuario = JSON.parse(localStorage.getItem('usuario'));
    

    const cards = [
        { icon: '📦', titulo: 'Productos', desc: 'Gestiona tu inventario', path: '/productos' },
        { icon: '👥', titulo: 'Clientes', desc: 'Administra tus clientes', path: '/clientes' },
        { icon: '🏭', titulo: 'Proveedores', desc: 'Gestiona proveedores', path: '/proveedores' },
        { icon: '🛒', titulo: 'Compras', desc: 'Registro de compras', path: '/compras' },
        { icon: '📋', titulo: 'Planes Separe', desc: 'Gestiona planes separe', path: '/planes-separe' },
        { icon: '💰', titulo: 'Pagos', desc: 'Registro de pagos', path: '/pagos' },
    ];

    return (
        <div style={styles.layout}>
            <Sidebar />
            <div style={styles.contenido}>
                <div style={styles.header}>
                    <h1 style={styles.titulo}>Dashboard</h1>
                    <p style={styles.subtitulo}>Bienvenido de nuevo, <strong>{usuario?.nombre}</strong> 👋</p>
                </div>
                <div style={styles.grid}>
                    {cards.map((card) => (
                        <div key={card.titulo} style={styles.card}>
                            <span style={styles.cardIcon}>{card.icon}</span>
                            <h3 style={styles.cardTitulo}>{card.titulo}</h3>
                            <p style={styles.cardDesc}>{card.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const styles = {
    layout: {
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: '#f0f4f0',
    },
    contenido: {
        marginLeft: '250px',
        flex: 1,
        padding: '30px',
    },
    header: {
        marginBottom: '30px',
        paddingBottom: '20px',
        borderBottom: '1px solid #e0ede6',
    },
    titulo: {
        fontSize: '28px',
        color: '#2e7d52',
        fontWeight: 'bold',
    },
    subtitulo: {
        color: '#666',
        marginTop: '5px',
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '20px',
    },
    card: {
        backgroundColor: '#ffffff',
        padding: '25px',
        borderRadius: '12px',
        boxShadow: '0 2px 15px rgba(0,0,0,0.06)',
        borderLeft: '4px solid #2e7d52',
        cursor: 'pointer',
    },
    cardIcon: {
        fontSize: '32px',
        display: 'block',
        marginBottom: '12px',
    },
    cardTitulo: {
        color: '#2d2d2d',
        fontSize: '16px',
        marginBottom: '6px',
    },
    cardDesc: {
        color: '#888',
        fontSize: '13px',
    },
};

export default Dashboard;