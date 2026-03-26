export interface User {
  id_usuario: number;
  nombre: string;
  apellido: string;
  correo: string;
  id_rol: number;
}

export interface LoginCredentials {
  correo: string;
  contrasena: string;
}

export interface LoginResponse {
  mensaje: string;
  id_usuario: number;
  nombre: string;
  apellido: string;
  correo: string;
  id_rol: number;
}

export interface ApiError {
  error: string;
}
