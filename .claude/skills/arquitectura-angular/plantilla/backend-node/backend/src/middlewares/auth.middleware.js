//quien eres (autenticar) y que puedes hacer (autorizar). Se montan en los routers
import { verificarAcceso } from "../utils/seguridad.js";

//lee "Authorization: Bearer <token>" y deja el payload en req.usuario = { id, rol, organizacion_id }
//401 = el frontend intenta renovar la sesion; por eso no se usa 403 aqui
export const autenticar = (req, res, next) => {
  const [esquema, token] = (req.headers.authorization || "").split(" ");
  if (esquema !== "Bearer" || !token) {
    return res.status(401).json({ message: "Falta el token de acceso" });
  }
  try {
    req.usuario = verificarAcceso(token);
    next();
  } catch {
    res.status(401).json({ message: "Token inválido o caducado" });
  }
};

//autorizar("admin") o autorizar("admin", "usuario"). Siempre DESPUES de autenticar
//403 = estas dentro pero no puedes hacer esto
export const autorizar =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.usuario?.rol)) {
      return res.status(403).json({ message: "No tienes permiso para hacer esto" });
    }
    next();
  };
