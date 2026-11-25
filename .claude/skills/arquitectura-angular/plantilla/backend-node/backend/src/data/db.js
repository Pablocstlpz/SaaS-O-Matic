//la conexion. Es lo unico que cambia si se cambia de motor de base de datos
import { Sequelize } from "sequelize";
import { DB } from "../config.js";

const comun = { logging: false };

export const sequelize =
  DB.dialecto === "sqlite"
    ? new Sequelize({ ...comun, dialect: "sqlite", storage: DB.almacen || ":memory:" })
    : new Sequelize(DB.nombre, DB.usuario, DB.password, {
        ...comun,
        host: DB.host,
        port: DB.puerto,
        dialect: DB.dialecto,
        //keep-alive: sin el, un router o un NAT cierra en silencio las conexiones ociosas del pool
        //y la siguiente consulta falla con "connection lost"
        dialectOptions: { enableKeepAlive: true, keepAliveInitialDelay: 10000 },
        pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
      });
