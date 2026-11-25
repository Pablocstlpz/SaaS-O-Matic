//migrar(): lo que hace server.js en cada arranque. Sin la app levantada: solo la BD en memoria
//ejecutar: npm test
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DataTypes } from "sequelize";
import { sequelize, migrar } from "./_api.js";

const directorios = [];
const directorioCon = async (ficheros) => {
  const directorio = await mkdtemp(join(tmpdir(), "migraciones-"));
  directorios.push(directorio);
  for (const [nombre, sql] of Object.entries(ficheros)) await writeFile(join(directorio, nombre), sql);
  return directorio;
};

after(async () => {
  await sequelize.close();
  for (const directorio of directorios) await rm(directorio, { recursive: true, force: true });
});

const aplicadas = async () =>
  (await sequelize.query("SELECT nombre FROM migraciones ORDER BY nombre", { type: "SELECT" })).map((m) => m.nombre);

//esta va PRIMERO: necesita la BD todavia vacia
test("migrar: en una BD vacía crea las tablas y apunta las migraciones sin ejecutarlas", async () => {
  //si se ejecutara, fallaria: sync() ya crea usuarios con la columna email
  const directorio = await directorioCon({
    "001-email-en-usuarios.sql": "ALTER TABLE usuarios ADD COLUMN email TEXT;\n",
  });
  await migrar({ directorio });
  const tablas = await sequelize.getQueryInterface().showAllTables();
  assert.ok(tablas.includes("organizaciones") && tablas.includes("usuarios"));
  assert.deepEqual(await aplicadas(), ["001-email-en-usuarios.sql"]);
});

test("migrar: aplica una vez cada .sql pendiente, en orden, y no lo repite al arrancar otra vez", async () => {
  //la BD ya tiene tablas (la prueba de arriba o este sync): estos ficheros SI se ejecutan
  await sequelize.sync();
  const directorio = await directorioCon({
    //el 002 va primero en el objeto: el orden lo pone el nombre, no el orden en que se escriben
    "002-rellenar.sql":
      "-- dos sentencias en un fichero\n" +
      "INSERT INTO prueba_migracion (id) VALUES (1);\n" +
      "INSERT INTO prueba_migracion (id) VALUES (2);\n",
    "001-crear.sql": "CREATE TABLE prueba_migracion (id INTEGER PRIMARY KEY);\n",
    "LEEME.md": "no es una migración",
  });

  await migrar({ directorio });
  //la segunda vez fallaria (CREATE TABLE repetido, id repetido) si volviera a ejecutarlas
  await migrar({ directorio });

  //que 002 inserte sin error ya prueba el orden: la tabla la crea 001
  const filas = await sequelize.query("SELECT id FROM prueba_migracion ORDER BY id", { type: "SELECT" });
  assert.deepEqual(
    filas.map((f) => f.id),
    [1, 2],
  );
  const lista = await aplicadas();
  assert.ok(lista.includes("001-crear.sql") && lista.includes("002-rellenar.sql"));
  assert.ok(!lista.includes("LEEME.md"), "solo cuentan los .sql");
});

//el caso de añadir una columna con índice a una tabla con datos: si sync() fuera antes que la migración,
//intentaría crear el índice sobre una columna que aún no existe y el arranque se pararía.
//Y una tabla nueva tiene que existir ANTES de las migraciones, por si una la rellena
test("migrar: columna nueva con índice en el modelo y tabla nueva que rellena una migración", async () => {
  await sequelize.sync();
  await sequelize.query("CREATE TABLE prueba_articulos (id INTEGER PRIMARY KEY, nombre TEXT)");
  await sequelize.query("INSERT INTO prueba_articulos (id, nombre) VALUES (1, 'viejo')");
  //el modelo de HOY: con la columna nueva y su índice, y una tabla que aún no existe
  sequelize.define(
    "PruebaArticulo",
    { id: { type: DataTypes.INTEGER, primaryKey: true }, nombre: DataTypes.TEXT, familia_id: DataTypes.INTEGER },
    { tableName: "prueba_articulos", timestamps: false, indexes: [{ name: "prueba_articulos_familia", fields: ["familia_id"] }] },
  );
  sequelize.define("PruebaFamilia", { id: { type: DataTypes.INTEGER, primaryKey: true }, nombre: DataTypes.TEXT }, {
    tableName: "prueba_familias",
    timestamps: false,
  });
  const directorio = await directorioCon({
    "001-familia.sql":
      "INSERT INTO prueba_familias (id, nombre) VALUES (1, 'General');\n" +
      "ALTER TABLE prueba_articulos ADD COLUMN familia_id INTEGER NULL;\n" +
      "UPDATE prueba_articulos SET familia_id = 1;\n",
  });

  await migrar({ directorio });

  const [fila] = await sequelize.query("SELECT familia_id FROM prueba_articulos WHERE id = 1", { type: "SELECT" });
  assert.equal(fila.familia_id, 1);
  const indices = await sequelize.getQueryInterface().showIndex("prueba_articulos");
  assert.ok(indices.some((i) => i.name === "prueba_articulos_familia"), "el índice se crea después de la columna");
});
