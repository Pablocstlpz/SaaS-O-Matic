//lo comun a todas las pruebas: la app real en un puerto libre, con SQLite en memoria y datos sembrados
//no es un fichero de pruebas (node --test solo coge *.test.js): cada *.test.js lo importa
//y corre en su propio proceso, asi que cada fichero tiene su BD y su limite de logins
//
//uso en un fichero de pruebas:
//  import { levantarApi, cerrarApi, entrar, peticion } from "./_api.js";
//  before(levantarApi);
//  after(cerrarApi);

//las variables van ANTES de importar la app: config.js las lee al cargarse
process.env.NODE_ENV = "test";
process.env.DB_DIALECTO = "sqlite";
process.env.DB_ALMACEN = ":memory:";
process.env.FRONTEND_URL = "http://localhost:4200";
process.env.JWT_SECRETO = "secreto-de-pruebas";
process.env.JWT_SECRETO_REFRESCO = "otro-secreto-de-pruebas";

//dinamicos y no estaticos: un import estatico se evaluaria antes de las lineas de arriba
const { app } = await import("../src/app.js");
const { sequelize } = await import("../src/data/db.js");
const { migrar } = await import("../src/data/migraciones.js");
const { Organizacion } = await import("../src/models/organizacion.model.js");
const { Usuario } = await import("../src/models/usuario.model.js");
const { hashearPassword } = await import("../src/utils/seguridad.js");

//los ficheros de pruebas los toman de aqui para no repetir el orden de arriba
export { sequelize, migrar };

export const PASSWORD = "Contrasena1!";

let servidor;
let base;
//se rellenan al levantar: las pruebas que usan el modelo directamente necesitan sus id
export const organizaciones = {};

//migrar() y no sync({ force: true }): asi las pruebas arrancan la BD igual que server.js
export const levantarApi = async () => {
  await migrar();
  const hash = await hashearPassword(PASSWORD);
  const [una, otra] = await Organizacion.bulkCreate([{ nombre: "Una" }, { nombre: "Otra" }]);
  Object.assign(organizaciones, { una, otra });
  await Usuario.bulkCreate([
    { organizacion_id: una.id, nombre: "Admin", email: "admin@una.test", password_hash: hash, rol: "admin" },
    { organizacion_id: una.id, nombre: "Usuario", email: "usuario@una.test", password_hash: hash, rol: "usuario" },
    { organizacion_id: otra.id, nombre: "Admin otra", email: "admin@otra.test", password_hash: hash, rol: "admin" },
  ]);
  servidor = app.listen(0);
  base = `http://localhost:${servidor.address().port}`;
};

export const cerrarApi = async () => {
  servidor.close();
  await sequelize.close();
};

//crudo: el cuerpo se envia tal cual, para probar lo que no es JSON
export const peticion = async (metodo, ruta, { token, cuerpo, crudo } = {}) => {
  const respuesta = await fetch(base + ruta, {
    method: metodo,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: crudo ?? (cuerpo === undefined ? undefined : JSON.stringify(cuerpo)),
  });
  const texto = await respuesta.text();
  return { status: respuesta.status, cuerpo: texto ? JSON.parse(texto) : null };
};

//-> { accessToken, refreshToken }. Se entra UNA vez por usuario y fichero y se reutiliza: el login tiene
//rate limit (20 intentos / 15 min por IP) y un fichero con muchas pruebas acabaria en 429.
//Las pruebas del propio login llaman a peticion() directamente, sin pasar por aqui
const sesiones = new Map();
export const entrar = async (email, password = PASSWORD) => {
  const clave = `${email}\n${password}`;
  if (!sesiones.has(clave)) {
    const { status, cuerpo } = await peticion("POST", "/api/auth/login", { cuerpo: { email, password } });
    if (status !== 200) throw new Error(`No se ha podido entrar como ${email}: ${status} ${cuerpo?.message}`);
    sesiones.set(clave, { accessToken: cuerpo.accessToken, refreshToken: cuerpo.refreshToken });
  }
  return sesiones.get(clave);
};
