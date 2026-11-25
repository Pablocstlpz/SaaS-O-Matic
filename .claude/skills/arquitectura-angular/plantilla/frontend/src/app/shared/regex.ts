// GEMELO del fichero de limites del backend: backend/src/utils/regex.js (Node),
// backend/Api/Utils/Limites.cs (.NET) o backend/app/utils/limites.py (Python). Mismos valores en los dos lados.
// El formulario valida lo mismo que la API para avisar antes de enviar; la API sigue siendo la barrera.

export const REGEX_PASSWORD_FUERTE = /^(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/;

export const ROLES = ['admin', 'usuario'] as const;
export const ESTADOS_PRODUCTO = ['activo', 'retirado'] as const;

export const LIMITES = Object.freeze({
  EMAIL_MAX: 100,
  NOMBRE_MAX: 100,
  PASSWORD_MIN: 8,
  PRODUCTO_NOMBRE_MAX: 150,
  PRECIO_MAX: 1_000_000,
});
