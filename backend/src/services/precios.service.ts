// Coste base por tramos, impuesto y total (spec §3). Es la única fórmula de precios de la app.
// Recibe datos y devuelve datos, todo en céntimos enteros. No valida el número de usuarios:
// de eso se encarga el validador.
import { PAISES, TRAMOS } from "../utils/regex.js";

export interface LineaTramo {
  desde: number;
  hasta: number | null;
  usuarios: number;
  precio_unitario_centimos: number;
  subtotal_centimos: number;
}

export interface Calculo {
  usuarios: number;
  pais: string;
  tramos: LineaTramo[];
  coste_base_centimos: number;
  porcentaje_impuesto: number;
  impuesto_centimos: number;
  total_centimos: number;
}

// Solo salen los tramos que tienen algún usuario. Cada usuario paga el precio de su tramo.
const desglosarTramos = (usuarios: number): LineaTramo[] =>
  TRAMOS.filter(({ desde }) => usuarios >= desde).map((tramo) => {
    const enTramo = Math.min(usuarios, tramo.hasta ?? usuarios) - tramo.desde + 1;
    const subtotal = enTramo * tramo.precio_unitario_centimos;
    return { ...tramo, usuarios: enTramo, subtotal_centimos: subtotal };
  });

const porcentajeDe = (pais: string): number => {
  const encontrado = PAISES.find(({ codigo }) => codigo === pais);
  // Llegar aquí es un fallo de programación: la lista de países se comprueba antes.
  if (!encontrado) throw new Error(`País sin IVA definido: ${pais}`);
  return encontrado.iva;
};

export const calcularPrecio = (usuarios: number, pais: string): Calculo => {
  const tramos = desglosarTramos(usuarios);
  const base = tramos.reduce((suma, linea) => suma + linea.subtotal_centimos, 0);
  const porcentaje = porcentajeDe(pais);
  const impuesto = Math.round((base * porcentaje) / 100);
  return {
    usuarios,
    pais,
    tramos,
    coste_base_centimos: base,
    porcentaje_impuesto: porcentaje,
    impuesto_centimos: impuesto,
    total_centimos: base + impuesto,
  };
};
