// Spec §3 «Coste mensual base» e «Impuesto», con los casos de §7 «Tramos» e «Impuesto».
import { describe, expect, it } from "vitest";

import { calcularPrecio } from "../src/services/precios.service.js";

describe("coste base por tramos", () => {
  // La fila de 0 usuarios la frena el validador, no el servicio.
  it.each([
    { usuarios: 1, base: 1000 },
    { usuarios: 10, base: 10000 },
    { usuarios: 11, base: 10800 },
    { usuarios: 15, base: 14000 },
    { usuarios: 50, base: 42000 },
    { usuarios: 51, base: 42500 },
    { usuarios: 100, base: 67000 },
  ])("$usuarios usuarios → $base céntimos", ({ usuarios, base }) => {
    expect(calcularPrecio(usuarios, "ES").coste_base_centimos).toBe(base);
  });

  it("desglosa 15 usuarios en 10 × 10 € + 5 × 8 €", () => {
    const primero = { desde: 1, hasta: 10, usuarios: 10, precio_unitario_centimos: 1000 };
    const segundo = { desde: 11, hasta: 50, usuarios: 5, precio_unitario_centimos: 800 };

    expect(calcularPrecio(15, "ES").tramos).toEqual([
      { ...primero, subtotal_centimos: 10000 },
      { ...segundo, subtotal_centimos: 4000 },
    ]);
  });
});

describe("impuesto y total", () => {
  it.each([
    { pais: "ES", usuarios: 15, base: 14000, impuesto: 2940, total: 16940 },
    { pais: "DE", usuarios: 51, base: 42500, impuesto: 8075, total: 50575 },
    { pais: "FR", usuarios: 10, base: 10000, impuesto: 2000, total: 12000 },
  ])("$pais con $usuarios usuarios → total $total", ({ pais, usuarios, base, impuesto, total }) => {
    expect(calcularPrecio(usuarios, pais)).toMatchObject({
      coste_base_centimos: base,
      impuesto_centimos: impuesto,
      total_centimos: total,
    });
  });
});
