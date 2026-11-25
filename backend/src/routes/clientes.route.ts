// Montado en /customers. Método + ruta + validador + controlador, sin lógica.
import { Router } from "express";

import { crearCliente } from "../controllers/clientes.controller.js";
import { validarCrearCliente } from "../validators/clientes.validator.js";

const router = Router();

router.post("/", validarCrearCliente, crearCliente);

export { router as clientesRoutes };
