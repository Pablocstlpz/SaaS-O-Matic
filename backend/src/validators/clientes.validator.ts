// Formato de la entrada (spec §2, §3 y §4). En cada campo, primero se limpia y luego se valida.
// Aquí no se consultan datos: el identificador repetido y el cliente que no existe los comprueba
// el controlador.
import { param } from "express-validator";

import { esIdentificadorValido, normalizarIdentificador } from "../utils/identificadorFiscal.js";
import { LIMITES, PLANES } from "../utils/regex.js";
import { RANGO_ID, campoDeLaConsulta, campoDelCuerpo } from "./_campo.js";
import { comprobarValidacion } from "./_handle.js";
import { campoPais, esPaisDeLaLista } from "./_pais.js";

const { NOMBRE_EMPRESA_MIN, NOMBRE_EMPRESA_MAX, EMAIL_MAX } = LIMITES;

// Los sanitizers van detrás de isString().bail(): solo reciben textos.
const limpiarNombre = (texto: string) => texto.trim().replace(/\s+/g, " ");
const limpiarEmail = (texto: string) => texto.trim().toLowerCase();

const nombreEmpresa = campoDelCuerpo("nombre_empresa", {
  obligatorio: "El nombre de empresa es obligatorio",
  debeSer: `El nombre de empresa debe ser un texto de ${NOMBRE_EMPRESA_MIN} a ${NOMBRE_EMPRESA_MAX} caracteres`,
})
  .isString()
  .bail()
  .customSanitizer(limpiarNombre)
  .isLength({ min: NOMBRE_EMPRESA_MIN, max: NOMBRE_EMPRESA_MAX })
  // El buscador de SQLite no ve lo que va detrás de un carácter nulo.
  .not()
  .contains("\0");

// La regla depende del país que llega en el mismo cuerpo. Sin un país de la lista no hay regla
// que aplicar, y el error sale solo en `pais`.
const identificadorFiscal = campoDelCuerpo("identificador_fiscal", {
  obligatorio: "El identificador fiscal es obligatorio",
  debeSer: "El identificador fiscal debe ser válido para el país elegido",
})
  .isString()
  .bail()
  .customSanitizer(normalizarIdentificador)
  .custom((identificador: string, { req }) => {
    const pais: unknown = req.body?.pais;
    return !esPaisDeLaLista(pais) || esIdentificadorValido(identificador, pais);
  });

const emailContacto = campoDelCuerpo("email_contacto", {
  obligatorio: "El email de contacto es obligatorio",
  debeSer: `El email de contacto debe ser una dirección válida de ${EMAIL_MAX} caracteres como máximo`,
})
  .isString()
  .bail()
  .customSanitizer(limpiarEmail)
  // isEmail admite espacios si la parte de antes de la @ va entre comillas.
  .not()
  .matches(/\s/)
  // El único límite de longitud es el de LIMITES: se apagan los propios de isEmail.
  .isEmail({ ignore_max_length: true })
  .isLength({ max: EMAIL_MAX });

const plan = campoDelCuerpo("plan", {
  obligatorio: "El plan es obligatorio",
  debeSer: `El plan debe ser uno de: ${PLANES.join(", ")}`,
}).isIn(PLANES);

// Se busca en el nombre y en el identificador: algo más largo que un nombre no puede coincidir.
// El carácter nulo corta la consulta en SQLite.
const busqueda = campoDeLaConsulta(
  "q",
  `La búsqueda debe ser un texto de ${NOMBRE_EMPRESA_MAX} caracteres como máximo`,
)
  .isLength({ max: NOMBRE_EMPRESA_MAX })
  .not()
  .contains("\0");

const idCliente = param("id", "El cliente debe ser un número entero").isInt(RANGO_ID).toInt();

export const validarListarClientes = [busqueda, comprobarValidacion];

export const validarIdCliente = [idCliente, comprobarValidacion];

export const validarCrearCliente = [
  nombreEmpresa,
  identificadorFiscal,
  emailContacto,
  campoPais,
  plan,
  comprobarValidacion,
];
