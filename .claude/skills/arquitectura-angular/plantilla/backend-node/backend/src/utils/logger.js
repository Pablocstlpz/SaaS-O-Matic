//logger minimo con redaccion de campos sensibles: un log accidental nunca imprime una contrasena o un token
//si algun dia se pasa a pino o winston, solo cambia este fichero
//uso: logger.error("crearPedido", error) / logger.info("contexto", { datos })

const CAMPOS_SENSIBLES = new Set([
  "password",
  "password_hash",
  "accessToken",
  "refreshToken",
  "authorization",
  "token",
]);

const redactar = (valor) => {
  if (valor == null || typeof valor !== "object") return valor;
  if (Array.isArray(valor)) return valor.map(redactar);
  return Object.fromEntries(
    Object.entries(valor).map(([clave, v]) => [clave, CAMPOS_SENSIBLES.has(clave) ? "[REDACTADO]" : redactar(v)]),
  );
};

const linea = (nivel, contexto, datos) =>
  datos instanceof Error
    ? [`[${nivel}][${contexto}]`, datos.message, datos.stack]
    : [`[${nivel}][${contexto}]`, redactar(datos)];

export const logger = {
  info: (contexto, datos) => console.log(...linea("INFO", contexto, datos)),
  warn: (contexto, datos) => console.warn(...linea("WARN", contexto, datos)),
  error: (contexto, datos) => console.error(...linea("ERROR", contexto, datos)),
};
