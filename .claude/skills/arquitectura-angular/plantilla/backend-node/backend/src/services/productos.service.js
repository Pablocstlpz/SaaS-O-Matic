//reglas de negocio que usa mas de un sitio. Reciben datos (no req/res) y devuelven datos o lanzan ErrorHttp,
//asi las puede llamar un controlador, otro servicio o un trabajo en segundo plano
//
//esta capa NO es obligatoria: si una regla solo la usa un endpoint, se queda en su controlador
import { Op } from "sequelize";
import { Producto } from "../models/producto.model.js";
import { conflicto } from "../utils/errores.js";

//la usan crear y actualizar: por eso vive aqui y no copiada en los dos
//da el mensaje con el nombre y el tipo que el formulario pinta junto al campo; NO basta sola:
//dos peticiones a la vez pasan las dos esta consulta. Lo atomico es el indice unico del modelo
export const comprobarNombreLibre = async (organizacionId, nombre, excluirId) => {
  const repetido = await Producto.findOne({
    where: {
      organizacion_id: organizacionId,
      nombre,
      ...(excluirId && { id: { [Op.ne]: excluirId } }),
    },
  });
  if (repetido) {
    throw conflicto(`Ya existe un producto llamado «${nombre}»`, "NOMBRE_REPETIDO");
  }
};
