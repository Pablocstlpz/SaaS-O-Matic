//montado en /api/auth
import { Router } from "express";
import { iniciarSesion, renovarSesion, obtenerUsuarioActual } from "../controllers/auth.controller.js";
import { autenticar } from "../middlewares/auth.middleware.js";
import { limiteLogin } from "../middlewares/rateLimit.middleware.js";
import { validarLogin, validarRenovar } from "../validators/auth.validator.js";

const router = Router();

//publicas: sin autenticar (el token de acceso puede estar caducado), con rate limit
//renovar cuenta como un login implicito, por eso comparte limite
router.post("/login", limiteLogin, validarLogin, iniciarSesion);
router.post("/renovar", limiteLogin, validarRenovar, renovarSesion);

router.get("/yo", autenticar, obtenerUsuarioActual);

export { router as authRoutes };
