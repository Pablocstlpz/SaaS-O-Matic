// Traduce HTTP <-> dominio. El formato de la entrada ya lo comprobó el validador.
import type { RequestHandler } from "express";
import { matchedData } from "express-validator";

import { calcularPrecio } from "../services/precios.service.js";

interface EntradaCalculo {
  usuarios: number;
  pais: string;
}

// POST /simulations/calcular -> 200 Calculo. No guarda nada: es la vista previa del slider,
// y por eso el impuesto sale del país que llega en el cuerpo.
export const calcularSimulacion: RequestHandler = (req, res) => {
  const { usuarios, pais } = matchedData<EntradaCalculo>(req);
  res.status(200).json(calcularPrecio(usuarios, pais));
};
