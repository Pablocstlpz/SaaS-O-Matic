import { Usuario } from "../models/usuario.model.js";
import { compararPassword, emitirTokens, verificarRefresco } from "../utils/seguridad.js";
import { ErrorHttp } from "../utils/errores.js";

//POST /api/auth/login -> { accessToken, refreshToken, usuario }
export const iniciarSesion = async (req, res) => {
  const { email, password } = req.body;
  const usuario = await Usuario.findOne({ where: { email } });

  //mismo mensaje si el email no existe o la contrasena falla: distinguirlos dice que emails tienen cuenta
  if (!usuario || !(await compararPassword(password, usuario.password_hash))) {
    throw new ErrorHttp(401, "Email o contraseña incorrectos");
  }
  res.status(200).json({ ...emitirTokens(usuario), usuario });
};

//POST /api/auth/renovar -> { accessToken, refreshToken }
//vuelvo a leer el usuario: si lo borraron o le cambiaron el rol, el refresco no puede alargar lo antiguo
export const renovarSesion = async (req, res) => {
  let payload;
  try {
    payload = verificarRefresco(req.body.refreshToken);
  } catch {
    throw new ErrorHttp(401, "La sesión ha caducado", "SESION_CADUCADA");
  }
  const usuario = await Usuario.findByPk(payload.id);
  if (!usuario) {
    throw new ErrorHttp(401, "La sesión ha caducado", "SESION_CADUCADA");
  }
  res.status(200).json(emitirTokens(usuario));
};

//GET /api/auth/yo -> el usuario de la sesion (para recargar el perfil sin volver a hacer login)
export const obtenerUsuarioActual = async (req, res) => {
  const usuario = await Usuario.findByPk(req.usuario.id);
  if (!usuario) throw new ErrorHttp(401, "La sesión ha caducado", "SESION_CADUCADA");
  res.status(200).json(usuario);
};
