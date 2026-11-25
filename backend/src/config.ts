// ÚNICO fichero que lee process.env. El resto del backend importa de aquí.
// Todo tiene valor por defecto: la app arranca en local sin configurar nada.
import { fileURLToPath } from "node:url";

const env = process.env;

const puertoTexto = env.PORT || "3000";
export const PORT = Number(puertoTexto);

// El navegador manda el Origin sin barra final: se la quito para que coincidan.
export const FRONTEND_URL = (env.FRONTEND_URL || "http://localhost:4200").replace(/\/+$/, "");

// Ruta del fichero SQLite o ":memory:". Se resuelve desde aquí, no desde donde se lance npm.
export const DB_ALMACEN =
  env.DB_ALMACEN || fileURLToPath(new URL("../datos.sqlite", import.meta.url));

// Devuelve los fallos de configuración; server.ts los escribe y no arranca.
export const validarConfig = (): string[] => {
  const errores: string[] = [];
  if (!/^\d+$/.test(puertoTexto) || PORT < 1 || PORT > 65535) {
    errores.push(`PORT tiene que ser un número entero entre 1 y 65535, y es "${puertoTexto}"`);
  }
  return errores;
};
