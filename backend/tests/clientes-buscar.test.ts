// Spec §4 «GET /customers?q=texto», con las dudas del buscador de §6.
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { Cliente } from "../src/models/cliente.model.js";
import { cerrarApi, levantarApi, peticion } from "./_api.js";
import { datosCliente, vaciarBd } from "./_clientes.js";

beforeAll(levantarApi);
afterAll(cerrarApi);
beforeEach(vaciarBd);

const comoClientes = (nombres: string[]) => nombres.map((nombre_empresa) => ({ nombre_empresa }));

const buscar = (q: string) => peticion("GET", `/customers?q=${encodeURIComponent(q)}`);

// «Cliente 01», «Cliente 02»… Se guardan del último al primero: el orden tiene que ponerlo la API.
const NOMBRES = Array.from({ length: 51 }, (_, i) => `Cliente ${String(i + 1).padStart(2, "0")}`);
const crear51 = () =>
  Cliente.bulkCreate(NOMBRES.map((nombre, i) => datosCliente(nombre, `ID${1000 + i}`)).reverse());

describe("GET /customers: qué encuentra", () => {
  beforeEach(async () => {
    await Cliente.bulkCreate([
      datosCliente("Acme Ibérica", "A58818501"),
      datosCliente("Muster", "DE123456789"),
      datosCliente("Cien% Cloud", "FR0001"),
      datosCliente("Guion_Bajo", "FR0002"),
    ]);
  });

  it.each([
    ["parte del nombre", "cME", "Acme Ibérica"],
    ["parte del identificador", "de1234", "Muster"],
  ])("por %s, sin distinguir mayúsculas", async (_caso, q, nombre) => {
    const { status, cuerpo } = await buscar(q);

    expect(status).toBe(200);
    expect(cuerpo).toMatchObject(comoClientes([nombre]));
  });

  it.each([
    ["%", "Cien% Cloud"],
    ["_", "Guion_Bajo"],
  ])("q=%s se busca como texto, no como comodín", async (q, nombre) => {
    const { status, cuerpo } = await buscar(q);

    expect(status).toBe(200);
    expect(cuerpo).toMatchObject(comoClientes([nombre]));
  });

  it("sin resultados → 200 con la lista vacía", async () => {
    const { status, cuerpo } = await buscar("zzz");

    expect(status).toBe(200);
    expect(cuerpo).toEqual([]);
  });
});

describe("GET /customers: tildes, eñe y q mal", () => {
  it.each([
    ["guardado en mayúsculas", "IBÉRICA SUR", "ibérica"],
    ["buscado en mayúsculas", "Peña Hermanos", "PEÑA"],
  ])("con tilde o eñe %s, lo encuentra", async (_caso, nombre, q) => {
    await Cliente.create(datosCliente(nombre, "FR0001"));

    const { status, cuerpo } = await buscar(q);

    expect(status).toBe(200);
    expect(cuerpo).toMatchObject(comoClientes([nombre]));
  });

  it.each([
    ["repetido (llega como lista)", "q=a&q=b"],
    ["de 121 caracteres", `q=${"a".repeat(121)}`],
    ["con el carácter nulo", "q=a%00"],
  ])("q %s → 400 en q", async (_caso, consulta) => {
    const mensaje = "La búsqueda debe ser un texto de 120 caracteres como máximo";

    const { status, cuerpo } = await peticion("GET", `/customers?${consulta}`);

    expect(status).toBe(400);
    expect(cuerpo).toEqual({
      message: mensaje,
      tipo: "VALIDACION",
      errors: [{ campo: "q", mensaje }],
    });
  });
});

describe("GET /customers: cuántos y en qué orden", () => {
  it("ordena por nombre sin distinguir mayúsculas", async () => {
    const nombres = ["Zeta", "acme", "Beta"];
    await Cliente.bulkCreate(nombres.map((nombre, i) => datosCliente(nombre, `FR000${i}`)));

    const { status, cuerpo } = await peticion("GET", "/customers");

    expect(status).toBe(200);
    expect(cuerpo).toMatchObject(comoClientes(["acme", "Beta", "Zeta"]));
  });

  it("con 51 coincidencias devuelve 50, ordenadas por nombre", async () => {
    await crear51();

    const { status, cuerpo } = await buscar("cliente");

    expect(status).toBe(200);
    expect(cuerpo).toMatchObject(comoClientes(NOMBRES.slice(0, 50)));
  });

  it.each([
    ["sin q", "/customers"],
    ["con q vacío", "/customers?q="],
  ])("%s → los 50 primeros por nombre", async (_caso, ruta) => {
    await crear51();

    const { status, cuerpo } = await peticion("GET", ruta);

    expect(status).toBe(200);
    expect(cuerpo).toMatchObject(comoClientes(NOMBRES.slice(0, 50)));
  });
});
