//UNICO fichero que lee process.env. El resto del backend importa de aqui
//asi una variable mal escrita falla en un solo sitio y no en mitad de una peticion
import { config } from "dotenv";

config({ quiet: true });

const env = process.env;

export const ENTORNO = env.NODE_ENV || "development";
export const PORT = Number(env.PORT) || 3000;
export const FRONTEND_URL = env.FRONTEND_URL;

export const JWT_SECRETO = env.JWT_SECRETO;
//secreto distinto para el refresco: si se filtra uno, el otro sigue valiendo
export const JWT_SECRETO_REFRESCO = env.JWT_SECRETO_REFRESCO;

export const DB = {
  dialecto: env.DB_DIALECTO || "mysql",
  host: env.DB_HOST,
  puerto: Number(env.DB_PUERTO) || 3306,
  usuario: env.DB_USUARIO,
  password: env.DB_PASSWORD,
  nombre: env.DB_NOMBRE,
  //solo para sqlite (tests y prototipos): ruta del fichero o ":memory:"
  almacen: env.DB_ALMACEN,
};

const REQUERIDAS = ["FRONTEND_URL", "JWT_SECRETO", "JWT_SECRETO_REFRESCO"];
const REQUERIDAS_DB = ["DB_HOST", "DB_USUARIO", "DB_PASSWORD", "DB_NOMBRE"];

//si falta algo critico el proceso muere al arrancar con un mensaje que dice que y donde
//levantar la API a medias es peor: falla en la primera peticion real y nadie sabe por que
export const validarConfig = () => {
  const requeridas = DB.dialecto === "sqlite" ? REQUERIDAS : [...REQUERIDAS, ...REQUERIDAS_DB];
  const faltan = requeridas.filter((nombre) => !env[nombre]);
  if (faltan.length) {
    console.error(
      `[config] Faltan variables de entorno: ${faltan.join(", ")}\n` +
        "Copia .env.example a .env (raíz con docker compose, backend/.env en local).",
    );
    process.exit(1);
  }
  //los valores de ejemplo de .env.example son publicos (estan en el repositorio): con ellos cualquiera
  //podria firmar tokens validos, asi que la API no arranca con ellos
  const deEjemplo = ["JWT_SECRETO", "JWT_SECRETO_REFRESCO"].filter((nombre) => env[nombre]?.startsWith("reemplaza-"));
  if (deEjemplo.length) {
    console.error(
      `[config] ${deEjemplo.join(", ")} tiene el valor de ejemplo de .env.example. ` +
        "Genera cada uno con: openssl rand -hex 64",
    );
    process.exit(1);
  }
};
