// Error esperado de la API: lo lanza un controlador o un servicio y el manejador global de app.ts
// lo convierte en { message, tipo, errors }. Todo lo que NO sea ErrorHttp sale como 500 genérico.
//
// message: texto que se puede enseñar tal cual al usuario.
// tipo: código estable para que el frontend reaccione. Lista cerrada en docs/decisiones.md.
// errors: fallos por campo; vacío cuando el error no es de un campo.
export type TipoError =
  | "VALIDACION"
  | "REFERENCIA_INVALIDA"
  | "NO_ENCONTRADO"
  | "IDENTIFICADOR_REPETIDO"
  | "DUPLICADO"
  | "DEMASIADO_GRANDE"
  | "CORS"
  | "ERROR_INTERNO";

export interface ErrorCampo {
  campo: string;
  mensaje: string;
}

export class ErrorHttp extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly tipo: TipoError,
    readonly errors: ErrorCampo[] = [],
  ) {
    super(message);
  }
}

export const noEncontrado = (message = "Recurso no encontrado") =>
  new ErrorHttp(404, message, "NO_ENCONTRADO");
