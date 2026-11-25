import { body } from "express-validator";
import { LIMITES } from "../utils/regex.js";
import { comprobarValidacion } from "./_handle.js";

//exportada porque scripts/crear-usuario.js la usa tal cual: si el alta normalizara el email de otra forma
//que el login (normalizeEmail quita los puntos de un gmail), ese usuario no podria entrar nunca
export const reglaEmail = body("email")
  .isString()
  .withMessage("El email es obligatorio")
  .trim()
  .isEmail()
  .withMessage("El email no es válido")
  .isLength({ max: LIMITES.EMAIL_MAX })
  .withMessage(`El email no puede superar ${LIMITES.EMAIL_MAX} caracteres`)
  .normalizeEmail();

export const validarLogin = [
  reglaEmail,
  body("password").isString().withMessage("La contraseña es obligatoria").notEmpty().withMessage("La contraseña es obligatoria"),
  comprobarValidacion,
];

export const validarRenovar = [
  body("refreshToken").isString().withMessage("Falta el refreshToken").notEmpty().withMessage("Falta el refreshToken"),
  comprobarValidacion,
];
