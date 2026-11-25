import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { environment } from '../../environments/environment';

// Error de la API ya traducido: los componentes leen `message` (para pintar) y `tipo` (para reaccionar)
// y no tienen que conocer HttpErrorResponse ni la forma del cuerpo de error.
export class ErrorApi extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly tipo?: string,
  ) {
    super(message);
  }
}

// Base de TODOS los servicios de la API: URL base, verbos tipados y traduccion de errores.
// Un servicio de recurso hace `extends BaseHttpService` y llama a this.get('/ruta').
// Ningun componente usa HttpClient directamente.
export abstract class BaseHttpService {
  protected readonly http = inject(HttpClient);
  protected readonly apiUrl = environment.apiUrl;

  protected get<T>(ruta: string): Observable<T> {
    return this.http.get<T>(this.apiUrl + ruta).pipe(catchError(this.aErrorApi));
  }

  protected post<T>(ruta: string, cuerpo: unknown): Observable<T> {
    return this.http.post<T>(this.apiUrl + ruta, cuerpo).pipe(catchError(this.aErrorApi));
  }

  protected put<T>(ruta: string, cuerpo: unknown): Observable<T> {
    return this.http.put<T>(this.apiUrl + ruta, cuerpo).pipe(catchError(this.aErrorApi));
  }

  protected patch<T>(ruta: string, cuerpo: unknown): Observable<T> {
    return this.http.patch<T>(this.apiUrl + ruta, cuerpo).pipe(catchError(this.aErrorApi));
  }

  protected delete<T>(ruta: string): Observable<T> {
    return this.http.delete<T>(this.apiUrl + ruta).pipe(catchError(this.aErrorApi));
  }

  // funcion flecha para no perder `this` al pasarla a catchError
  private readonly aErrorApi = (error: HttpErrorResponse) => {
    // HttpErrorResponse.error es `any`: puede ser el JSON de la API, un texto (un proxy, un 502 de
    // nginx) o nada. Se lee como unknown para que TypeScript obligue a mirar la forma antes de usarla.
    const cuerpo: unknown = error.error;
    const { message, tipo } = (typeof cuerpo === 'object' && cuerpo !== null ? cuerpo : {}) as {
      message?: unknown;
      tipo?: unknown;
    };
    // status 0 = no hubo respuesta (sin red, servidor caido, CORS). Se mira ANTES que el cuerpo: con fetch,
    // error.error es el TypeError del navegador, y su message ("Failed to fetch") no lo ha escrito el servidor
    const texto =
      error.status === 0
        ? 'No se puede conectar con el servidor'
        : typeof message === 'string'
          ? message
          : 'Error inesperado';
    return throwError(() => new ErrorApi(error.status, texto, typeof tipo === 'string' ? tipo : undefined));
  };
}
