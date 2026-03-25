import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api/usuarios';

const Login = () => {
    const [correo, setCorreo] = useState('');
    const [contrasena, setContrasena] = useState('');
    const [error, setError] = useState('');
    const [cargando, setCargando] = useState(false);
    const navigate = useNavigate();

const handleLogin = async (e) => {
    e.preventDefault();
    setCargando(true);
    setError('');

    try {
        const data = await login(correo, contrasena);
        localStorage.setItem('usuarios', JSON.stringify(data));
        navigate('/dashboard');
    } catch (err) {
        console.log("Error login:", err);

        if (err.response) {
            // Error del backend
            setError(err.response.data?.message || 'Credenciales incorrectas');
        } else if (err.request) {
            // No hubo respuesta del servidor
            setError('Servidor no responde');
        } else {
            // Otro error
            setError('Error inesperado');
        }
    } finally {
        setCargando(false);
    }
};

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h1 style={styles.titulo}>Plan Separe</h1>
                <h2 style={styles.subtitulo}>Iniciar Sesión</h2>
                <form onSubmit={handleLogin} style={styles.form}>
                    <div style={styles.campo}>
                        <label style={styles.label}>Correo</label>
                        <input
                            type="email"
                            value={correo}
                            onChange={(e) => setCorreo(e.target.value)}
                            style={styles.input}
                            placeholder="correo@ejemplo.com"
                            required
                        />
                    </div>
                    <div style={styles.campo}>
                        <label style={styles.label}>Contraseña</label>
                        <input
                            type="password"
                            value={contrasena}
                            onChange={(e) => setContrasena(e.target.value)}
                            style={styles.input}
                            placeholder="••••••••"
                            required
                        />
                    </div>
                    {error && <p style={styles.error}>{error}</p>}
                    <button
                        type="submit"
                        style={styles.boton}
                        disabled={cargando}
                    >
                        {cargando ? 'Ingresando...' : 'Ingresar'}
                    </button>
                </form>
            </div>
        </div>
    );
};

const styles = {
    container: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#1a1a2e',
    },
    card: {
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '10px',
        width: '100%',
        maxWidth: '400px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
    },
    titulo: {
        textAlign: 'center',
        color: '#e94560',
        marginBottom: '5px',
    },
    subtitulo: {
        textAlign: 'center',
        color: '#1a1a2e',
        marginBottom: '25px',
        fontSize: '18px',
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '15px',
    },
    campo: {
        display: 'flex',
        flexDirection: 'column',
        gap: '5px',
    },
    label: {
        fontSize: '14px',
        color: '#333',
        fontWeight: 'bold',
    },
    input: {
        padding: '10px',
        borderRadius: '5px',
        border: '1px solid #ddd',
        fontSize: '14px',
    },
    error: {
        color: '#e94560',
        fontSize: '14px',
        textAlign: 'center',
    },
    boton: {
        backgroundColor: '#e94560',
        color: 'white',
        border: 'none',
        padding: '12px',
        borderRadius: '5px',
        fontSize: '16px',
        cursor: 'pointer',
        marginTop: '10px',
    },
};

export default Login;