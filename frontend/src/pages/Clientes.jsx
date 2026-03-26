import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { getClientes, crearCliente, actualizarCliente, eliminarCliente  } from '../api/clientes';

const Clientes = () => {
    const [clientes, setClientes] = useState([]);
    const [formData, setFormData] = useState({ nombre: '', email: '' });
    const [editingId, setEditingId] = useState(null);
    

    useEffect(() => {      
    fetchClientes();
    }, []);

    const fetchClientes = async () => {
        const data = await getClientes();
        setClientes(data);
    };