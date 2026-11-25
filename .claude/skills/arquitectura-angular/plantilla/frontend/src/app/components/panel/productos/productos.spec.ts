// EJEMPLO de prueba de un componente: se monta la pantalla de verdad (plantilla, tabla de Material,
// pipes) y solo se finge la API con HttpTestingController. Se comprueba lo que VE el usuario, no las
// signals por dentro: asi la prueba sigue valiendo aunque se reescriba el componente.
// Ejecutar: npm test
import { LOCALE_ID } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, TestRequest, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';

import { environment } from '../../../../environments/environment';
import { Producto } from '../../../interfaces/producto';
import { Usuario } from '../../../interfaces/usuario';
import { Productos } from './productos';

// el pipe currency con LOCALE_ID es-ES lanza un error si el locale no esta registrado
registerLocaleData(localeEs);

const URL_PRODUCTOS = `${environment.apiUrl}/productos`;

const ADMIN: Usuario = {
  id: 1,
  organizacion_id: 1,
  nombre: 'Ana Admin',
  email: 'ana@ejemplo.com',
  rol: 'admin',
  fecha_creacion: '2026-01-01T00:00:00Z',
  fecha_actualizacion: '2026-01-01T00:00:00Z',
};

function producto(id: number, nombre: string): Producto {
  return {
    id,
    organizacion_id: 1,
    nombre,
    precio: 10 * id,
    estado: 'activo',
    fecha_creacion: '2026-10-01T00:00:00Z',
    fecha_actualizacion: '2026-10-01T00:00:00Z',
  };
}

// Monta la pantalla con una sesion de admin y devuelve la peticion que hace al arrancar,
// todavia sin responder: cada prueba decide que contesta la API.
function montar() {
  // misma clave y forma que guarda SesionService; se siembra ANTES de crear el componente
  // porque el servicio lee sessionStorage al construirse
  sessionStorage.setItem('sesion', JSON.stringify({ usuario: ADMIN, accessToken: 'a', refreshToken: 'r' }));

  TestBed.configureTestingModule({
    imports: [Productos],
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      provideRouter([]),
      // sin loader: las plantillas pintan la CLAVE ('productos.vacio'), que es lo que se comprueba.
      // Asi la prueba no depende de como se redacte el texto en es.json
      provideTranslateService({ lang: 'es', fallbackLang: 'es' }),
      { provide: LOCALE_ID, useValue: 'es-ES' },
    ],
  });

  const fixture = TestBed.createComponent(Productos);
  const http = TestBed.inject(HttpTestingController);
  const pantalla: HTMLElement = fixture.nativeElement;
  fixture.detectChanges();

  // responde a la peticion y espera a que la pantalla se repinte
  const responder = async (peticion: TestRequest, ...args: Parameters<TestRequest['flush']>) => {
    peticion.flush(...args);
    await fixture.whenStable();
    fixture.detectChanges();
  };

  const filas = () => Array.from(pantalla.querySelectorAll('tr[mat-row]'), (fila) => fila.textContent ?? '');

  return { fixture, http, pantalla, responder, filas, peticion: http.expectOne(URL_PRODUCTOS) };
}

describe('Productos', () => {
  afterEach(() => {
    // ninguna prueba puede dejar peticiones sin responder ni la sesion de otra
    TestBed.inject(HttpTestingController).verify();
    sessionStorage.clear();
  });

  it('pide GET /productos y pinta una fila por producto', async () => {
    const { peticion, responder, filas } = montar();
    expect(peticion.request.method).toBe('GET');
    expect(peticion.request.url).toBe(URL_PRODUCTOS);

    await responder(peticion, [producto(1, 'Mesa'), producto(2, 'Silla')]);

    expect(filas()).toHaveLength(2);
    expect(filas()[0]).toContain('Mesa');
    expect(filas()[1]).toContain('Silla');
  });

  it('con la lista vacía muestra el aviso de vacío y ninguna fila', async () => {
    const { peticion, responder, filas, pantalla } = montar();

    await responder(peticion, []);

    expect(filas()).toHaveLength(0);
    expect(pantalla.textContent).toContain('productos.vacio');
  });

  it('si la API falla muestra su mensaje y reintentar vuelve a pedir la lista', async () => {
    const { peticion, responder, pantalla, http } = montar();

    await responder(
      peticion,
      { message: 'La base de datos no responde' },
      { status: 500, statusText: 'Internal Server Error' },
    );

    // el texto es el del servidor, tal cual: la pantalla no inventa mensajes de error
    expect(pantalla.querySelector('[role="alert"]')?.textContent).toContain('La base de datos no responde');
    const reintentar = Array.from(pantalla.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('comun.reintentar'),
    );
    expect(reintentar).toBeDefined();

    reintentar?.click();
    await responder(http.expectOne(URL_PRODUCTOS), []);
    expect(pantalla.textContent).toContain('productos.vacio');
  });

  it('escribir en el buscador deja solo las filas que coinciden', async () => {
    const { peticion, responder, filas, pantalla, fixture } = montar();
    await responder(peticion, [producto(1, 'Mesa'), producto(2, 'Silla'), producto(3, 'Mesilla')]);

    const buscador = pantalla.querySelector<HTMLInputElement>('input[type="search"]');
    if (!buscador) throw new Error('La pantalla no tiene buscador');
    buscador.value = 'mes';
    buscador.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(filas()).toHaveLength(2);
    expect(filas().join()).not.toContain('Silla');
  });
});
