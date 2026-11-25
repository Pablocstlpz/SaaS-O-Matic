import { HttpErrorResponse, HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, finalize, map, shareReplay, switchMap, throwError } from 'rxjs';

import { environment } from '../../environments/environment';
import { SesionService } from '../services/sesion.service';

// rutas de la API que no llevan token ni intentan renovar la sesion
const RUTAS_PUBLICAS = ['/auth/login', '/auth/renovar'];

// Si llegan cinco 401 a la vez, se pide UNA renovacion y las cinco peticiones esperan a esa.
// Sin esto saldrian cinco renovaciones en paralelo y la ultima invalidaria a las otras.
let renovacionEnCurso: Observable<string> | null = null;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const esApi = req.url.startsWith(environment.apiUrl);
  const esPublica = RUTAS_PUBLICAS.some((ruta) => req.url.endsWith(ruta));
  if (!esApi || esPublica) return next(req);

  const sesion = inject(SesionService);
  const router = inject(Router);

  return next(conToken(req, sesion.token())).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        return reintentarConSesionRenovada(req, next, sesion, router);
      }
      // aqui se reacciona a otros `tipo` globales del backend (p. ej. 403 SUSCRIPCION_REQUERIDA -> pantalla de pago)
      return throwError(() => error);
    }),
  );
};

function conToken(req: HttpRequest<unknown>, token: string | null): HttpRequest<unknown> {
  return token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;
}

function reintentarConSesionRenovada(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  sesion: SesionService,
  router: Router,
): Observable<HttpEvent<unknown>> {
  renovacionEnCurso ??= sesion.renovar().pipe(
    map((tokens) => tokens.accessToken),
    finalize(() => (renovacionEnCurso = null)),
    shareReplay(1),
  );

  return renovacionEnCurso.pipe(
    // este catchError va ANTES del switchMap: solo cierra la sesion si falla la RENOVACION,
    // no si la peticion reintentada devuelve otro error (un 409 no es motivo para echar a nadie)
    catchError((error: unknown) => {
      sesion.cerrar();
      void router.navigate(['/login'], { queryParams: { volver: router.url } });
      return throwError(() => error);
    }),
    switchMap((token) => next(conToken(req, token))),
  );
}
