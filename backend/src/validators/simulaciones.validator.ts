// Solo el formato de la entrada (spec §2 y §4). Aquí no se consultan datos ni se calculan precios:
// que el cliente exista lo comprueba el controlador.
import { LIMITES } from "../utils/regex.js";
import { RANGO_ID, campoDelCuerpo } from "./_campo.js";
import { comprobarValidacion } from "./_handle.js";
import { campoPais } from "./_pais.js";

interface ReglaEntero {
  obligatorio: string;
  // El «debe ser» sin los límites, que se añaden detrás.
  debeSer: string;
  min: number;
  max: number;
}

const enTexto = (numero: number) => numero.toLocaleString("es-ES");

const campoEntero = (campo: string, { obligatorio, debeSer, min, max }: ReglaEntero) =>
  campoDelCuerpo(campo, {
    obligatorio,
    debeSer: `${debeSer} entre ${enTexto(min)} y ${enTexto(max)}`,
  })
    .isInt({ min, max })
    .toInt();

const clienteId = campoDelCuerpo("cliente_id", {
  obligatorio: "El cliente es obligatorio",
  debeSer: "El cliente debe ser un número entero",
})
  .isInt(RANGO_ID)
  .toInt();

const usuarios = campoEntero("usuarios", {
  obligatorio: "Los usuarios son obligatorios",
  debeSer: "Los usuarios deben ser un número entero",
  min: LIMITES.USUARIOS_MIN,
  max: LIMITES.USUARIOS_MAX,
});

const almacenamientoGb = campoEntero("almacenamiento_gb", {
  obligatorio: "El almacenamiento es obligatorio",
  debeSer: "El almacenamiento debe ser un número entero de GB",
  min: LIMITES.ALMACENAMIENTO_GB_MIN,
  max: LIMITES.ALMACENAMIENTO_GB_MAX,
});

const llamadasApi = campoEntero("llamadas_api", {
  obligatorio: "Las llamadas a la API son obligatorias",
  debeSer: "Las llamadas a la API deben ser un número entero",
  min: LIMITES.LLAMADAS_API_MIN,
  max: LIMITES.LLAMADAS_API_MAX,
});

export const validarCalcularSimulacion = [usuarios, campoPais, comprobarValidacion];

export const validarCrearSimulacion = [
  clienteId,
  usuarios,
  almacenamientoGb,
  llamadasApi,
  comprobarValidacion,
];
