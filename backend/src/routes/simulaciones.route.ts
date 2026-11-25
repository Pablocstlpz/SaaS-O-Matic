// Montado en /simulations. Método + ruta + validador + controlador, sin lógica.
import { Router } from "express";

import { calcularSimulacion, crearSimulacion } from "../controllers/simulaciones.controller.js";
import {
  validarCalcularSimulacion,
  validarCrearSimulacion,
} from "../validators/simulaciones.validator.js";

const router = Router();

router.post("/calcular", validarCalcularSimulacion, calcularSimulacion);
router.post("/", validarCrearSimulacion, crearSimulacion);

export { router as simulacionesRoutes };
