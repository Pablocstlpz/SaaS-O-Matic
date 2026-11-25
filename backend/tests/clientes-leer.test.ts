// Spec §4 «GET /customers/:id» y «GET /customers/:id/simulations».
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { Cliente } from "../src/models/cliente.model.js";
import { Simulacion } from "../src/models/simulacion.model.js";
import { cerrarApi, levantarApi, peticion } from "./_api.js";
import { datosCliente, vaciarBd } from "./_clientes.js";

beforeAll(levantarApi);
afterAll(cerrarApi);
beforeEach(vaciarBd);

describe("GET /customers/:id", () => {
  it("un cliente que existe → 200 con sus datos", async () => {
    const datos = datosCliente("Acme Ibérica", "A58818501");
    const { id } = await Cliente.create(datos);

    const { status, cuerpo } = await peticion("GET", `/customers/${id}`);

    expect(status).toBe(200);
    // toEqual: los campos del contrato y ninguno más.
    expect(cuerpo).toEqual({ ...datos, id, fecha_creacion: expect.any(String) });
  });

  it("un cliente que no existe → 404 NO_ENCONTRADO", async () => {
    const { status, cuerpo } = await peticion("GET", "/customers/999");

    expect(status).toBe(404);
    expect(cuerpo).toEqual({ message: "El cliente no existe", tipo: "NO_ENCONTRADO", errors: [] });
  });

  it.each([
    ["que no es un número", "abc"],
    ["de cientos de cifras", "9".repeat(400)],
    ["negativo de cientos de cifras", `-${"9".repeat(400)}`],
  ])("un id %s → 400", async (_caso, id) => {
    const mensaje = "El cliente debe ser un número entero";

    const { status, cuerpo } = await peticion("GET", `/customers/${id}`);

    expect(status).toBe(400);
    expect(cuerpo).toEqual({
      message: mensaje,
      tipo: "VALIDACION",
      errors: [{ campo: "id", mensaje }],
    });
  });
});

const simulacion = (cliente_id: number, usuarios: number, fecha: string) => ({
  cliente_id,
  usuarios,
  almacenamiento_gb: 0,
  llamadas_api: 0,
  coste_base_centimos: 0,
  porcentaje_impuesto: 20,
  impuesto_centimos: 0,
  total_centimos: 0,
  fecha_creacion: new Date(fecha),
});

describe("GET /customers/:id/simulations", () => {
  let conHistorial = 0;
  let sinHistorial = 0;

  beforeEach(async () => {
    conHistorial = (await Cliente.create(datosCliente("Con historial", "FR0001"))).id;
    sinHistorial = (await Cliente.create(datosCliente("Sin historial", "FR0002"))).id;
    const otro = (await Cliente.create(datosCliente("Otro", "FR0003"))).id;
    // El orden de alta (y de id) no es el de las fechas.
    await Simulacion.bulkCreate([
      simulacion(conHistorial, 3, "2026-03-01"),
      simulacion(conHistorial, 1, "2026-01-01"),
      simulacion(otro, 99, "2026-02-15"),
      simulacion(conHistorial, 2, "2026-02-01"),
    ]);
  });

  it("solo las simulaciones del cliente, la más nueva primero", async () => {
    const { status, cuerpo } = await peticion("GET", `/customers/${conHistorial}/simulations`);

    expect(status).toBe(200);
    expect(cuerpo).toMatchObject([{ usuarios: 3 }, { usuarios: 2 }, { usuarios: 1 }]);
  });

  it("un cliente sin simulaciones → 200 con la lista vacía", async () => {
    const { status, cuerpo } = await peticion("GET", `/customers/${sinHistorial}/simulations`);

    expect(status).toBe(200);
    expect(cuerpo).toEqual([]);
  });

  it("un cliente que no existe → 404 NO_ENCONTRADO", async () => {
    const { status, cuerpo } = await peticion("GET", "/customers/999/simulations");

    expect(status).toBe(404);
    expect(cuerpo).toEqual({ message: "El cliente no existe", tipo: "NO_ENCONTRADO", errors: [] });
  });
});
