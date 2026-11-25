import { Injectable, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';

export type Idioma = 'es' | 'en';

const CLAVE = 'idioma';

// Idioma de la interfaz (ngx-translate). Los textos viven en public/i18n/<idioma>.json
// y en las plantillas se usan con {{ 'seccion.clave' | translate }}.
//
// Los mensajes de error que manda la API llegan ya redactados en castellano y se pintan tal cual.
// Si un proyecto necesita esos mensajes en varios idiomas, la API tiene que leer Accept-Language.
@Injectable({ providedIn: 'root' })
export class IdiomaService {
  private readonly translate = inject(TranslateService);

  readonly disponibles: readonly Idioma[] = ['es', 'en'];
  readonly actual = signal<Idioma>('es');

  // la llama provideAppInitializer: la app no se pinta hasta tener los textos (sin parpadeo de claves)
  async iniciar(): Promise<void> {
    const navegador = this.translate.getBrowserLang();
    await this.cambiar(this.leer() ?? (navegador?.startsWith('en') ? 'en' : 'es'));
  }

  async cambiar(idioma: Idioma): Promise<void> {
    try {
      await firstValueFrom(this.translate.use(idioma));
    } catch {
      // si no carga el JSON se ven las claves; mejor eso que una app que no arranca
    }
    this.actual.set(idioma);
    if (typeof document !== 'undefined') document.documentElement.lang = idioma;
    try {
      localStorage.setItem(CLAVE, idioma);
    } catch {
      // navegacion privada o almacenamiento bloqueado: el idioma no se recuerda, nada mas
    }
  }

  private leer(): Idioma | null {
    try {
      const guardado = localStorage.getItem(CLAVE);
      return guardado === 'es' || guardado === 'en' ? guardado : null;
    } catch {
      return null;
    }
  }
}
