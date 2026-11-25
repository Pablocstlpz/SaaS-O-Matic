// Regla común de TODO campo del cuerpo o de la consulta: tiene que ser un solo valor, ni lista ni
// objeto. Sin ella, express-validator valida las listas elemento a elemento y una lista vacía pasa.
// Cada validador empieza aquí sus cadenas y añade detrás sus sanitizers y reglas.
import { body, query } from "express-validator";

interface Mensajes {
  obligatorio: string; // «<Campo> es obligatorio»
  debeSer: string; // «<Campo> debe ser <regla>»
}

// En un JSON, typeof "object" son las listas, los objetos y null, y a null ya lo frena exists.
// En la URL, un parámetro repetido (?q=a&q=b) llega como lista.
const esValorSimple = (valor: unknown) => typeof valor !== "object";

// Para isInt en los id: con cientos de cifras, toInt daría Infinity y fallaría la consulta.
export const RANGO_ID = { min: Number.MIN_SAFE_INTEGER, max: Number.MAX_SAFE_INTEGER };

// debeSer es el mensaje por defecto de la cadena: las reglas que se añadan detrás no lo repiten.
// Tras un bail que falla no corre nada más: ningún sanitizer recibe una lista ni un objeto.
export const campoDelCuerpo = (campo: string, { obligatorio, debeSer }: Mensajes) =>
  body(campo, debeSer)
    .exists({ values: "null" })
    .withMessage(obligatorio)
    .bail()
    .custom(esValorSimple)
    .bail();

// Los parámetros de la consulta son opcionales: si no vienen, no hay nada que comprobar.
export const campoDeLaConsulta = (campo: string, debeSer: string) =>
  query(campo, debeSer).optional().custom(esValorSimple).bail();
