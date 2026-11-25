//arranque del proceso. app.js solo compone la aplicacion y la exporta,
//asi los tests pueden importarla y levantarla en un puerto libre sin tocar este fichero
import { validarConfig, PORT } from "./config.js";

//los import estaticos se evaluan ANTES que cualquier linea del modulo,
//por eso app.js (que abre la conexion a la BD) se importa despues de validar
validarConfig();
const { app } = await import("./app.js");
const { sequelize } = await import("./data/db.js");
const { migrar } = await import("./data/migraciones.js");
const { logger } = await import("./utils/logger.js");

//compruebo la BD ANTES de escuchar: si no hay conexion, el proceso muere con un mensaje claro
//(y Docker lo reinicia) en vez de levantar una API que responde 500 a todo
try {
  await sequelize.authenticate();
} catch (error) {
  logger.error("server", `No se puede conectar con la base de datos: ${error.message}`);
  process.exit(1);
}

//en TODOS los entornos: si produccion no migra, la primera instalacion arranca sin tablas
//y un despliegue con un campo nuevo arranca y falla en la primera consulta
try {
  await migrar();
} catch (error) {
  logger.error("server", `No se han podido aplicar las migraciones: ${error.message}`);
  process.exit(1);
}

//Express 5 pasa al callback el error de escucha (puerto ocupado, sin permiso): sin mirarlo, el proceso
//diria "escuchando" y terminaria con codigo 0, y Docker no sabria que algo va mal
app.listen(PORT, (error) => {
  if (error) {
    logger.error("server", `No se puede escuchar en el puerto ${PORT}: ${error.message}`);
    process.exit(1);
  }
  logger.info("server", `API escuchando en http://localhost:${PORT}`);
});
