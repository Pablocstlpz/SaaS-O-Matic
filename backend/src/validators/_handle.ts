// Cierra todas las cadenas de validación: si algún campo falla, 400 VALIDACION con un error por campo.
import type { RequestHandler } from "express";
import { validationResult } from "express-validator";

import { ErrorHttp } from "../utils/errores.js";

export const comprobarValidacion: RequestHandler = (req, _res, next) => {
  const resultado = validationResult(req);
  if (resultado.isEmpty()) return next();
  // onlyFirstError: un campo que incumple dos reglas da un solo error.
  const errores = resultado.array({ onlyFirstError: true }).map((error) => {
    const campo = error.type === "field" ? error.path : "";
    // Una regla sin withMessage dejaría "Invalid value", en inglés.
    const sinTexto = error.msg === "Invalid value";
    return { campo, mensaje: sinTexto ? `El valor de ${campo} no es válido` : String(error.msg) };
  });
  throw new ErrorHttp(400, errores[0].mensaje, "VALIDACION", errores);
};
