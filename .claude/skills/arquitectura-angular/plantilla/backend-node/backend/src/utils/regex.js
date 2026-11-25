//regex, enumerados y limites compartidos por modelos, validadores y controladores
//GEMELO de frontend/src/app/shared/regex.ts: si cambias algo aqui, cambialo alli,
//o el formulario aceptara datos que la API rechaza (o al reves)

export const REGEX_PASSWORD_FUERTE = /^(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/;

export const ROLES = ["admin", "usuario"];
export const ESTADOS_PRODUCTO = ["activo", "retirado"];

//los mismos numeros que el tamano de los campos del modelo
export const LIMITES = Object.freeze({
  EMAIL_MAX: 100,
  NOMBRE_MAX: 100,
  PASSWORD_MIN: 8,
  PRODUCTO_NOMBRE_MAX: 150,
  PRECIO_MAX: 1_000_000,
});
