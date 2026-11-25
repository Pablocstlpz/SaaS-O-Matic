// Lo común de las pruebas que leen clientes: dejar la BD vacía y los datos de un alta.
import { Cliente } from "../src/models/cliente.model.js";
import { Simulacion } from "../src/models/simulacion.model.js";

export const vaciarBd = async () => {
  // Primero las simulaciones: la clave ajena impide borrar un cliente que las tiene.
  await Simulacion.destroy({ where: {} });
  await Cliente.destroy({ where: {} });
};

export const datosCliente = (nombre_empresa: string, identificador_fiscal: string) => ({
  nombre_empresa,
  identificador_fiscal,
  email_contacto: "compras@acme.example",
  pais: "FR",
  plan: "pro" as const,
});
