// Spec §4 «POST /simulations/calcular», con los casos de §7 «Tramos» (0 usuarios) y «API» (país).
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { cerrarApi, levantarApi, peticion } from "./_api.js";

beforeAll(levantarApi);
afterAll(cerrarApi);

const calcular = (usuarios: unknown, pais: unknown) =>
  peticion("POST", "/simulations/calcular", { cuerpo: { usuarios, pais } });

const USUARIOS_MAL = "Los usuarios deben ser un número entero entre 1 y 100.000";
const PAIS_MAL = "El país debe ser uno de: ES, FR, GB, IT, DE";

// El 400 completo: el mensaje general es el del único campo que falla.
const errorDeCampo = (campo: string, mensaje: string) => ({
  message: mensaje,
  tipo: "VALIDACION",
  errors: [{ campo, mensaje }],
});

describe("POST /simulations/calcular", () => {
  it("ES y 15 usuarios → 200 con desglose, impuesto y total", async () => {
    const primero = { desde: 1, hasta: 10, usuarios: 10, precio_unitario_centimos: 1000 };
    const segundo = { desde: 11, hasta: 50, usuarios: 5, precio_unitario_centimos: 800 };

    const { status, cuerpo } = await calcular(15, "ES");

    expect(status).toBe(200);
    expect(cuerpo).toEqual({
      usuarios: 15,
      pais: "ES",
      tramos: [
        { ...primero, subtotal_centimos: 10000 },
        { ...segundo, subtotal_centimos: 4000 },
      ],
      coste_base_centimos: 14000,
      porcentaje_impuesto: 21,
      impuesto_centimos: 2940,
      total_centimos: 16940,
    });
  });

  it.each([0, 100_001, 2.5])("%s usuarios → 400 en usuarios", async (usuarios) => {
    const { status, cuerpo } = await calcular(usuarios, "ES");

    expect(status).toBe(400);
    expect(cuerpo).toEqual(errorDeCampo("usuarios", USUARIOS_MAL));
  });

  it.each([{ lista: [] }, { lista: [15] }])(
    "usuarios como lista $lista → 400 en usuarios",
    async ({ lista }) => {
      const { status, cuerpo } = await calcular(lista, "ES");

      expect(status).toBe(400);
      expect(cuerpo).toEqual(errorDeCampo("usuarios", USUARIOS_MAL));
    },
  );

  it("un país fuera de la lista → 400 en pais", async () => {
    const { status, cuerpo } = await calcular(15, "PT");

    expect(status).toBe(400);
    expect(cuerpo).toEqual(errorDeCampo("pais", PAIS_MAL));
  });

  it("pais como lista → 400 en pais", async () => {
    const { status, cuerpo } = await calcular(15, ["ES"]);

    expect(status).toBe(400);
    expect(cuerpo).toEqual(errorDeCampo("pais", PAIS_MAL));
  });
});
