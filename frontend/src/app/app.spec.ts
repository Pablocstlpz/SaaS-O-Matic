import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { App } from './app';
import { appConfig } from './app.config';

describe('Arranque', () => {
  it('arranca con la configuración real y muestra el layout en el inicio', async () => {
    TestBed.configureTestingModule({ providers: appConfig.providers });
    const app = TestBed.createComponent(App);

    await TestBed.inject(Router).navigateByUrl('/');
    await app.whenStable();

    const pantalla: HTMLElement = app.nativeElement;
    expect(pantalla.querySelector('header')?.textContent).toContain('SaaS-O-Matic');
    expect(pantalla.querySelector('main')).not.toBeNull();
    expect(pantalla.textContent).not.toContain('Esta página no existe');
  });
});
