// Montado en /customers. Método + ruta + validador + controlador, sin lógica.
import { Router } from "express";

import {
  crearCliente,
  listarClientes,
  listarSimulacionesCliente,
  obtenerCliente,
} from "../controllers/clientes.controller.js";
import {
  validarCrearCliente,
  validarIdCliente,
  validarListarClientes,
} from "../validators/clientes.validator.js";

const router = Router();

router.get("/", validarListarClientes, listarClientes);
router.get("/:id", validarIdCliente, obtenerCliente);
router.get("/:id/simulations", validarIdCliente, listarSimulacionesCliente);
router.post("/", validarCrearCliente, crearCliente);

export { router as clientesRoutes };
