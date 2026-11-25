//contrasenas y tokens de sesion en un solo sitio: ni numeros magicos ni secretos repartidos por los controladores
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { JWT_SECRETO, JWT_SECRETO_REFRESCO } from "../config.js";

//12 rondas ~250 ms por hash: lento para un ataque offline, imperceptible en un login con rate limit
//bcrypt.compare lee las rondas del propio hash, asi subirlo no invalida contrasenas antiguas
const RONDAS_BCRYPT = 12;

export const hashearPassword = (plana) => bcrypt.hash(plana, RONDAS_BCRYPT);
export const compararPassword = (plana, hash) => bcrypt.compare(plana, hash);

//acceso corto: si se roba, sirve poco tiempo. Refresco largo: evita pedir la contrasena cada 15 min
const DURACION_ACCESO = "15m";
const DURACION_REFRESCO = "7d";

//payload minimo: lo justo para autorizar sin ir a la BD en cada peticion
const payloadDe = (usuario) => ({
  id: usuario.id,
  rol: usuario.rol,
  organizacion_id: usuario.organizacion_id,
});

export const emitirTokens = (usuario) => ({
  accessToken: jwt.sign(payloadDe(usuario), JWT_SECRETO, { expiresIn: DURACION_ACCESO }),
  refreshToken: jwt.sign({ id: usuario.id }, JWT_SECRETO_REFRESCO, { expiresIn: DURACION_REFRESCO }),
});

//lanzan si la firma no vale o ha caducado; quien llama decide el codigo HTTP
export const verificarAcceso = (token) => jwt.verify(token, JWT_SECRETO);
export const verificarRefresco = (token) => jwt.verify(token, JWT_SECRETO_REFRESCO);
