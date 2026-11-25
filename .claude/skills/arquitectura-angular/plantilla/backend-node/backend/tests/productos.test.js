//EJEMPLO de pruebas de un recurso, de punta a punta contra la app real (ver _api.js)
//por cada endpoint, como minimo: caso feliz, 400, 401, 403 y 404 de otra organizacion
//al copiar productos para un recurso nuevo, este fichero se copia con el; las de sesion estan en auth.test.js
//ejecutar: npm test
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { levantarApi, cerrarApi, entrar, peticion, organizaciones } from "./_api.js";

//dinamico, como en _api.js: el modelo abre la conexion y tiene que importarse con el entorno de pruebas ya puesto
const { Producto } = await import("../src/models/producto.model.js");

before(levantarApi);
after(cerrarApi);

const tokenDe = async (email) => (await entrar(email)).accessToken;

test("productos: sin token es 401", async () => {
  const { status } = await peticion("GET", "/api/productos");
  assert.equal(status, 401);
});

test("productos: crear, leer, actualizar y borrar", async () => {
  const token = await tokenDe("admin@una.test");

  const creado = await peticion("POST", "/api/productos", { token, cuerpo: { nombre: "Mesa", precio: 120.5 } });
  assert.equal(creado.status, 201);
  assert.equal(creado.cuerpo.precio, 120.5);
  assert.equal(creado.cuerpo.estado, "activo");

  const id = creado.cuerpo.id;
  const leido = await peticion("GET", `/api/productos/${id}`, { token });
  assert.equal(leido.cuerpo.nombre, "Mesa");

  const cambiado = await peticion("PUT", `/api/productos/${id}`, { token, cuerpo: { precio: 99 } });
  assert.equal(cambiado.status, 200);
  assert.equal(cambiado.cuerpo.precio, 99);
  assert.equal(cambiado.cuerpo.nombre, "Mesa", "un PUT parcial no borra lo que no llega");

  const borrado = await peticion("DELETE", `/api/productos/${id}`, { token });
  assert.equal(borrado.status, 200);
  const otraVez = await peticion("GET", `/api/productos/${id}`, { token });
  assert.equal(otraVez.status, 404);
});

test("productos: entrada mal formada es 400 con message y errors", async () => {
  const token = await tokenDe("admin@una.test");
  const { status, cuerpo } = await peticion("POST", "/api/productos", { token, cuerpo: { precio: -1 } });
  assert.equal(status, 400);
  assert.equal(typeof cuerpo.message, "string");
  assert.ok(Array.isArray(cuerpo.errors));
});

test("productos: un tipo imposible es 400 en castellano, un error por campo y con { campo, mensaje }", async () => {
  const token = await tokenDe("admin@una.test");
  const { status, cuerpo } = await peticion("POST", "/api/productos", { token, cuerpo: { nombre: 5, precio: "abc" } });
  assert.equal(status, 400);
  assert.deepEqual(
    cuerpo.errors.map((e) => e.campo),
    ["nombre", "precio"],
  );
  assert.equal(cuerpo.errors[0].mensaje, "El nombre tiene que ser un texto");
  assert.equal(cuerpo.message, cuerpo.errors[0].mensaje);
  assert.doesNotMatch(JSON.stringify(cuerpo), /Invalid value/);
});

test("productos: actualizar con el nombre en blanco es 400 y no cambia nada", async () => {
  const token = await tokenDe("admin@una.test");
  const { cuerpo: creado } = await peticion("POST", "/api/productos", {
    token,
    cuerpo: { nombre: "Lámpara", precio: 15 },
  });

  const { status, cuerpo } = await peticion("PUT", `/api/productos/${creado.id}`, { token, cuerpo: { nombre: "   " } });
  assert.equal(status, 400);
  assert.equal(cuerpo.message, "El nombre es obligatorio");
  const leido = await peticion("GET", `/api/productos/${creado.id}`, { token });
  assert.equal(leido.cuerpo.nombre, "Lámpara");
});

test("productos: nombre repetido en la misma organización es 409 NOMBRE_REPETIDO", async () => {
  const token = await tokenDe("admin@una.test");
  await peticion("POST", "/api/productos", { token, cuerpo: { nombre: "Silla", precio: 30 } });
  const { status, cuerpo } = await peticion("POST", "/api/productos", {
    token,
    cuerpo: { nombre: "Silla", precio: 31 },
  });
  assert.equal(status, 409);
  assert.equal(cuerpo.tipo, "NOMBRE_REPETIDO");
});

