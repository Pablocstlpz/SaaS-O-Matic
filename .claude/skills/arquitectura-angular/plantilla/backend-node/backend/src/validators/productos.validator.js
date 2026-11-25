//SOLO formato de la entrada: tipos, obligatorios, longitudes, enumerados. Nada de consultar datos:
//"ya existe otro con ese nombre" es una regla de negocio y va en el servicio
import { body, param } from "express-validator";
import { ESTADOS_PRODUCTO, LIMITES } from "../utils/regex.js";
import { comprobarValidacion } from "./_handle.js";

//mismas reglas para crear y actualizar; al crear son obligatorias, al actualizar opcionales (PUT parcial)
const reglas = (paraCrear) => {
  const campo = (nombre, obligatorio) =>
    paraCrear ? body(nombre).exists({ values: "null" }).withMessage(obligatorio) : body(nombre).optional();
  return [
    campo("nombre", "El nombre es obligatorio")
      .isString()
      .withMessage("El nombre tiene que ser un texto")
      .trim()
      .notEmpty()
      .withMessage("El nombre es obligatorio")
      .isLength({ max: LIMITES.PRODUCTO_NOMBRE_MAX })
      .withMessage(`El nombre no puede superar ${LIMITES.PRODUCTO_NOMBRE_MAX} caracteres`),
    campo("precio", "El precio es obligatorio")
      .isFloat({ min: 0, max: LIMITES.PRECIO_MAX })
      .withMessage(`El precio debe estar entre 0 y ${LIMITES.PRECIO_MAX}`)
      .toFloat(),
    body("estado")
      .optional()
      .isIn(ESTADOS_PRODUCTO)
      .withMessage(`El estado debe ser uno de: ${ESTADOS_PRODUCTO.join(", ")}`),
  ];
};

const id = param("id").isInt({ min: 1 }).withMessage("El id debe ser un entero positivo").toInt();

export const validarIdParam = [id, comprobarValidacion];
export const validarCrearProducto = [...reglas(true), comprobarValidacion];
export const validarActualizarProducto = [id, ...reglas(false), comprobarValidacion];
