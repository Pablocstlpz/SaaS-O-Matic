// Formato de la entrada (spec §2 y §3). En cada campo, primero se limpia y luego se valida.
// Aquí no se consultan datos: el identificador repetido lo comprueba el controlador.
import { esIdentificadorValido, normalizarIdentificador } from "../utils/identificadorFiscal.js";
import { LIMITES, PLANES } from "../utils/regex.js";
import { campoDelCuerpo } from "./_campo.js";
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
  .isLength({ min: NOMBRE_EMPRESA_MIN, max: NOMBRE_EMPRESA_MAX });

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

export const validarCrearCliente = [
  nombreEmpresa,
  identificadorFiscal,
  emailContacto,
  campoPais,
  plan,
  comprobarValidacion,
];
