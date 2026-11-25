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
  // La rellena el set de nombre_empresa.
  nombre_busqueda: CreationOptional<string>;
  identificador_fiscal: string;
  email_contacto: string;
  pais: string;
  plan: (typeof PLANES)[number];
  fecha_creacion: CreationOptional<Date>;
}

// El LIKE de SQLite solo iguala mayúsculas y minúsculas inglesas: el nombre se compara en una
// copia en minúsculas, y el texto buscado pasa por aquí mismo. Su orden también es binario, así que
// la lista se ordena por la misma copia.
export const paraBuscar = (texto: string) => texto.toLowerCase();

export const Cliente = sequelize.define<ClienteModelo>(
  "Cliente",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre_empresa: {
      type: DataTypes.STRING(LIMITES.NOMBRE_EMPRESA_MAX),
      allowNull: false,
      set(nombre: string) {
        this.setDataValue("nombre_empresa", nombre);
        this.setDataValue("nombre_busqueda", paraBuscar(nombre));
      },
    },
    // Solo para buscar y ordenar. El get la deja fuera del JSON: el cliente de la API no la tiene.
    nombre_busqueda: { type: DataTypes.STRING, allowNull: false, get: () => undefined },
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
