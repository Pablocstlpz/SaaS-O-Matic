// Lo común a toda la API: salud, forma de los errores, límite del cuerpo y CORS.
import express from "express";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { logger } from "../src/utils/logger.js";
import { cerrarApi, levantarApi, peticion } from "./_api.js";

beforeAll(levantarApi);
afterAll(cerrarApi);

// Hace que la ruta real GET /salud falle con el error indicado.
const romperSalud = (error: Error) =>
  vi.spyOn(express.response, "status").mockImplementationOnce(() => {
    throw error;
  });

describe("salud y errores", () => {
  it("GET /salud responde ok", async () => {
    const { status, cuerpo } = await peticion("GET", "/salud");
    expect(status).toBe(200);
    expect(cuerpo).toEqual({ estado: "ok" });
  });

  it("una ruta desconocida es 404 NO_ENCONTRADO", async () => {
    const { status, cuerpo } = await peticion("GET", "/no-existe");
    expect(status).toBe(404);
    expect(cuerpo).toEqual({ message: "Ruta no encontrada", tipo: "NO_ENCONTRADO", errors: [] });
  });

  it("un JSON mal formado es 400 VALIDACION", async () => {
    const { status, cuerpo } = await peticion("POST", "/no-existe", { crudo: '{"nombre":' });
    expect(status).toBe(400);
    expect(cuerpo).toEqual({
      message: "El cuerpo de la petición no es un JSON válido",
      tipo: "VALIDACION",
      errors: [],
    });
  });

  it("un cuerpo de más de 100 KB es 413 DEMASIADO_GRANDE", async () => {
    const cuerpo = { texto: "a".repeat(100 * 1024) };
    const respuesta = await peticion("POST", "/no-existe", { cuerpo });
    expect(respuesta.status).toBe(413);
    expect(respuesta.cuerpo).toEqual({
      message: "La petición es demasiado grande",
      tipo: "DEMASIADO_GRANDE",
      errors: [],
    });
  });
});

describe("cuerpo que no se puede leer", () => {
  it.each([
    ["un juego de caracteres", { "Content-Type": "application/json; charset=latin1" }],
    ["una compresión", { "Content-Encoding": "zzz" }],
  ])("%s sin admitir es 400 VALIDACION", async (_caso, cabeceras: Record<string, string>) => {
    const { status, cuerpo } = await peticion("POST", "/no-existe", { crudo: "{}", cabeceras });
    expect(status).toBe(400);
    expect(cuerpo).toEqual({
      message: "No se puede leer el cuerpo de la petición",
      tipo: "VALIDACION",
      errors: [],
    });
  });
});

describe("peticiones corruptas", () => {
  const ilegible = (parte: string) => ({
    message: `No se puede leer ${parte} de la petición`,
    tipo: "VALIDACION",
    errors: [],
  });

  it("un cuerpo comprimido y corrupto es 400 VALIDACION", async () => {
    const cabeceras = { "Content-Encoding": "gzip" };
    const opciones = { crudo: "no soy gzip", cabeceras };
    const { status, cuerpo } = await peticion("POST", "/no-existe", opciones);
    expect(status).toBe(400);
    expect(cuerpo).toEqual(ilegible("el cuerpo"));
  });

  it("una dirección mal codificada es 400 VALIDACION", async () => {
    const { status, cuerpo } = await peticion("GET", "/customers/%E0%A4%A");
    expect(status).toBe(400);
    expect(cuerpo).toEqual(ilegible("la dirección"));
  });
});

describe("errores del servidor", () => {
  it("un índice único que salta es 409 DUPLICADO", async () => {
    const error = new Error("UNIQUE constraint failed: clientes.identificador_fiscal");
    error.name = "SequelizeUniqueConstraintError";
    romperSalud(error);
    const { status, cuerpo } = await peticion("GET", "/salud");
    expect(status).toBe(409);
    expect(cuerpo).toEqual({
      message: "Ya existe un registro con esos datos",
      tipo: "DUPLICADO",
      errors: [],
    });
  });

  it("un error inesperado es 500 sin detalles, y el detalle va al log", async () => {
    const error = new Error("contraseña de la BD en /ruta/secreta");
    const log = vi.spyOn(logger, "error").mockImplementation(() => {});
    romperSalud(error);
    const { status, cuerpo } = await peticion("GET", "/salud");
    expect(status).toBe(500);
    // toEqual: ni la pila ni el mensaje interno pueden colarse en otra clave.
    expect(cuerpo).toEqual({
      message: "Error interno del servidor",
      tipo: "ERROR_INTERNO",
      errors: [],
    });
    expect(log).toHaveBeenCalledWith("GET /salud", error);
  });
});

describe("CORS", () => {
  const AJENO = "http://malo.example";
  const FRONTEND = "http://localhost:4200";

  it.each(["GET", "OPTIONS"])("un origen no permitido es 403 CORS (%s)", async (metodo) => {
    const respuesta = await peticion(metodo, "/salud", { cabeceras: { Origin: AJENO } });
    expect(respuesta.status).toBe(403);
    expect(respuesta.cuerpo).toEqual({ message: "Origen no permitido", tipo: "CORS", errors: [] });
    expect(respuesta.cabeceras.get("access-control-allow-origin")).toBeNull();
  });

  it("el origen del frontend lleva su cabecera CORS", async () => {
    const respuesta = await peticion("GET", "/salud", { cabeceras: { Origin: FRONTEND } });
    expect(respuesta.status).toBe(200);
    expect(respuesta.cabeceras.get("access-control-allow-origin")).toBe(FRONTEND);
  });

  it("la comprobación previa del frontend se acepta", async () => {
    const respuesta = await peticion("OPTIONS", "/salud", {
      cabeceras: { Origin: FRONTEND, "Access-Control-Request-Method": "POST" },
    });
    expect(respuesta.status).toBe(204);
    expect(respuesta.cabeceras.get("access-control-allow-origin")).toBe(FRONTEND);
  });
});
