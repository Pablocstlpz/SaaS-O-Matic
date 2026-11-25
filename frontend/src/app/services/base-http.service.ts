import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';

import { environment } from '../../environments/environment';

export interface ErrorCampo {
  campo: string;
  mensaje: string;
}

// Error de la API ya traducido: los componentes leen `message` (para pintar), `tipo` (para reaccionar)
// y `errors` (para pintar cada fallo junto a su campo), sin conocer HttpErrorResponse.
// Si no llega un error con la forma de nuestra API, `tipo` queda vacío y `errors` es [].
export class ErrorApi extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly tipo: string,
    readonly errors: ErrorCampo[],
  ) {
    super(message);
  }
}

const esObjeto = (valor: unknown): valor is object => typeof valor === 'object' && valor !== null;

const esErrorCampo = (valor: unknown): valor is ErrorCampo =>
  esObjeto(valor) &&
  'campo' in valor &&
  typeof valor.campo === 'string' &&
  'mensaje' in valor &&
  typeof valor.mensaje === 'string';

// status 0 = no hubo respuesta (sin red, servidor caído, CORS). Se mira ANTES que el cuerpo: con fetch,
// el cuerpo es el TypeError del navegador, y su message ("Failed to fetch") no lo ha escrito el servidor.
const textoDeError = (status: number, message: unknown): string => {
  if (status === 0) return 'No se puede conectar con el servidor';
  return typeof message === 'string' ? message : 'Error inesperado';
};

const aErrorApi = ({ status, error }: HttpErrorResponse): ErrorApi => {
  // HttpErrorResponse.error es `any`: puede ser el JSON de la API, un texto (un proxy) o nada.
  // Se lee como unknown para que TypeScript obligue a mirar la forma antes de usarla.
  const cuerpo: unknown = error;
  const { message, tipo, errors }: { message?: unknown; tipo?: unknown; errors?: unknown } = esObjeto(cuerpo)
    ? cuerpo
    : {};
  return new ErrorApi(
    status,
    textoDeError(status, message),
    typeof tipo === 'string' ? tipo : '',
    Array.isArray(errors) ? errors.filter(esErrorCampo) : [],
  );
};

// Base de TODOS los servicios de nuestra API: URL base, verbos tipados y traducción de errores.
// Un servicio de recurso hace `extends BaseHttpService` y llama a this.get('/ruta').
// Solo están los verbos que la API admite: GET y POST.
export abstract class BaseHttpService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  protected get<T>(ruta: string): Observable<T> {
    return this.http.get<T>(this.apiUrl + ruta).pipe(catchError(this.fallar));
  }

  protected post<T>(ruta: string, cuerpo: unknown): Observable<T> {
    return this.http.post<T>(this.apiUrl + ruta, cuerpo).pipe(catchError(this.fallar));
  }

  // función flecha para pasarla a catchError
  private readonly fallar = (error: HttpErrorResponse) => throwError(() => aErrorApi(error));
}
