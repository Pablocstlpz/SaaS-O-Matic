// Solo el formato de la entrada (spec §4). Aquí no se consultan datos ni se calculan precios.
import { LIMITES, PAISES } from "../utils/regex.js";
import { campoDelCuerpo } from "./_campo.js";
import { comprobarValidacion } from "./_handle.js";

const CODIGOS_PAIS = PAISES.map(({ codigo }) => codigo);
const MIN = LIMITES.USUARIOS_MIN.toLocaleString("es-ES");
const MAX = LIMITES.USUARIOS_MAX.toLocaleString("es-ES");

const usuarios = campoDelCuerpo("usuarios", {
  obligatorio: "Los usuarios son obligatorios",
  debeSer: `Los usuarios deben ser un número entero entre ${MIN} y ${MAX}`,
})
  .isInt({ min: LIMITES.USUARIOS_MIN, max: LIMITES.USUARIOS_MAX })
  .toInt();

const pais = campoDelCuerpo("pais", {
  obligatorio: "El país es obligatorio",
  debeSer: `El país debe ser uno de: ${CODIGOS_PAIS.join(", ")}`,
}).isIn(CODIGOS_PAIS);

export const validarCalcularSimulacion = [usuarios, pais, comprobarValidacion];
