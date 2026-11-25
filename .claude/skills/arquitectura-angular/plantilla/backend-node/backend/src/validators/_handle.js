import { validationResult } from "express-validator";

//cierra TODAS las cadenas de validacion. Un solo formato de error para toda la API, el mismo que el backend .NET:
//400 { message: primer error, errors: [{ campo, mensaje }] } -> el frontend pinta "message" sin mas
//
//onlyFirstError: un campo que falla en tres reglas da un error, no tres. Y si una regla se quedo sin
//withMessage, express-validator pone "Invalid value": se sustituye aqui para que nunca salga en ingles
export const comprobarValidacion = (req, res, next) => {
  const errores = validationResult(req);
  if (!errores.isEmpty()) {
    const lista = errores.array({ onlyFirstError: true }).map((e) => ({
      campo: e.path,
      mensaje: e.msg === "Invalid value" ? `El valor de ${e.path} no es válido` : e.msg,
    }));
    return res.status(400).json({ message: lista[0].mensaje, errors: lista });
  }
  next();
};
