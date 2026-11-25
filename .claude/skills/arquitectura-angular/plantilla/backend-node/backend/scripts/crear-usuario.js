//crea un usuario (y su organizacion si no existe) desde la consola: el primer admin de una instalacion
//nueva, o usuarios normales mientras no haya pantalla de alta
//uso: node scripts/crear-usuario.js <rol> "<Organización>" <email> <contraseña>
//     npm run crear-admin   -- "Mi empresa" yo@correo.com 'Contraseña1!'
//     npm run crear-usuario -- "Mi empresa" otra@correo.com 'Contraseña1!'
import { validarConfig } from "../src/config.js";

validarConfig();
const { validationResult } = await import("express-validator");
const { sequelize } = await import("../src/data/db.js");
const { migrar } = await import("../src/data/migraciones.js");
const { Organizacion } = await import("../src/models/organizacion.model.js");
const { Usuario } = await import("../src/models/usuario.model.js");
const { hashearPassword } = await import("../src/utils/seguridad.js");
const { REGEX_PASSWORD_FUERTE, ROLES, LIMITES } = await import("../src/utils/regex.js");
const { reglaEmail } = await import("../src/validators/auth.validator.js");

const fallar = (mensaje) => {
  console.error(mensaje);
  process.exit(1);
};

const argumentos = process.argv.slice(2);
const [rol, nombreOrganizacion = "", emailEscrito, password] = argumentos;
if (argumentos.length !== 4) {
  fallar(
    'Uso: node scripts/crear-usuario.js <rol> "<Organización>" <email> <contraseña>\n' +
      `     roles: ${ROLES.join(", ")}\n` +
      "     npm run crear-admin -- \"Mi empresa\" yo@correo.com 'Contraseña1!'",
  );
}
if (!ROLES.includes(rol)) {
  fallar(`El rol «${rol}» no existe. Roles válidos: ${ROLES.join(", ")}`);
}
const organizacionNombre = nombreOrganizacion.trim();
if (!organizacionNombre || organizacionNombre.length > LIMITES.NOMBRE_MAX) {
  fallar(`El nombre de la organización es obligatorio y no puede superar ${LIMITES.NOMBRE_MAX} caracteres`);
}

//la misma regla que el login, con su normalizacion: el email se guarda como el login lo va a buscar
const peticion = { body: { email: emailEscrito } };
await reglaEmail.run(peticion);
const errorEmail = validationResult(peticion).array()[0];
if (errorEmail) fallar(errorEmail.msg);
const email = peticion.body.email;

if (!REGEX_PASSWORD_FUERTE.test(password)) {
  fallar(`La contraseña necesita al menos ${LIMITES.PASSWORD_MIN} caracteres, una mayúscula, un número y un símbolo`);
}

//el script puede ser lo primero que toca una BD recien creada: sin tablas no hay donde guardar nada
await migrar();

if (await Usuario.findOne({ where: { email } })) {
  await sequelize.close();
  fallar(`Ya existe un usuario con el email ${email}. No se ha creado nada.`);
}

let organizacion = await Organizacion.findOne({ where: { nombre: organizacionNombre } });
const organizacionNueva = !organizacion;
if (organizacionNueva) organizacion = await Organizacion.create({ nombre: organizacionNombre });

const usuario = await Usuario.create({
  organizacion_id: organizacion.id,
  nombre: rol === "admin" ? "Administrador" : "Usuario",
  email,
  password_hash: await hashearPassword(password),
  rol,
});
console.log(
  `Creado ${usuario.email} (${rol}) en «${organizacion.nombre}»` +
    (organizacionNueva ? " (organización nueva)" : " (organización existente)"),
);
await sequelize.close();
