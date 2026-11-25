import {
  ApplicationConfig,
  LOCALE_ID,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';

import { routes } from './app.routes';
import { authInterceptor } from './interceptors/auth.interceptor';
import { IdiomaService } from './services/idioma.service';

// fechas, numeros y monedas en formato espanol (1.234,50 €); sin esto los pipes usan en-US
registerLocaleData(localeEs);

// Proveedores globales de la aplicacion. Lo que solo usa una pantalla se provee en esa pantalla.
// Angular Material no necesita nada mas aqui: cada componente importa los modulos que usa.
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // withComponentInputBinding: los parametros de la ruta (:id) y de la URL (?volver=)
    // llegan como input() del componente, sin leer ActivatedRoute a mano
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    { provide: LOCALE_ID, useValue: 'es-ES' },
    provideTranslateService({
      loader: provideTranslateHttpLoader({ prefix: '/i18n/', suffix: '.json' }),
      lang: 'es',
      fallbackLang: 'es',
    }),
    provideAppInitializer(() => inject(IdiomaService).iniciar()),
  ],
};
