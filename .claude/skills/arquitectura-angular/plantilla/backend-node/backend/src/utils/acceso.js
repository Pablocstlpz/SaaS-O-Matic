//aislamiento entre organizaciones (multi-inquilino). Toda comprobacion de "es esto de quien llama?" pasa por aqui
//con una sola empresa se deja igual (una organizacion); quitarla: references/proyecto-nuevo.md §3.3
import { noEncontrado } from "./errores.js";

//la organizacion SIEMPRE sale del token, nunca del body ni de la URL:
//si saliera de la peticion, cambiar un numero bastaria para ver datos de otro cliente
export const organizacionDe = (req) => req.usuario.organizacion_id;

//un recurso de otra organizacion responde 404, no 403: un 403 confirmaria que ese id existe
export const asegurarPropietario = (req, recurso) => {
  if (!recurso || String(recurso.organizacion_id) !== String(organizacionDe(req))) {
    throw noEncontrado();
  }
  return recurso;
};