test("productos: la BD rechaza el mismo nombre en la misma organización aunque se salte el servicio", async () => {
  const { una, otra } = organizaciones;
  await Producto.create({ organizacion_id: una.id, nombre: "Taburete", precio: 20 });
  await assert.rejects(Producto.create({ organizacion_id: una.id, nombre: "Taburete", precio: 21 }), {
    name: "SequelizeUniqueConstraintError",
  });
  //el indice es por organizacion: otra puede tener su propio "Taburete"
  const deOtra = await Producto.create({ organizacion_id: otra.id, nombre: "Taburete", precio: 22 });
  //se borra para que la prueba de aislamiento siga viendo vacia la lista de la otra organizacion
  await deOtra.destroy();
});

test("productos: si dos altas a la vez pasan la comprobación, la segunda es 409 DUPLICADO y no 500", async (t) => {
  const token = await tokenDe("admin@una.test");
  await peticion("POST", "/api/productos", { token, cuerpo: { nombre: "Estantería", precio: 80 } });
  //la carrera, sin depender de la suerte: la comprobacion del servicio no ve al primero,
  //como le pasa a la segunda de dos peticiones simultaneas. Solo queda el indice unico
  t.mock.method(Producto, "findOne", async () => null);

  const { status, cuerpo } = await peticion("POST", "/api/productos", {
    token,
    cuerpo: { nombre: "Estantería", precio: 81 },
  });
  assert.equal(status, 409);
  assert.deepEqual(cuerpo, { message: "Ya existe un registro con esos datos", tipo: "DUPLICADO" });
});

//crear, cambiar y borrar: cada ruta de escritura lleva su propio autorizar() y cada una se prueba,
//o quitar el permiso de una sola (p. ej. borrar) no pondria nada en rojo
test("productos: un rol sin permiso no crea, no cambia ni borra (403) pero sí lee", async () => {
  const { cuerpo: existente } = await peticion("POST", "/api/productos", {
    token: await tokenDe("admin@una.test"),
    cuerpo: { nombre: "Banco", precio: 10 },
  });
  const token = await tokenDe("usuario@una.test");
  const crear = await peticion("POST", "/api/productos", { token, cuerpo: { nombre: "Taburete", precio: 10 } });
  const cambiar = await peticion("PUT", `/api/productos/${existente.id}`, { token, cuerpo: { precio: 1 } });
  const borrar = await peticion("DELETE", `/api/productos/${existente.id}`, { token });
  assert.deepEqual([crear.status, cambiar.status, borrar.status], [403, 403, 403]);
  const leer = await peticion("GET", "/api/productos", { token });
  assert.equal(leer.status, 200);
});

test("productos: otra organización no ve, no cambia y no borra (404, no 403)", async () => {
  const tokenUna = await tokenDe("admin@una.test");
  const tokenOtra = await tokenDe("admin@otra.test");
  const { cuerpo: ajeno } = await peticion("POST", "/api/productos", {
    token: tokenUna,
    cuerpo: { nombre: "Armario", precio: 300 },
  });

  for (const [metodo, cuerpo] of [["GET"], ["PUT", { precio: 1 }], ["DELETE"]]) {
    const { status } = await peticion(metodo, `/api/productos/${ajeno.id}`, { token: tokenOtra, cuerpo });
    assert.equal(status, 404, `${metodo} de otra organización`);
  }
  const lista = await peticion("GET", "/api/productos", { token: tokenOtra });
  assert.deepEqual(lista.cuerpo, [], "una lista vacía es 200 []");
});

test("errores: id no numérico es 400, ruta inexistente 404, JSON roto 400", async () => {
  const token = await tokenDe("admin@una.test");
  assert.equal((await peticion("GET", "/api/productos/abc", { token })).status, 400);
  assert.equal((await peticion("GET", "/api/no-existe", { token })).status, 404);
  assert.equal((await peticion("POST", "/api/productos", { token, crudo: "{no es json" })).status, 400);
});

test("errores: un cuerpo JSON mal formado es 400 con el mensaje en castellano", async () => {
  const token = await tokenDe("admin@una.test");
  const { status, cuerpo } = await peticion("POST", "/api/productos", { token, crudo: '{"nombre": "Mesa",' });
  assert.equal(status, 400);
  assert.deepEqual(cuerpo, { message: "El cuerpo de la petición no es un JSON válido" });
});
