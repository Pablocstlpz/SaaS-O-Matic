// Regla común de TODO campo del cuerpo: tiene que venir y ser un solo valor, ni lista ni objeto.
// Sin ella, express-validator valida las listas elemento a elemento y una lista vacía pasa.
// Cada validador empieza aquí sus cadenas y añade detrás sus sanitizers y reglas.
import { body } from "express-validator";

interface Mensajes {
  obligatorio: string; // «<Campo> es obligatorio»
  debeSer: string; // «<Campo> debe ser <regla>»
}

// En un JSON, typeof "object" son las listas, los objetos y null, y a null ya lo frena exists.
const esValorSimple = (valor: unknown) => typeof valor !== "object";

// debeSer es el mensaje por defecto de la cadena: las reglas que se añadan detrás no lo repiten.
// Tras un bail que falla no corre nada más: ningún sanitizer recibe una lista ni un objeto.
export const campoDelCuerpo = (campo: string, { obligatorio, debeSer }: Mensajes) =>
  body(campo, debeSer)
    .exists({ values: "null" })
    .withMessage(obligatorio)
    .bail()
    .custom(esValorSimple)
    .bail();
