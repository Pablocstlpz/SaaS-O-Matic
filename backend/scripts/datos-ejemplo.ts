// Datos de ejemplo (spec §9): un cliente por país, con 2 o 3 simulaciones cada uno.
// Uso: npm run datos-ejemplo. Escribe con los modelos, sin pasar por la API: los datos de abajo
// van ya limpios, como los dejaría el validador.
import { fileURLToPath } from "node:url";

import { sequelize } from "../src/data/db.js";
// Antes del sync(): sin las relaciones, la tabla de simulaciones se crearía sin clave ajena.
import "../src/models/associations.js";
import { Cliente } from "../src/models/cliente.model.js";
import { Simulacion } from "../src/models/simulacion.model.js";
import { calcularPrecio } from "../src/services/precios.service.js";
import { logger } from "../src/utils/logger.js";

// Solo la entrada de cada simulación: los importes los pone el servicio de precios.
const uso = (usuarios: number, almacenamiento_gb: number, llamadas_api: number) => ({
  usuarios,
  almacenamiento_gb,
  llamadas_api,
});

// Empresas inventadas. Los identificadores son válidos para su país.
const EJEMPLOS = [
  {
    cliente: {
      nombre_empresa: "Ejemplo Ibérica SL",
      identificador_fiscal: "B12345674",
      email_contacto: "compras@iberica.example",
      pais: "ES",
      plan: "pro",
    },
    usos: [uso(8, 50, 10_000), uso(15, 100, 50_000), uso(60, 500, 250_000)],
  },
  {
    cliente: {
      nombre_empresa: "Exemple Lumière SAS",
      identificador_fiscal: "FR12345678901",
      email_contacto: "achats@lumiere.example",
      pais: "FR",
      plan: "free",
    },
    usos: [uso(3, 5, 1_000), uso(10, 20, 5_000)],
  },
  {
    cliente: {
      nombre_empresa: "Example Harbour Ltd",
      identificador_fiscal: "GB123456789",
      email_contacto: "purchasing@harbour.example",
      pais: "GB",
      plan: "max",
    },
    usos: [uso(120, 2_000, 1_000_000), uso(250, 5_000, 3_000_000)],
  },
  {
    cliente: {
      nombre_empresa: "Esempio Colline SRL",
      identificador_fiscal: "IT12345678901",
      email_contacto: "acquisti@colline.example",
      pais: "IT",
      plan: "pro",
    },
    usos: [uso(11, 40, 20_000), uso(25, 80, 60_000), uso(50, 200, 150_000)],
  },
  {
    cliente: {
      nombre_empresa: "Beispiel Werke GmbH",
      identificador_fiscal: "DE123456789",
      email_contacto: "einkauf@werke.example",
      pais: "DE",
      plan: "max",
    },
    usos: [uso(51, 300, 100_000), uso(100, 800, 400_000)],
  },
] as const;

const crearSimulacion = (cliente_id: number, pais: string, entrada: ReturnType<typeof uso>) => {
  const precio = calcularPrecio(entrada.usuarios, pais);
  return Simulacion.create({
    cliente_id,
    ...entrada,
    coste_base_centimos: precio.coste_base_centimos,
    porcentaje_impuesto: precio.porcentaje_impuesto,
    impuesto_centimos: precio.impuesto_centimos,
    total_centimos: precio.total_centimos,
  });
};

export const crearDatosEjemplo = async () => {
  // La base de datos puede estar vacía: el script no necesita haber arrancado antes la API.
  await sequelize.sync();

  let creados = 0;
  for (const { cliente, usos } of EJEMPLOS) {
    const { identificador_fiscal } = cliente;
    // Un cliente que ya existe se salta entero, con sus simulaciones: así no se duplica nada.
    if (await Cliente.findOne({ where: { identificador_fiscal } })) continue;

    const { id } = await Cliente.create({ ...cliente });
    for (const entrada of usos) await crearSimulacion(id, cliente.pais, entrada);
    creados += 1;
  }
  logger.info("datos-ejemplo", `Clientes creados: ${creados} de ${EJEMPLOS.length}`);
};

// Solo al lanzarlo desde la consola: las pruebas importan la función sin ejecutar nada.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await crearDatosEjemplo();
  await sequelize.close();
}
