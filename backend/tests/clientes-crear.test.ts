// Spec §4 «POST /customers», con los casos de §7 «API» (duplicado y país fuera de la lista).
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { Cliente } from "../src/models/cliente.model.js";
import { logger } from "../src/utils/logger.js";
import { cerrarApi, levantarApi, peticion } from "./_api.js";

beforeAll(levantarApi);
afterAll(cerrarApi);
beforeEach(async () => {
  await Cliente.destroy({ where: {} });
});

const VALIDO = {
  nombre_empresa: "Acme Ibérica",
  identificador_fiscal: "A58818501",
  email_contacto: "compras@acme.example",
  pais: "ES",
  plan: "pro",
};

const crear = (cambios: Record<string, unknown> = {}) =>
  peticion("POST", "/customers", { cuerpo: { ...VALIDO, ...cambios } });

const filas = () => Cliente.findAll({ raw: true });

const NOMBRE_MAL = "El nombre de empresa debe ser un texto de 2 a 120 caracteres";
const IDENTIFICADOR_MAL = "El identificador fiscal debe ser válido para el país elegido";
const EMAIL_MAL = "El email de contacto debe ser una dirección válida de 254 caracteres como máximo";
const PAIS_MAL = "El país debe ser uno de: ES, FR, GB, IT, DE";
const PLAN_MAL = "El plan debe ser uno de: free, pro, max";
const REPETIDO = "Ya existe un cliente con ese identificador fiscal";

// 255 caracteres, con la parte local y cada trozo del dominio de tamaño corriente.
const EMAIL_255 = `${"a".repeat(64)}@${"b".repeat(63)}.${"c".repeat(63)}.${"d".repeat(58)}.com`;

// El error completo de un único campo: el mensaje general es el suyo.
const errorDeCampo = (campo: string, mensaje: string, tipo = "VALIDACION") => ({
  message: mensaje,
  tipo,
  errors: [{ campo, mensaje }],
});

describe("POST /customers: alta", () => {
  it("201 con los datos normalizados, y así quedan en la BD", async () => {
    const esperado = { ...VALIDO, id: expect.any(Number), fecha_creacion: expect.anything() };

    const { status, cuerpo } = await crear({
      nombre_empresa: "  Acme   Ibérica  ",
      identificador_fiscal: "a-58.818.501",
      email_contacto: "  Compras@ACME.example  ",
    });

    expect(status).toBe(201);
    expect(cuerpo).toEqual(esperado);
    expect(await filas()).toEqual([esperado]);
  });

  it("los campos de más (id, fecha_creacion) se ignoran", async () => {
    const ajena = "2000-01-01T00:00:00.000Z";

    const { status, cuerpo } = await crear({ id: 999, fecha_creacion: ajena });

    expect(status).toBe(201);
    expect(cuerpo).not.toMatchObject({ id: 999 });
    expect(cuerpo).not.toMatchObject({ fecha_creacion: ajena });
    const [fila] = await filas();
    expect(fila.id).not.toBe(999);
    expect(new Date(fila.fecha_creacion).toISOString()).not.toBe(ajena);
  });
});

describe("POST /customers: campos mal", () => {
  it.each([
    ["un identificador fiscal falso", "identificador_fiscal", "12345678A", IDENTIFICADOR_MAL],
    ["un país fuera de la lista", "pais", "PT", PAIS_MAL],
    ["un plan desconocido", "plan", "gold", PLAN_MAL],
    ["un nombre de 1 carácter", "nombre_empresa", "A", NOMBRE_MAL],
    ["un nombre de 121 caracteres", "nombre_empresa", "a".repeat(121), NOMBRE_MAL],
    ["un email de 255 caracteres", "email_contacto", EMAIL_255, EMAIL_MAL],
    ["un email con espacios dentro", "email_contacto", "com pras@acme.example", EMAIL_MAL],
    ["un email con espacios entre comillas", "email_contacto", '"com pras"@acme.example', EMAIL_MAL],
  ])("%s → 400 en %s", async (_caso, campo, valor, mensaje) => {
    const { status, cuerpo } = await crear({ [campo]: valor });

    expect(status).toBe(400);
    expect(cuerpo).toEqual(errorDeCampo(campo, mensaje));
    expect(await filas()).toEqual([]);
  });

  it("con un país fuera de la lista, el error sale solo en pais", async () => {
    // 3 caracteres: tampoco valdría como identificador de fuera de España.
    const { status, cuerpo } = await crear({ pais: "PT", identificador_fiscal: "123" });

    expect(status).toBe(400);
    expect(cuerpo).toEqual(errorDeCampo("pais", PAIS_MAL));
  });
});

describe("POST /customers: identificador repetido y fallos", () => {
  it("un cliente duplicado → 409 IDENTIFICADOR_REPETIDO", async () => {
    await crear();

    const { status, cuerpo } = await crear();

    expect(status).toBe(409);
    expect(cuerpo).toEqual(
      errorDeCampo("identificador_fiscal", REPETIDO, "IDENTIFICADOR_REPETIDO"),
    );
    expect(await filas()).toHaveLength(1);
  });

  it("una carrera frenada por el índice único → 409 DUPLICADO", async () => {
    await crear();
    // La comprobación previa no ve al primero, como si las dos altas llegaran a la vez.
    vi.spyOn(Cliente, "findOne").mockResolvedValueOnce(null);

    const { status, cuerpo } = await crear();

    expect(status).toBe(409);
    expect(cuerpo).toEqual({
      message: "Ya existe un registro con esos datos",
      tipo: "DUPLICADO",
      errors: [],
    });
    expect(await filas()).toHaveLength(1);
  });

  it("un error inesperado del modelo → 500 sin detalles", async () => {
    vi.spyOn(logger, "error").mockImplementation(() => {});
    vi.spyOn(Cliente, "create").mockRejectedValueOnce(new Error("tabla clientes en /ruta/secreta"));

    const { status, cuerpo } = await crear();

    expect(status).toBe(500);
    expect(cuerpo).toEqual({
      message: "Error interno del servidor",
      tipo: "ERROR_INTERNO",
      errors: [],
    });
  });
});
