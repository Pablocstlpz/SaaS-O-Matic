// Contrato con la API: los MISMOS nombres de campo que devuelve el backend, uno a uno.
// Si el backend cambia un campo, esta interfaz cambia en el mismo commit.
import { ROLES } from '../shared/regex';
import { Id } from './id';

// sale de ROLES (gemelo del backend): cambiar los roles es tocar shared/regex.ts, no buscar literales
export type Rol = (typeof ROLES)[number];

export interface Usuario {
  id: Id;
  organizacion_id: Id;
  nombre: string;
  email: string;
  rol: Rol;
  fecha_creacion: string;
  fecha_actualizacion: string;
}

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

// respuesta de POST /auth/login
export interface RespuestaLogin extends Tokens {
  usuario: Usuario;
}
