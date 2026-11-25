// Arranque del proceso. app.ts solo compone la aplicación y la exporta,
// así las pruebas la levantan en un puerto libre sin tocar este fichero.
import { PORT, validarConfig } from "./config.js";
import { logger } from "./utils/logger.js";

const erroresConfig = validarConfig();
if (erroresConfig.length) {
  logger.error("config", erroresConfig.join("\n"));
  process.exit(1);
}

// Dinámicos: la BD no se abre hasta que la configuración está validada.
const { app } = await import("./app.js");
const { sequelize } = await import("./data/db.js");

// Antes de escuchar: sin base de datos la API respondería 500 a todo.
// sync() sin alter ni force: solo crea las tablas que faltan.
try {
  await sequelize.sync();
} catch (error) {
  logger.error("server", error);
  process.exit(1);
}

// Express 5 pasa al callback el error de escucha (puerto ocupado): sin mirarlo,
// el proceso diría "escuchando" y terminaría con código 0.
app.listen(PORT, (error) => {
  if (error) {
    logger.error("server", `No se puede escuchar en el puerto ${PORT}: ${error.message}`);
    process.exit(1);
  }
  logger.info("server", `API escuchando en http://localhost:${PORT}`);
});
