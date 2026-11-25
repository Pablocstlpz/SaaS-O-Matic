//el inquilino: cada usuario y cada dato pertenece a una organizacion
//con una sola empresa se deja (una fila): quitarlo es references/proyecto-nuevo.md §3.3
import { DataTypes } from "sequelize";
import { sequelize } from "../data/db.js";
import { LIMITES } from "../utils/regex.js";

export const Organizacion = sequelize.define(
  "Organizacion",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre: { type: DataTypes.STRING(LIMITES.NOMBRE_MAX), allowNull: false },
  },
  {
    tableName: "organizaciones",
    createdAt: "fecha_creacion",
    updatedAt: "fecha_actualizacion",
  },
);
