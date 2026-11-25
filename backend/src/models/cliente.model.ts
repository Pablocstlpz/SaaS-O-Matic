// Cliente (spec §2). La clave es el id; el identificador fiscal es único y llega ya normalizado.
import {
  DataTypes,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
  type Model,
} from "sequelize";

import { sequelize } from "../data/db.js";
import { LIMITES, PLANES } from "../utils/regex.js";

export interface ClienteModelo
  extends Model<InferAttributes<ClienteModelo>, InferCreationAttributes<ClienteModelo>> {
  id: CreationOptional<number>;
  nombre_empresa: string;
  identificador_fiscal: string;
  email_contacto: string;
  pais: string;
  plan: (typeof PLANES)[number];
  fecha_creacion: CreationOptional<Date>;
}

export const Cliente = sequelize.define<ClienteModelo>(
  "Cliente",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre_empresa: { type: DataTypes.STRING(LIMITES.NOMBRE_EMPRESA_MAX), allowNull: false },
    // El máximo de fuera de España es el más largo: un DNI, NIE o CIF ocupa 9.
    identificador_fiscal: {
      type: DataTypes.STRING(LIMITES.IDENTIFICADOR_EXTRANJERO_MAX),
      allowNull: false,
    },
    email_contacto: { type: DataTypes.STRING(LIMITES.EMAIL_MAX), allowNull: false },
    pais: { type: DataTypes.STRING(2), allowNull: false },
    plan: { type: DataTypes.ENUM(...PLANES), allowNull: false },
    // La rellena Sequelize (createdAt, abajo).
    fecha_creacion: DataTypes.DATE,
  },
  {
    tableName: "clientes",
    createdAt: "fecha_creacion",
    updatedAt: false,
    // La única garantía atómica frente a dos altas a la vez (ver el manejador de app.ts).
    indexes: [
      { name: "clientes_identificador_fiscal", unique: true, fields: ["identificador_fiscal"] },
    ],
  },
);
