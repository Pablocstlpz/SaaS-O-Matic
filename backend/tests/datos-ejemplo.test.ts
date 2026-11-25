// Spec §9 «Datos de ejemplo», contra la BD en memoria.
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { crearDatosEjemplo } from "../scripts/datos-ejemplo.js";
import { sequelize } from "../src/data/db.js";
import { Cliente } from "../src/models/cliente.model.js";
import { Simulacion, type SimulacionModelo } from "../src/models/simulacion.model.js";
import { calcularPrecio } from "../src/services/precios.service.js";
import { esIdentificadorValido } from "../src/utils/identificadorFiscal.js";
import { PAISES } from "../src/utils/regex.js";

// Parte de la BD vacía: las tablas las crea el propio script.
beforeAll(crearDatosEjemplo);
afterAll(() => sequelize.close());

const clientes = () => Cliente.findAll({ raw: true, order: [["id", "ASC"]] });
const simulaciones = () => Simulacion.findAll({ raw: true, order: [["id", "ASC"]] });

const importes = (origen: Partial<SimulacionModelo>) => ({
  coste_base_centimos: origen.coste_base_centimos,
  porcentaje_impuesto: origen.porcentaje_impuesto,
  impuesto_centimos: origen.impuesto_centimos,
  total_centimos: origen.total_centimos,
});

describe("datos de ejemplo", () => {
  it("crea 5 clientes, uno por país, y cada uno con 2 o 3 simulaciones", async () => {
    const creados = await clientes();
    const guardadas = await simulaciones();

    expect(creados).toHaveLength(5);
    expect(creados.map(({ pais }) => pais).sort()).toEqual(
      PAISES.map(({ codigo }) => codigo).sort(),
    );
    for (const { id } of creados) {
      const suyas = guardadas.filter(({ cliente_id }) => cliente_id === id);
      expect([2, 3]).toContain(suyas.length);
    }
  });

  it("todos los identificadores fiscales son válidos", async () => {
    const creados = await clientes();
    const falsos = creados.filter(
      ({ identificador_fiscal, pais }) => !esIdentificadorValido(identificador_fiscal, pais),
    );

    expect(creados).toHaveLength(5);
    expect(falsos).toEqual([]);
  });

  it("los importes guardados son los del servicio de precios", async () => {
    const paises = new Map((await clientes()).map(({ id, pais }) => [id, pais]));
    const guardadas = await simulaciones();
    const esperados = guardadas.map(({ cliente_id, usuarios }) =>
      importes(calcularPrecio(usuarios, paises.get(cliente_id) ?? "")),
    );

    expect(guardadas.length).toBeGreaterThan(0);
    expect(guardadas.map(importes)).toEqual(esperados);
  });

  it("lanzarlo dos veces no duplica clientes ni simulaciones", async () => {
    const antes = { clientes: await clientes(), simulaciones: await simulaciones() };

    await crearDatosEjemplo();

    expect({ clientes: await clientes(), simulaciones: await simulaciones() }).toEqual(antes);
  });
});
