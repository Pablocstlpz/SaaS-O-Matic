// Lo común de las pruebas de API: levantar la app real en un puerto libre y hacer peticiones.
// La BD en memoria la fija vitest.config.ts. Cada fichero de pruebas corre aislado.
import { once } from "node:events";
import type { Server } from "node:http";

import { app } from "../src/app.js";
import { sequelize } from "../src/data/db.js";

let servidor: Server;
let base = "";

export const levantarApi = async () => {
  await sequelize.sync();
  servidor = app.listen(0);
  await once(servidor, "listening");
  const direccion = servidor.address();
  if (!direccion || typeof direccion === "string") throw new Error("La API no tiene puerto");
  base = `http://localhost:${direccion.port}`;
};

export const cerrarApi = async () => {
  servidor.close();
  await sequelize.close();
};

interface Opciones {
  cuerpo?: unknown;
  // El cuerpo se envía tal cual, para probar lo que no es JSON.
  crudo?: string;
  cabeceras?: Record<string, string>;
}

export const peticion = async (metodo: string, ruta: string, opciones: Opciones = {}) => {
  const { cuerpo, crudo, cabeceras } = opciones;
  const respuesta = await fetch(base + ruta, {
    method: metodo,
    headers: { "Content-Type": "application/json", ...cabeceras },
    body: crudo ?? (cuerpo === undefined ? undefined : JSON.stringify(cuerpo)),
  });
  const texto = await respuesta.text();
  const datos: unknown = texto ? JSON.parse(texto) : null;
  return { status: respuesta.status, cuerpo: datos, cabeceras: respuesta.headers };
};
