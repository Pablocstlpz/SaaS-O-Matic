// Montado en /simulations. Método + ruta + validador + controlador, sin lógica.
import { Router } from "express";

import { calcularSimulacion } from "../controllers/simulaciones.controller.js";
import { validarCalcularSimulacion } from "../validators/simulaciones.validator.js";

const router = Router();

router.post("/calcular", validarCalcularSimulacion, calcularSimulacion);

export { router as simulacionesRoutes };
