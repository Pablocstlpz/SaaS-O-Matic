// Validación del identificador fiscal (spec §3). Funciones puras: ni petición ni base de datos.
// En España se recalcula el carácter de control; fuera de España solo se mira el formato.

const LETRAS_DNI = "TRWAGMYFPDXBNJZSQVHLCKE";
// La posición de cada letra es el dígito de control que representa: J = 0, A = 1… I = 9.
const LETRAS_CIF = "JABCDEFGHI";

// Letras iniciales del CIF según cómo va su control. Una letra que no esté aquí no es un CIF.
const CIF_CONTROL_NUMERO = "ABEH";
const CIF_CONTROL_LETRA = "PQRSNW";
const CIF_CONTROL_CUALQUIERA = "CDFGJUV";

const FORMATO_DNI = /^\d{8}[A-Z]$/;
const FORMATO_NIE = /^[XYZ]\d{7}[A-Z]$/;
const FORMATO_CIF = /^[A-Z]\d{7}[A-Z0-9]$/;
const FORMATO_EXTRANJERO = /^[A-Z0-9]{4,20}$/;

// Así se valida y así se guarda: mayúsculas, sin espacios, puntos ni guiones.
export const normalizarIdentificador = (texto: string): string =>
  texto.toUpperCase().replace(/[\s.-]/g, "");

const esDni = (id: string): boolean =>
  FORMATO_DNI.test(id) && id.charAt(8) === LETRAS_DNI.charAt(Number(id.slice(0, 8)) % 23);

// Un NIE es un DNI cambiando la inicial por su posición: X → 0, Y → 1, Z → 2.
const esNie = (id: string): boolean =>
  FORMATO_NIE.test(id) && esDni(`${"XYZ".indexOf(id.charAt(0))}${id.slice(1)}`);

// Recibe los 7 dígitos centrales. Las posiciones impares (1, 3, 5, 7) se doblan y se suman las
// cifras del resultado; las pares (2, 4, 6) se suman tal cual.
const digitoControlCif = (digitos: string): number => {
  const suma = [...digitos].reduce((total, caracter, indice) => {
    const digito = Number(caracter);
    // El índice empieza en 0 y las posiciones en 1: índice impar = posición par.
    if (indice % 2 === 1) return total + digito;
    const doble = digito * 2;
    return total + Math.floor(doble / 10) + (doble % 10);
  }, 0);
  return (10 - (suma % 10)) % 10;
};

const esCif = (id: string): boolean => {
  if (!FORMATO_CIF.test(id)) return false;
  const inicial = id.charAt(0);
  const control = id.charAt(8);
  const digito = digitoControlCif(id.slice(1, 8));
  const coincideNumero = control === String(digito);
  const coincideLetra = control === LETRAS_CIF.charAt(digito);
  if (CIF_CONTROL_NUMERO.includes(inicial)) return coincideNumero;
  if (CIF_CONTROL_LETRA.includes(inicial)) return coincideLetra;
  return CIF_CONTROL_CUALQUIERA.includes(inicial) && (coincideNumero || coincideLetra);
};

// pais: código de 2 letras en mayúsculas. Normaliza siempre antes de validar.
export const esIdentificadorValido = (texto: string, pais: string): boolean => {
  const id = normalizarIdentificador(texto);
  if (pais !== "ES") return FORMATO_EXTRANJERO.test(id);
  return esDni(id) || esNie(id) || esCif(id);
};
