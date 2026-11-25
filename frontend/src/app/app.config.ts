import { ApplicationConfig, LOCALE_ID, provideBrowserGlobalErrorListeners } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';

import { routes } from './app.routes';

// fechas, numeros y monedas en formato espanol (1.234,50 €); sin esto los pipes usan en-US
registerLocaleData(localeEs);

// Proveedores globales de la aplicacion. Lo que solo usa una pantalla se provee en esa pantalla.
// Angular Material no necesita nada mas aqui: cada componente importa los modulos que usa.
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // withComponentInputBinding: los parametros de la ruta (:id) llegan como input() del componente
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withFetch()),
    { provide: LOCALE_ID, useValue: 'es-ES' },
  ],
};
