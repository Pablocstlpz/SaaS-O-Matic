// Solo el formato de la entrada (spec §4). Aquí no se consultan datos ni se calculan precios.
import { LIMITES } from "../utils/regex.js";
import { campoDelCuerpo } from "./_campo.js";
import { comprobarValidacion } from "./_handle.js";
import { campoPais } from "./_pais.js";

const MIN = LIMITES.USUARIOS_MIN.toLocaleString("es-ES");
const MAX = LIMITES.USUARIOS_MAX.toLocaleString("es-ES");

const usuarios = campoDelCuerpo("usuarios", {
  obligatorio: "Los usuarios son obligatorios",
  debeSer: `Los usuarios deben ser un número entero entre ${MIN} y ${MAX}`,
})
  .isInt({ min: LIMITES.USUARIOS_MIN, max: LIMITES.USUARIOS_MAX })
  .toInt();

export const validarCalcularSimulacion = [usuarios, campoPais, comprobarValidacion];
