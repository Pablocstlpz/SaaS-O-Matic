//EJEMPLO de recurso, montado en /api/productos
//un router es una lista legible: metodo + ruta + middlewares en orden + controlador. Sin logica
import { Router } from "express";
import {
  listarProductos,
  obtenerProducto,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
} from "../controllers/productos.controller.js";
import { autenticar, autorizar } from "../middlewares/auth.middleware.js";
import {
  validarIdParam,
  validarCrearProducto,
  validarActualizarProducto,
} from "../validators/productos.validator.js";

const router = Router();

//todo el recurso exige sesion; leer puede cualquiera de la organizacion, escribir solo admin
router.use(autenticar);

//las rutas fijas (p. ej. "/resumen") van ANTES que "/:id", o Express las toma por un id
router.get("/", listarProductos);
router.get("/:id", validarIdParam, obtenerProducto);
router.post("/", autorizar("admin"), validarCrearProducto, crearProducto);
router.put("/:id", autorizar("admin"), validarActualizarProducto, actualizarProducto);
router.delete("/:id", autorizar("admin"), validarIdParam, eliminarProducto);

export { router as productosRoutes };
