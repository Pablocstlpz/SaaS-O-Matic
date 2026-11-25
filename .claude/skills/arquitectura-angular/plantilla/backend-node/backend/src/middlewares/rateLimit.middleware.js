//un limitador por tipo de endpoint sensible (login, registro, recuperar contrasena...)
//cuenta por IP: necesita app.set("trust proxy", 1) en app.js si hay un proxy delante
import rateLimit from "express-rate-limit";

const limitador = (minutos, maximo, message) =>
  rateLimit({
    windowMs: minutos * 60 * 1000,
    limit: maximo,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message },
  });

//20 intentos / 15 min: frena la fuerza bruta y un usuario real casi nunca llega
export const limiteLogin = limitador(15, 20, "Demasiados intentos. Vuelve a probar en 15 minutos.");
