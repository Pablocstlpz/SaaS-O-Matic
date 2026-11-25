import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { App } from './app';
import { appConfig } from './app.config';

describe('Arranque', () => {
  it('arranca con la configuración real y muestra el layout en el inicio', async () => {
    // sin red de verdad: el layout pide los tipos de cambio a una API externa
    TestBed.configureTestingModule({ providers: [...appConfig.providers, provideHttpClientTesting()] });
    const app = TestBed.createComponent(App);

    await TestBed.inject(Router).navigateByUrl('/');
    app.detectChanges();
    // con esa petición pendiente, la app no llega a estar estable
    TestBed.inject(HttpTestingController)
      .expectOne('https://open.er-api.com/v6/latest/EUR')
      .flush({ rates: { USD: 1.1, GBP: 0.85 } });
    await app.whenStable();

    const pantalla: HTMLElement = app.nativeElement;
    expect(pantalla.querySelector('header')?.textContent).toContain('SaaS-O-Matic');
    expect(pantalla.querySelector('main')).not.toBeNull();
    expect(pantalla.textContent).not.toContain('Esta página no existe');
  });
});
