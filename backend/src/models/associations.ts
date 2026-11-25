// Todas las relaciones en un solo sitio, con foreignKey y as explícitos. Se importa una vez
// desde app.ts: así cualquier consulta puede usar include sin declarar nada más.
import { Cliente } from "./cliente.model.js";
import { Simulacion } from "./simulacion.model.js";

// onDelete siempre explícito: con una clave ajena obligatoria Sequelize pone CASCADE, y borrar
// un cliente borraría en silencio su historial.
const restringir = { onDelete: "RESTRICT", onUpdate: "CASCADE" };

Cliente.hasMany(Simulacion, { foreignKey: "cliente_id", as: "simulaciones", ...restringir });
Simulacion.belongsTo(Cliente, { foreignKey: "cliente_id", as: "cliente", ...restringir });
