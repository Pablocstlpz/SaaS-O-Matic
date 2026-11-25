import { DataTypes } from "sequelize";
import { sequelize } from "../data/db.js";
import { LIMITES, ROLES } from "../utils/regex.js";

export const Usuario = sequelize.define(
  "Usuario",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    organizacion_id: { type: DataTypes.INTEGER, allowNull: false },
    nombre: { type: DataTypes.STRING(LIMITES.NOMBRE_MAX), allowNull: false },
    email: { type: DataTypes.STRING(LIMITES.EMAIL_MAX), allowNull: false, unique: true },
    password_hash: { type: DataTypes.STRING(100), allowNull: false },
    rol: { type: DataTypes.ENUM(...ROLES), allowNull: false, defaultValue: "usuario" },
  },
  {
    tableName: "usuarios",
    createdAt: "fecha_creacion",
    updatedAt: "fecha_actualizacion",
  },
);

//el hash no sale NUNCA en una respuesta: quitarlo aqui evita depender de que cada controlador se acuerde
//toJSON solo afecta a la serializacion; el objeto en memoria conserva el hash para compararlo
Usuario.prototype.toJSON = function () {
  const { password_hash: _oculto, ...publico } = this.get();
  return publico;
};
