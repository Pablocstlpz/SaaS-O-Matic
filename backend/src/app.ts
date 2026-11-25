// Composición de la API: seguridad, CORS, JSON, rutas, 404 y errores.
// Aquí no hay lógica de negocio; si una línea no es "montar algo", no va en este fichero.
import cors from "cors";
import express, { type ErrorRequestHandler } from "express";
import helmet from "helmet";

import { FRONTEND_URL } from "./config.js";
import { simulacionesRoutes } from "./routes/simulaciones.route.js";
import { ErrorHttp, noEncontrado } from "./utils/errores.js";
import { logger } from "./utils/logger.js";

export const app = express();

// La API solo sirve JSON: la CSP por defecto no aporta nada.
app.use(helmet({ contentSecurityPolicy: false }));

app.use(
  cors({
    origin: (origen, responder) => {
      // Sin Origin: curl, servidor a servidor o mismo origen.
      if (!origen || origen === FRONTEND_URL) return responder(null, true);
      responder(new ErrorHttp(403, "Origen no permitido", "CORS"));
    },
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  }),
);

// Tope de tamaño: sin él, un cuerpo enorme se lee entero en memoria.
app.use(express.json({ limit: "100kb" }));

app.get("/salud", (_req, res) => {
  res.status(200).json({ estado: "ok" });
});

app.use("/simulations", simulacionesRoutes);

app.use(() => {
  throw noEncontrado("Ruta no encontrada");
});

// Convierte en ErrorHttp los errores esperados que no lanza nuestro código; null = inesperado.
const traducirError = (err: unknown): ErrorHttp | null => {
  if (err instanceof ErrorHttp) return err;
  if (!(err instanceof Error)) return null;
  // Un índice único frenó una escritura: comprobar y luego insertar no es atómico.
  // Se mira el nombre y no instanceof para no importar sequelize aquí.
  if (err.name === "SequelizeUniqueConstraintError") {
    return new ErrorHttp(409, "Ya existe un registro con esos datos", "DUPLICADO");
  }
  // express.json() marca sus errores con la propiedad type.
  const type = "type" in err ? err.type : undefined;
  if (type === "entity.parse.failed") {
    return new ErrorHttp(400, "El cuerpo de la petición no es un JSON válido", "VALIDACION");
  }
  if (type === "charset.unsupported" || type === "encoding.unsupported") {
    return new ErrorHttp(400, "No se puede leer el cuerpo de la petición", "VALIDACION");
  }
  if (type === "entity.too.large") {
    return new ErrorHttp(413, "La petición es demasiado grande", "DEMASIADO_GRANDE");
  }
  return null;
};

// Manejador global. Con Express 5, un async que lanza llega aquí solo.
// Los cuatro parámetros son obligatorios: así reconoce Express que es de errores.
const manejarErrores: ErrorRequestHandler = (err: unknown, req, res, _next) => {
  let error = traducirError(err);
  if (!error) {
    // El detalle va al log y nunca a la respuesta.
    logger.error(`${req.method} ${req.originalUrl}`, err);
    error = new ErrorHttp(500, "Error interno del servidor", "ERROR_INTERNO");
  }
  res.status(error.status).json({ message: error.message, tipo: error.tipo, errors: error.errors });
};

app.use(manejarErrores);
