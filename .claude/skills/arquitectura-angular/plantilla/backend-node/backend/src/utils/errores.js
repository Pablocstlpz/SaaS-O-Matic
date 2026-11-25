//error esperado de la API: lo lanza un controlador o un servicio y el manejador global de app.js
//lo convierte en { message, tipo? } con su codigo. Todo lo que NO sea ErrorHttp sale como 500 generico
//
//tipo: codigo estable para que el frontend REACCIONE (redirigir, no cerrar sesion...)
//message: texto que se puede ensenar tal cual al usuario
export class ErrorHttp extends Error {
  constructor(status, message, tipo) {
    super(message);
    this.status = status;
    this.tipo = tipo;
  }
}

//atajos para los casos que se repiten en todos los controladores
export const noEncontrado = (message = "Recurso no encontrado") => new ErrorHttp(404, message);
export const conflicto = (message, tipo) => new ErrorHttp(409, message, tipo);
export const prohibido = (message = "No tienes permiso para hacer esto", tipo) =>
  new ErrorHttp(403, message, tipo);
