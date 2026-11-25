// Spec §4 «POST /simulations», con los casos de §7 «Impuesto» (DE) y «API» (cliente que no existe).
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { Cliente } from "../src/models/cliente.model.js";
import { Simulacion } from "../src/models/simulacion.model.js";
import { cerrarApi, levantarApi, peticion } from "./_api.js";

let clienteId = 0;

beforeAll(levantarApi);
afterAll(cerrarApi);
beforeEach(async () => {
  // Primero las simulaciones: la clave ajena impide borrar un cliente que las tiene.
  await Simulacion.destroy({ where: {} });
  await Cliente.destroy({ where: {} });
  const cliente = await Cliente.create({
    nombre_empresa: "Muster",
    identificador_fiscal: "DE123456789",
    email_contacto: "einkauf@muster.example",
    pais: "DE",
    plan: "pro",
  });
  clienteId = cliente.id;
});

const crear = (cambios: Record<string, unknown> = {}) => {
  const valido = { cliente_id: clienteId, usuarios: 51, almacenamiento_gb: 20, llamadas_api: 3000 };
  return peticion("POST", "/simulations", { cuerpo: { ...valido, ...cambios } });
};

const filas = () => Simulacion.findAll({ raw: true });

// Lo que sale de 51 usuarios para un cliente alemán (spec §7 «Impuesto»).
const IMPORTES_DE = {
  coste_base_centimos: 42500,
  porcentaje_impuesto: 19,
  impuesto_centimos: 8075,
  total_centimos: 50575,
};

const ALMACENAMIENTO_MAL = "El almacenamiento debe ser un número entero de GB entre 0 y 1.000.000";
const LLAMADAS_MAL = "Las llamadas a la API deben ser un número entero entre 0 y 1.000.000.000";

// El 400 completo: el mensaje general es el del único campo que falla.
const errorDeCampo = (campo: string, mensaje: string, tipo = "VALIDACION") => ({
  message: mensaje,
  tipo,
  errors: [{ campo, mensaje }],
});

describe("POST /simulations", () => {
  it("cliente DE y 51 usuarios → 201 con sus importes, guardados en la BD", async () => {
    const esperado = {
      ...IMPORTES_DE,
      id: expect.any(Number),
      cliente_id: clienteId,
      usuarios: 51,
      almacenamiento_gb: 20,
      llamadas_api: 3000,
      fecha_creacion: expect.anything(),
    };

    const { status, cuerpo } = await crear();

    expect(status).toBe(201);
    expect(cuerpo).toEqual(esperado);
    expect(await filas()).toEqual([esperado]);
  });

  it("un cliente que no existe → 400 REFERENCIA_INVALIDA en cliente_id", async () => {
    const { status, cuerpo } = await crear({ cliente_id: clienteId + 1 });

    expect(status).toBe(400);
    expect(cuerpo).toEqual(
      errorDeCampo("cliente_id", "El cliente no existe", "REFERENCIA_INVALIDA"),
    );
    expect(await filas()).toEqual([]);
  });

  it("un pais en el cuerpo no cambia el impuesto: manda el del cliente", async () => {
    const { status, cuerpo } = await crear({ pais: "ES" });

    expect(status).toBe(201);
    expect(cuerpo).toMatchObject(IMPORTES_DE);
    expect(await filas()).toMatchObject([IMPORTES_DE]);
  });

  it.each([
    ["almacenamiento_gb", -1, ALMACENAMIENTO_MAL],
    ["almacenamiento_gb", 1_000_001, ALMACENAMIENTO_MAL],
    ["llamadas_api", -1, LLAMADAS_MAL],
    ["llamadas_api", 1_000_000_001, LLAMADAS_MAL],
  ])("%s con %s → 400 en su campo", async (campo, valor, mensaje) => {
    const { status, cuerpo } = await crear({ [campo]: valor });

    expect(status).toBe(400);
    expect(cuerpo).toEqual(errorDeCampo(campo, mensaje));
    expect(await filas()).toEqual([]);
  });
});
