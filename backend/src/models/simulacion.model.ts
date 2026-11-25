// Simulación (spec §2): la foto de un presupuesto. Guarda el % aplicado y los importes de ese día,
// en céntimos enteros, y no se edita. El desglose por tramos no se guarda.
import {
  DataTypes,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
  type Model,
} from "sequelize";

import { sequelize } from "../data/db.js";

export interface SimulacionModelo
  extends Model<InferAttributes<SimulacionModelo>, InferCreationAttributes<SimulacionModelo>> {
  id: CreationOptional<number>;
  cliente_id: number;
  usuarios: number;
  almacenamiento_gb: number;
  llamadas_api: number;
  coste_base_centimos: number;
  porcentaje_impuesto: number;
  impuesto_centimos: number;
  total_centimos: number;
  fecha_creacion: CreationOptional<Date>;
}

// Una definición nueva por columna: Sequelize escribe en el objeto que recibe.
const enteroObligatorio = () => ({ type: DataTypes.INTEGER, allowNull: false });

export const Simulacion = sequelize.define<SimulacionModelo>(
  "Simulacion",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    // La relación con el cliente está en associations.ts.
    cliente_id: enteroObligatorio(),
    usuarios: enteroObligatorio(),
    almacenamiento_gb: enteroObligatorio(),
    llamadas_api: enteroObligatorio(),
    coste_base_centimos: enteroObligatorio(),
    porcentaje_impuesto: enteroObligatorio(),
    impuesto_centimos: enteroObligatorio(),
    total_centimos: enteroObligatorio(),
    // La rellena Sequelize (createdAt, abajo).
    fecha_creacion: DataTypes.DATE,
  },
  { tableName: "simulaciones", createdAt: "fecha_creacion", updatedAt: false },
);
