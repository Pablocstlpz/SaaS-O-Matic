// Traduce HTTP <-> dominio. La entrada llega ya limpia y validada.
import type { RequestHandler } from "express";
import { matchedData } from "express-validator";

import { Cliente, type ClienteModelo } from "../models/cliente.model.js";
import { ErrorHttp } from "../utils/errores.js";

type EntradaCliente = Pick<
  ClienteModelo,
  "nombre_empresa" | "identificador_fiscal" | "email_contacto" | "pais" | "plan"
>;

const REPETIDO = "Ya existe un cliente con ese identificador fiscal";

// POST /customers -> 201 Cliente | 409 IDENTIFICADOR_REPETIDO
export const crearCliente: RequestHandler = async (req, res) => {
  const { nombre_empresa, identificador_fiscal, email_contacto, pais, plan } =
    matchedData<EntradaCliente>(req);

  // Da el error junto a su campo. No es atómico: dos altas a la vez las frena el índice único.
  if (await Cliente.findOne({ where: { identificador_fiscal } })) {
    throw new ErrorHttp(409, REPETIDO, "IDENTIFICADOR_REPETIDO", [
      { campo: "identificador_fiscal", mensaje: REPETIDO },
    ]);
  }

  const cliente = await Cliente.create({
    nombre_empresa,
    identificador_fiscal,
    email_contacto,
    pais,
    plan,
  });
  res.status(201).json(cliente);
};
