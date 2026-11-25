// Spec §3 «Validación del identificador fiscal» y casos de §7 «Identificador fiscal».
import { describe, expect, it } from "vitest";

import { esIdentificadorValido } from "../src/utils/identificadorFiscal.js";

const LETRAS_CONTROL_CUALQUIERA = ["C", "D", "F", "G", "J", "U", "V"];

describe("identificador fiscal de España", () => {
  it.each([
    { entrada: "12345678Z", valido: true, caso: "DNI" },
    { entrada: "12345678A", valido: false, caso: "DNI" },
    { entrada: "X1234567L", valido: true, caso: "NIE" },
    { entrada: "A58818501", valido: true, caso: "CIF, control número" },
    { entrada: "A58818502", valido: false, caso: "CIF, control número" },
    { entrada: "Q2826000H", valido: true, caso: "CIF, control letra" },
    { entrada: "Q28260008", valido: false, caso: "Q exige letra" },
    { entrada: "a-58.818.501", valido: true, caso: "se normaliza antes" },
  ])("$entrada ($caso) → válido: $valido", ({ entrada, valido }) => {
    expect(esIdentificadorValido(entrada, "ES")).toBe(valido);
  });

  // La tabla de §7 no trae un NIE falso.
  it("un NIE con la letra de control equivocada es inválido", () => {
    expect(esIdentificadorValido("X1234567A", "ES")).toBe(false);
  });

  it("un NIE con Y es válido", () => {
    expect(esIdentificadorValido("Y1234567X", "ES")).toBe(true);
  });

  it("un CIF A con el control en letra es inválido", () => {
    expect(esIdentificadorValido("A5881850A", "ES")).toBe(false);
  });

  it("un CIF C con el control equivocado es inválido", () => {
    expect(esIdentificadorValido("C58818502", "ES")).toBe(false);
  });

  it.each(LETRAS_CONTROL_CUALQUIERA)("un CIF %s acepta el control en número", (letra) => {
    expect(esIdentificadorValido(`${letra}58818501`, "ES")).toBe(true);
  });

  it.each(LETRAS_CONTROL_CUALQUIERA)("un CIF %s acepta el control en letra", (letra) => {
    expect(esIdentificadorValido(`${letra}5881850A`, "ES")).toBe(true);
  });
});

describe("identificador fiscal de fuera de España", () => {
  it.each(["AB12", "ABCDEFGHIJ1234567890"])("acepta %s", (entrada) => {
    expect(esIdentificadorValido(entrada, "FR")).toBe(true);
  });

  it.each([
    { caso: "3 caracteres", entrada: "AB1" },
    { caso: "21 caracteres", entrada: "ABCDEFGHIJ12345678901" },
    { caso: "un símbolo", entrada: "AB12/34" },
  ])("rechaza $caso", ({ entrada }) => {
    expect(esIdentificadorValido(entrada, "FR")).toBe(false);
  });
});
