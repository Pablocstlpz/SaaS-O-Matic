//EJEMPLO de recurso. Traduce HTTP <-> dominio: lee req, comprueba a quien pertenece, aplica la regla
//y elige codigo y respuesta. El formato de la entrada ya lo comprobo el validador
//
//sin try/catch: con Express 5 lo que lanza un async llega al manejador global de app.js
import { Producto } from "../models/producto.model.js";
import { asegurarPropietario, organizacionDe } from "../utils/acceso.js";
import { comprobarNombreLibre } from "../services/productos.service.js";

//GET /api/productos -> Producto[] (vacio = 200 [], no 404: una lista vacia no es un error)
export const listarProductos = async (req, res) => {
  const productos = await Producto.findAll({
    where: { organizacion_id: organizacionDe(req) },
    order: [["nombre", "ASC"]],
  });
  res.status(200).json(productos);
};

//GET /api/productos/:id -> Producto | 404
export const obtenerProducto = async (req, res) => {
  const producto = asegurarPropietario(req, await Producto.findByPk(req.params.id));
  res.status(200).json(producto);
};

//POST /api/productos -> 201 Producto
export const crearProducto = async (req, res) => {
  //lista blanca: solo estos campos. Nunca Producto.create(req.body), o el cliente elegiria organizacion_id
  const { nombre, precio, estado } = req.body;
  const organizacion_id = organizacionDe(req);

  await comprobarNombreLibre(organizacion_id, nombre);
  const producto = await Producto.create({ organizacion_id, nombre, precio, estado });
  res.status(201).json(producto);
};

//PUT /api/productos/:id -> Producto (parcial: lo que no llega no cambia)
export const actualizarProducto = async (req, res) => {
  const producto = asegurarPropietario(req, await Producto.findByPk(req.params.id));
  const { nombre, precio, estado } = req.body;

  if (nombre !== undefined) await comprobarNombreLibre(producto.organizacion_id, nombre, producto.id);
  await producto.update({ nombre, precio, estado });
  res.status(200).json(producto);
};

//DELETE /api/productos/:id -> 200 { message }
export const eliminarProducto = async (req, res) => {
  const producto = asegurarPropietario(req, await Producto.findByPk(req.params.id));
  await producto.destroy();
  res.status(200).json({ message: "Producto eliminado" });
};
