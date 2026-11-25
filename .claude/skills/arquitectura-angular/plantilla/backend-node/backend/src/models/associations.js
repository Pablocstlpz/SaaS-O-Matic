//TODAS las relaciones en un solo sitio, con foreignKey y as explicitos (sin as, Sequelize deriva el
//nombre con reglas de ingles: "Categoria" se singulariza a "Categorium")
//se importa una vez desde app.js; asi cualquier consulta puede usar include sin declarar nada mas
//
//onDelete SIEMPRE explicito: con una clave ajena obligatoria (allowNull: false) Sequelize pone CASCADE
//por defecto, y borrar la organizacion (o una categoria) borraria en silencio todo lo que cuelga de ella.
//RESTRICT hace que la BD lo impida; si el negocio quiere borrar en cascada, que se lea aqui escrito
const restringir = { onDelete: "RESTRICT", onUpdate: "CASCADE" };
import { Organizacion } from "./organizacion.model.js";
import { Usuario } from "./usuario.model.js";
import { Producto } from "./producto.model.js";

Organizacion.hasMany(Usuario, { foreignKey: "organizacion_id", as: "usuarios", ...restringir });
Usuario.belongsTo(Organizacion, { foreignKey: "organizacion_id", as: "organizacion", ...restringir });

Organizacion.hasMany(Producto, { foreignKey: "organizacion_id", as: "productos", ...restringir });
Producto.belongsTo(Organizacion, { foreignKey: "organizacion_id", as: "organizacion", ...restringir });
