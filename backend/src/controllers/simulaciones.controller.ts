// Traduce HTTP <-> dominio. El formato de la entrada ya lo comprobó el validador.
import type { RequestHandler } from "express";
import { matchedData } from "express-validator";

import { Cliente } from "../models/cliente.model.js";
import { Simulacion, type SimulacionModelo } from "../models/simulacion.model.js";
import { calcularPrecio } from "../services/precios.service.js";
import { ErrorHttp } from "../utils/errores.js";

interface EntradaCalculo {
  usuarios: number;
  pais: string;
}

type EntradaSimulacion = Pick<
  SimulacionModelo,
  "cliente_id" | "usuarios" | "almacenamiento_gb" | "llamadas_api"
>;

const SIN_CLIENTE = "El cliente no existe";

// POST /simulations/calcular -> 200 Calculo. No guarda nada: es la vista previa del slider,
// y por eso el impuesto sale del país que llega en el cuerpo.
export const calcularSimulacion: RequestHandler = (req, res) => {
  const { usuarios, pais } = matchedData<EntradaCalculo>(req);
  res.status(200).json(calcularPrecio(usuarios, pais));
};

// POST /simulations -> 201 Simulacion | 400 REFERENCIA_INVALIDA. El impuesto sale del país
// del cliente guardado, nunca de la petición.
export const crearSimulacion: RequestHandler = async (req, res) => {
  const { cliente_id, usuarios, almacenamiento_gb, llamadas_api } =
    matchedData<EntradaSimulacion>(req);

  const cliente = await Cliente.findByPk(cliente_id);
  if (!cliente) {
    throw new ErrorHttp(400, SIN_CLIENTE, "REFERENCIA_INVALIDA", [
      { campo: "cliente_id", mensaje: SIN_CLIENTE },
    ]);
  }

  const precio = calcularPrecio(usuarios, cliente.pais);
  const simulacion = await Simulacion.create({
    cliente_id,
    usuarios,
    almacenamiento_gb,
    llamadas_api,
    coste_base_centimos: precio.coste_base_centimos,
    porcentaje_impuesto: precio.porcentaje_impuesto,
    impuesto_centimos: precio.impuesto_centimos,
    total_centimos: precio.total_centimos,
  });
  res.status(201).json(simulacion);
};
