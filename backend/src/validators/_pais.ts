// El campo `pais` del cuerpo, igual en todos los recursos: uno de la lista cerrada (spec §3).
import { PAISES } from "../utils/regex.js";
import { campoDelCuerpo } from "./_campo.js";

const CODIGOS_PAIS: string[] = PAISES.map(({ codigo }) => codigo);

export const esPaisDeLaLista = (valor: unknown): valor is string =>
  typeof valor === "string" && CODIGOS_PAIS.includes(valor);

export const campoPais = campoDelCuerpo("pais", {
  obligatorio: "El país es obligatorio",
  debeSer: `El país debe ser uno de: ${CODIGOS_PAIS.join(", ")}`,
}).isIn(CODIGOS_PAIS);
