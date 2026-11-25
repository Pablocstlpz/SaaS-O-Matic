// Constantes compartidas por modelos, validadores, controladores y servicios (spec §2 y §3).
// GEMELO de frontend/src/app/shared/regex.ts: los mismos valores en los dos. Si cambias algo aquí,
// cámbialo allí, o el formulario aceptará datos que la API rechaza (o al revés).

export const LIMITES = Object.freeze({
  NOMBRE_EMPRESA_MIN: 2,
  NOMBRE_EMPRESA_MAX: 120,
  EMAIL_MAX: 254,
  // Solo fuera de España: en España la longitud la fija cada tipo de documento.
  IDENTIFICADOR_EXTRANJERO_MIN: 4,
  IDENTIFICADOR_EXTRANJERO_MAX: 20,
  USUARIOS_MIN: 1,
  USUARIOS_MAX: 100_000,
  ALMACENAMIENTO_GB_MIN: 0,
  ALMACENAMIENTO_GB_MAX: 1_000_000,
  LLAMADAS_API_MIN: 0,
  LLAMADAS_API_MAX: 1_000_000_000,
});

export const PLANES = ["free", "pro", "max"] as const;

// Lista cerrada: un país que no esté aquí se rechaza. El IVA es un porcentaje entero.
export const PAISES = [
  { codigo: "ES", nombre: "España", iva: 21 },
  { codigo: "FR", nombre: "Francia", iva: 20 },
  { codigo: "GB", nombre: "Reino Unido", iva: 20 },
  { codigo: "IT", nombre: "Italia", iva: 22 },
  { codigo: "DE", nombre: "Alemania", iva: 19 },
] as const;

// Tarificación acumulativa, en orden. `desde` y `hasta` son números de usuario, ambos incluidos;
// el último tramo no tiene tope. El precio es por usuario y en céntimos de euro.
export const TRAMOS = [
  { desde: 1, hasta: 10, precio_unitario_centimos: 1000 },
  { desde: 11, hasta: 50, precio_unitario_centimos: 800 },
  { desde: 51, hasta: null, precio_unitario_centimos: 500 },
] as const;
