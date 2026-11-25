// Traduce HTTP <-> dominio. La entrada llega ya limpia y validada.
import type { RequestHandler } from "express";
import { matchedData } from "express-validator";
import { Op, literal } from "sequelize";

import { Cliente, paraBuscar, type ClienteModelo } from "../models/cliente.model.js";
import { Simulacion } from "../models/simulacion.model.js";
import { ErrorHttp, noEncontrado } from "../utils/errores.js";

type EntradaCliente = Pick<
  ClienteModelo,
  "nombre_empresa" | "identificador_fiscal" | "email_contacto" | "pais" | "plan"
>;

const REPETIDO = "Ya existe un cliente con ese identificador fiscal";
const SIN_CLIENTE = "El cliente no existe";
const MAXIMO_RESULTADOS = 50;

// Para que % y _ se busquen como texto y no como comodines (spec §6), van detrás de una barra.
const patronContiene = (texto: string) => `%${texto.replace(/[\\%_]/g, "\\$&")}%`;

const buscarCliente = async (id: number) => {
  const cliente = await Cliente.findByPk(id);
  if (!cliente) throw noEncontrado(SIN_CLIENTE);
  return cliente;
};

// GET /customers?q=texto -> 200 Cliente[]. Sin q, o vacío, salen los primeros por nombre.
export const listarClientes: RequestHandler = async (req, res) => {
  const { q = "" } = matchedData<{ q?: string }>(req);

  // SQLite no tiene carácter de escape por defecto y Op.like no sabe añadir ESCAPE. El literal es
  // fijo: el texto del usuario entra por replacements, que Sequelize escapa.
  const contiene = { [Op.like]: literal(":patron ESCAPE :escape") };
  const clientes = await Cliente.findAll({
    where: { [Op.or]: [{ nombre_busqueda: contiene }, { identificador_fiscal: contiene }] },
    replacements: { patron: patronContiene(paraBuscar(q)), escape: "\\" },
    order: [["nombre_busqueda", "ASC"]],
    limit: MAXIMO_RESULTADOS,
  });
  res.status(200).json(clientes);
};

// GET /customers/:id -> 200 Cliente | 404 NO_ENCONTRADO
export const obtenerCliente: RequestHandler = async (req, res) => {
  const { id } = matchedData<{ id: number }>(req);
  res.status(200).json(await buscarCliente(id));
};

// GET /customers/:id/simulations -> 200 Simulacion[], la más nueva primero | 404 NO_ENCONTRADO
export const listarSimulacionesCliente: RequestHandler = async (req, res) => {
  const { id } = matchedData<{ id: number }>(req);

  await buscarCliente(id);
  const simulaciones = await Simulacion.findAll({
    where: { cliente_id: id },
    // El id desempata las altas del mismo milisegundo: la más nueva tiene el id mayor.
    order: [
      ["fecha_creacion", "DESC"],
      ["id", "DESC"],
    ],
  });
  res.status(200).json(simulaciones);
};

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
