import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Productos from './pages/Productos';
import Clientes from './pages/Clientes';
import Proveedores from './pages/Proveedores';
import Compras from './pages/Compras';
import PlanesSepare from './pages/PlanesSepare';
import Pagos from './pages/Pagos';
import Ventas from './pages/Ventas';
import CambiosPage from './pages/Cambios';
import Reportes from './pages/Reportes';
import Usuarios from './pages/Usuarios';

// IMPORTACIÓN DEL NUEVO MÓDULO INDEPENDIENTE DE REPORTE DE COMPRAS
import ReporteCompraDetalle from './pages/ReporteCompraDetalle';

import ProtectedRoute from './components/ProtectedRoute';

function App() {

    return (
        <BrowserRouter>

            <Routes>

                {/* Redirección inicial */}
                <Route
                    path="/"
                    element={<Navigate to="/login" />}
                />

                {/* Login */}
                <Route
                    path="/login"
                    element={<Login />}
                />

                {/* DASHBOARD */}
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    }
                />

                {/* PRODUCTOS */}
                <Route
                    path="/productos"
                    element={
                        <ProtectedRoute>
                            <Productos />
                        </ProtectedRoute>
                    }
                />

                {/* CLIENTES */}
                <Route
                    path="/clientes"
                    element={
                        <ProtectedRoute>
                            <Clientes />
                        </ProtectedRoute>
                    }
                />

                {/* VENTAS */}
                <Route
                    path="/ventas"
                    element={
                        <ProtectedRoute>
                            <Ventas />
                        </ProtectedRoute>
                    }
                />

                {/* PLANES SEPARE */}
                <Route
                    path="/planes-separe"
                    element={
                        <ProtectedRoute>
                            <PlanesSepare />
                        </ProtectedRoute>
                    }
                />
                {/* REPORTES GENERALES */}
                <Route
                    path="/reportes"
                    element={
                        <ProtectedRoute>
                            <Reportes />
                        </ProtectedRoute>
                    }
                />

                {/* PAGOS */}
                <Route
                    path="/pagos"
                    element={
                        <ProtectedRoute>
                            <Pagos />
                        </ProtectedRoute>
                    }
                />

                {/* ========================= */}
                {/* SOLO ADMINISTRADOR */}
                {/* ========================= */}

                {/* USUARIOS */}
                <Route
                    path="/usuarios"
                    element={
                        <ProtectedRoute adminOnly={true}>
                            <Usuarios />
                        </ProtectedRoute>
                    }
                />

                {/* PROVEEDORES */}
                <Route
                    path="/proveedores"
                    element={
                        <ProtectedRoute adminOnly={true}>
                            <Proveedores />
                        </ProtectedRoute>
                    }
                />

                {/* COMPRAS */}
                <Route
                    path="/compras"
                    element={
                        <ProtectedRoute adminOnly={true}>
                            <Compras />
                        </ProtectedRoute>
                    }
                />

                {/* REPORTE DE COMPRAS INDEPENDIENTE (UNIFICADO) */}
                {/* 1. Ruta para cuando haces clic en el Menú Lateral (Carga la Lista) */}
                <Route
                    path="/reporte-compras-lista"
                    element={
                        <ProtectedRoute adminOnly={true}>
                            <ReporteCompraDetalle />
                        </ProtectedRoute>
                    }
                />

                {/* 2. Ruta para cuando ves una factura específica con su ID */}
                <Route
                    path="/reporte-compra/:id_compra"
                    element={
                        <ProtectedRoute adminOnly={true}>
                            <ReporteCompraDetalle />
                        </ProtectedRoute>
                    }
                />

                {/* CAMBIOS */}
                <Route
                    path="/Cambios"
                    element={
                        <ProtectedRoute>
                            <CambiosPage />
                        </ProtectedRoute>
                    }
                />

            </Routes>

        </BrowserRouter>
    );
}

export default App;