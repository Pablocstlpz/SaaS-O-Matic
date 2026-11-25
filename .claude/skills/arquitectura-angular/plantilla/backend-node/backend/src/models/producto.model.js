//EJEMPLO de recurso. Copia este fichero para cada entidad nueva y cambia los campos
import { DataTypes } from "sequelize";
import { sequelize } from "../data/db.js";
import { ESTADOS_PRODUCTO, LIMITES } from "../utils/regex.js";

export const Producto = sequelize.define(
  "Producto",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    organizacion_id: { type: DataTypes.INTEGER, allowNull: false },
    nombre: { type: DataTypes.STRING(LIMITES.PRODUCTO_NOMBRE_MAX), allowNull: false },
    precio: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      //MySQL/MariaDB devuelven DECIMAL como texto ("12.50"); la interfaz del frontend dice number
      //convertirlo aqui mantiene el contrato igual en todos los endpoints
      get() {
        const valor = this.getDataValue("precio");
        return valor == null ? valor : Number(valor);
      },
    },
    estado: { type: DataTypes.ENUM(...ESTADOS_PRODUCTO), allowNull: false, defaultValue: "activo" },
  },
  {
    tableName: "productos",
    createdAt: "fecha_creacion",
    updatedAt: "fecha_actualizacion",
    //unique: la unica garantia atomica frente a dos altas a la vez (ver el manejador de app.js)
    //nombre explicito: sync() decide por el nombre si ya existe (y lo anade a una tabla vieja que no lo tenga),
    //y una migracion futura que lo quite o lo cambie sabe como se llama
    indexes: [{ name: "productos_organizacion_nombre", unique: true, fields: ["organizacion_id", "nombre"] }],
  },
);
