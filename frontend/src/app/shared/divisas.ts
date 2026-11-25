// Conversión de divisa (spec §5). Es el ÚNICO sitio que convierte, y solo para pintar: la API,
// los servicios y las interfaces siguen en céntimos de euro.

export const CODIGOS_DIVISA = ['EUR', 'USD', 'GBP'] as const;

export type CodigoDivisa = (typeof CODIGOS_DIVISA)[number];

export interface Divisa {
  codigo: CodigoDivisa;
  // unidades de esta divisa por 1 euro
  cambio: number;
}

export const EUR: Readonly<Divisa> = Object.freeze({ codigo: 'EUR', cambio: 1 });

// Una línea: céntimos de euro -> céntimos de la divisa, es decir, redondeada a 2 decimales.
export const convertir = (centimos: number, { cambio }: Divisa): number => Math.round(centimos * cambio);

// El total de varias líneas es la suma de las líneas YA convertidas, para que cuadre con lo que
// se ve. No se convierte el total en euros: podría diferir en algún céntimo.
export const sumarConvertidas = (lineas: readonly number[], divisa: Divisa): number =>
  lineas.reduce((suma, linea) => suma + convertir(linea, divisa), 0);
