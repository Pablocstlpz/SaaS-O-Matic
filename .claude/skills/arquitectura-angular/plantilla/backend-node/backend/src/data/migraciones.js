//el esquema de la BD en todos los entornos: sync() crea lo que falta y los .sql cambian lo que ya existe
//(el orden en una BD con datos, dentro de migrar())
//sync() solo NUNCA basta en una BD con datos: no anade columnas a una tabla existente (ver migraciones/LEEME.md)
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { DataTypes } from "sequelize";
import { sequelize } from "./db.js";
import { logger } from "../utils/logger.js";
//sync() solo crea los modelos que se hayan importado: sin esto, un script que llame a migrar()
//antes de importar un modelo dejaria su tabla sin crear
import "../models/associations.js";

const DIRECTORIO = fileURLToPath(new URL("../../migraciones/", import.meta.url));

//registro de lo aplicado: el nombre del fichero es la clave, por eso una migracion aplicada no se renombra
const Migracion = sequelize.define(
  "Migracion",
  {
    nombre: { type: DataTypes.STRING(255), primaryKey: true },
    fecha: { type: DataTypes.DATE, allowNull: false },
  },
  { tableName: "migraciones", timestamps: false },
);

//";" a final de linea separa sentencias; un ";" dentro de un texto a mitad de linea no corta nada
//las lineas que son solo un comentario "--" se quitan: MySQL rechaza una sentencia vacia
const sentenciasDe = (sql) =>
  sql
    .split(/;[ \t]*$/m)
    .map((trozo) =>
      trozo
        .split("\n")
        .filter((linea) => !linea.trim().startsWith("--"))
        .join("\n")
        .trim(),
    )
    .filter(Boolean);

export const migrar = async ({ directorio = DIRECTORIO } = {}) => {
  const qi = sequelize.getQueryInterface();
  const existentes = new Set((await qi.showAllTables()).map((t) => (typeof t === "string" ? t : t.tableName)));

  //BD vacia = sync() crea las tablas con el modelo de HOY, que ya incluye lo que hacen las migraciones:
  //ejecutarlas despues fallaria ("la columna ya existe"), asi que se apuntan como aplicadas sin ejecutarlas
  const bdNueva = existentes.size === 0;

  //en una BD con datos el orden importa, y por eso no es un sync() y ya:
  //1. solo las tablas que FALTAN (en orden de claves ajenas): una migracion puede querer rellenar una tabla nueva
  //2. los .sql pendientes: anaden columnas a las tablas que ya existian
  //3. sync() completo: crea los indices con nombre que falten, que ya encuentran sus columnas
  //   (un sync() antes de migrar intentaria indexar una columna que todavia no existe y pararia el arranque)
  if (bdNueva) {
    await sequelize.sync();
  } else {
    const nuevos = [];
    sequelize.modelManager.forEachModel((modelo) => {
      if (!existentes.has(modelo.getTableName())) nuevos.push(modelo);
    });
    for (const modelo of nuevos) await modelo.sync();
  }

  const aplicadas = new Set((await Migracion.findAll()).map((m) => m.nombre));
  //orden por nombre: por eso se numeran 001, 002... y no 1, 2, 10 (que iria antes que 2)
  const pendientes = (await readdir(directorio))
    .filter((fichero) => fichero.endsWith(".sql") && !aplicadas.has(fichero))
    .sort();

  for (const fichero of pendientes) {
    if (bdNueva) {
      logger.info("migraciones", `${fichero}: BD nueva, las tablas ya nacen con este cambio; se apunta sin ejecutarla`);
    } else {
      logger.info("migraciones", `Aplicando ${fichero}`);
      for (const sentencia of sentenciasDe(await readFile(join(directorio, fichero), "utf8"))) {
        await sequelize.query(sentencia);
      }
    }
    //se apunta al TERMINAR el fichero: si una sentencia falla, el arranque se para y el fichero sigue pendiente
    await Migracion.create({ nombre: fichero, fecha: new Date() });
  }

  //sin alter: crea los indices con nombre que falten, nunca cambia ni borra columnas
  if (!bdNueva) await sequelize.sync();
};
