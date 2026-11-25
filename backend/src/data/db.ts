// La conexión. Es lo único que cambia si se cambia de motor de base de datos.
// Fichero en desarrollo y ":memory:" en las pruebas (vitest.config.ts).
import { Sequelize } from "sequelize";

import { DB_ALMACEN } from "../config.js";

export const sequelize = new Sequelize({ dialect: "sqlite", storage: DB_ALMACEN, logging: false });
