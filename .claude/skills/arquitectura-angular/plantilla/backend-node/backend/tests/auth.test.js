//sesion: login, renovar y /yo. Se conserva al borrar o renombrar el recurso de ejemplo
//ejecutar: npm test
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { levantarApi, cerrarApi, entrar, peticion, PASSWORD } from "./_api.js";

before(levantarApi);
after(cerrarApi);

test("login: devuelve tokens y el usuario sin el hash", async () => {
  const { status, cuerpo } = await peticion("POST", "/api/auth/login", {
    cuerpo: { email: "admin@una.test", password: PASSWORD },
  });
  assert.equal(status, 200);
  assert.ok(cuerpo.accessToken && cuerpo.refreshToken);
  assert.equal(cuerpo.usuario.password_hash, undefined);
});

test("login: contraseña mala es 401 con el mismo mensaje que un email inexistente", async () => {
  const mala = await peticion("POST", "/api/auth/login", { cuerpo: { email: "admin@una.test", password: "x" } });
  const nadie = await peticion("POST", "/api/auth/login", { cuerpo: { email: "nadie@una.test", password: "x" } });
  assert.equal(mala.status, 401);
  assert.equal(mala.cuerpo.message, nadie.cuerpo.message);
});

test("renovar: un refreshToken válido da tokens nuevos; uno falso, 401", async () => {
  const { refreshToken } = await entrar("admin@una.test");
  const bien = await peticion("POST", "/api/auth/renovar", { cuerpo: { refreshToken } });
  assert.equal(bien.status, 200);
  assert.ok(bien.cuerpo.accessToken);
  const mal = await peticion("POST", "/api/auth/renovar", { cuerpo: { refreshToken: "falso" } });
  assert.equal(mal.status, 401);
  assert.equal(mal.cuerpo.tipo, "SESION_CADUCADA");
});

test("sin token, una ruta protegida es 401", async () => {
  const { status } = await peticion("GET", "/api/auth/yo");
  assert.equal(status, 401);
});

test("yo: devuelve el usuario de la sesión sin el hash", async () => {
  const { accessToken } = await entrar("usuario@una.test");
  const { status, cuerpo } = await peticion("GET", "/api/auth/yo", { token: accessToken });
  assert.equal(status, 200);
  assert.equal(cuerpo.email, "usuario@una.test");
  assert.equal(cuerpo.rol, "usuario");
  assert.equal(cuerpo.password_hash, undefined);
});

test("login: un cuerpo vacío o con tipos imposibles es 400 en castellano", async () => {
  for (const cuerpo of [{}, { email: 5, password: 5 }]) {
    const res = await peticion("POST", "/api/auth/login", { cuerpo });
    assert.equal(res.status, 400);
    assert.equal(res.cuerpo.message, "El email es obligatorio");
    assert.doesNotMatch(JSON.stringify(res.cuerpo), /Invalid value/);
  }
});

//autenticar tiene que comprobar la firma, la caducidad y el secreto: un autenticar que dejara pasar
//cualquier token no lo detectaba ninguna otra prueba (todas usan tokens buenos)
test("sesión: un token falso, caducado o de refresco es 401 sin tipo", async () => {
  const { refreshToken } = await entrar("admin@una.test");
  const caducado = jwt.sign({ id: 1, rol: "admin", organizacion_id: 1 }, process.env.JWT_SECRETO, { expiresIn: -10 });
  for (const token of ["no-es-un-token", caducado, refreshToken]) {
    const { status, cuerpo } = await peticion("GET", "/api/auth/yo", { token });
    assert.equal(status, 401);
    assert.equal(cuerpo.tipo, undefined);
  }
});
