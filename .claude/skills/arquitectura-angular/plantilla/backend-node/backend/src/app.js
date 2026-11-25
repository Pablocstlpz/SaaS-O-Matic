//composicion de la API: seguridad, CORS, parsers, routers, 404 y errores
//aqui no hay logica de negocio; si una linea no es "montar algo", no va en este fichero
import express from "express";
import cors from "cors";
import helmet from "helmet";

import { FRONTEND_URL } from "./config.js";
import { ErrorHttp } from "./utils/errores.js";
import { logger } from "./utils/logger.js";
import { authRoutes } from "./routes/auth.route.js";
import { productosRoutes } from "./routes/productos.route.js";
//las relaciones entre modelos se registran por efecto secundario del import
import "./models/associations.js";

export const app = express();

//detras de un proxy (nginx, cloudflare...) sin esto el rate limit ve la IP del proxy
//y bloquea a todos los usuarios a la vez; 1 = un unico proxy delante
app.set("trust proxy", 1);

//la API solo sirve JSON: la CSP por defecto no aporta y rompe respuestas de error
app.use(helmet({ contentSecurityPolicy: false }));

//lista blanca de origenes; sin barra final para que "https://x.com/" y "https://x.com" coincidan
const sinBarraFinal = (url) => String(url).replace(/\/+$/, "");
const ORIGENES = [FRONTEND_URL, "http://localhost:4200"].filter(Boolean).map(sinBarraFinal);

app.use(
  cors({
    origin: (origen, responder) => {
      //sin Origin = curl, servidor a servidor o mismo origen
      if (!origen || ORIGENES.includes(sinBarraFinal(origen))) return responder(null, true);
      responder(new ErrorHttp(403, "Origen no permitido", "CORS"));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

//los webhooks que verifican firma necesitan el cuerpo en crudo: se montan AQUI, antes de express.json()
//app.post("/api/pagos/webhook", express.raw({ type: "application/json" }), webhookPagos);

//tope de tamano: sin el, un cuerpo de cientos de MB se lee entero en memoria
app.use(express.json({ limit: "100kb" }));

//cada router en su prefijo: un router.use(autenticar) dentro de uno no afecta a los demas
app.use("/api/auth", authRoutes);
app.use("/api/productos", productosRoutes);

app.get("/api/salud", (req, res) => {
  res.status(200).json({ estado: "ok" });
});

app.use((req, res) => {
  res.status(404).json({ message: "Ruta no encontrada" });
});

//manejador global. Con Express 5 un async que lanza llega aqui solo
//los ErrorHttp son errores esperados (404, 409...) y salen tal cual; todo lo demas es un 500 generico
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err instanceof ErrorHttp) {
    return res.status(err.status).json({ message: err.message, ...(err.tipo && { tipo: err.tipo }) });
  }
  //un indice unico de la BD rechazo la escritura. Los servicios comprueban antes (comprobarNombreLibre)
  //para dar un mensaje con el nombre, pero comprobar y luego insertar no es atomico: dos peticiones a la
  //vez pasan las dos la comprobacion. El indice es lo que lo impide de verdad, y esto convierte en 409
  //lo que si no seria un 500. Se mira error.name y no instanceof para no importar sequelize aqui
  if (err.name === "SequelizeUniqueConstraintError") {
    return res.status(409).json({ message: "Ya existe un registro con esos datos", tipo: "DUPLICADO" });
  }
  //JSON mal formado o cuerpo demasiado grande (los lanza express.json)
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ message: "El cuerpo de la petición no es un JSON válido" });
  }
  if (err.type === "entity.too.large") {
    return res.status(413).json({ message: "La petición es demasiado grande" });
  }
  logger.error(`${req.method} ${req.originalUrl}`, err);
  res.status(500).json({ message: "Error interno del servidor" });
});
