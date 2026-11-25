//config.js: lo que pasa ANTES de levantar nada. Se ejecuta en un proceso aparte porque validarConfig()
//termina el proceso con process.exit(1)
//ejecutar: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

const validarCon = (variables) =>
  spawnSync(process.execPath, ["--input-type=module", "-e", 'import("./src/config.js").then((c) => c.validarConfig())'], {
    env: { PATH: process.env.PATH, DB_DIALECTO: "sqlite", FRONTEND_URL: "http://localhost:4200", ...variables },
    encoding: "utf8",
  });

test("config: no arranca con los secretos de ejemplo de .env.example", () => {
  const { status, stderr } = validarCon({
    JWT_SECRETO: "reemplaza-con-una-cadena-aleatoria-larga",
    JWT_SECRETO_REFRESCO: "otro-secreto-de-verdad",
  });
  assert.equal(status, 1);
  assert.match(stderr, /valor de ejemplo/);
});

test("config: con secretos de verdad, validarConfig() no corta el arranque", () => {
  const { status } = validarCon({ JWT_SECRETO: "uno-de-verdad", JWT_SECRETO_REFRESCO: "otro-de-verdad" });
  assert.equal(status, 0);
});
