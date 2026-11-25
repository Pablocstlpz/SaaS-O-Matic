// Logger mínimo: es la única puerta a la consola. Si algún día se pasa a pino, solo cambia esto.
// Uso: logger.error("contexto", error) / logger.info("contexto", "texto").
type Nivel = "INFO" | "WARN" | "ERROR";

const linea = (nivel: Nivel, contexto: string, datos: unknown): unknown[] => [
  `[${nivel}][${contexto}]`,
  // De un Error interesa la pila, que ya empieza por el mensaje.
  datos instanceof Error ? (datos.stack ?? datos.message) : datos,
];

export const logger = {
  info: (contexto: string, datos: unknown) => console.info(...linea("INFO", contexto, datos)),
  warn: (contexto: string, datos: unknown) => console.warn(...linea("WARN", contexto, datos)),
  error: (contexto: string, datos: unknown) => console.error(...linea("ERROR", contexto, datos)),
};
