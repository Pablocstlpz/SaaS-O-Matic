import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Cliente } from '../../../interfaces/cliente';
import { ClientesBuscador } from './clientes-buscador';

const URL_CLIENTES = 'http://localhost:3000/customers';

const cliente = (id: number, nombre_empresa: string): Cliente => ({
  id,
  nombre_empresa,
  identificador_fiscal: 'A58818501',
  email_contacto: 'hola@ejemplo.es',
  pais: 'ES',
  plan: 'pro',
  fecha_creacion: '2026-11-25T10:00:00.000Z',
});

describe('ClientesBuscador', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => vi.useRealTimers());

  // con una petición pendiente la app no llega a estar estable: se repinta a mano
  const montar = (): HTMLElement => {
    const buscador = TestBed.createComponent(ClientesBuscador);
    TestBed.tick();
    return buscador.nativeElement;
  };

  const escribir = (pantalla: HTMLElement, texto: string) => {
    const campo = pantalla.querySelector<HTMLInputElement>('input[type="search"]');
    if (!campo) throw new Error('La pantalla no tiene buscador');
    campo.value = texto;
    campo.dispatchEvent(new Event('input'));
    TestBed.tick();
  };

  const esperar = (ms: number) => {
    vi.advanceTimersByTime(ms);
    TestBed.tick();
  };

  const nombres = (pantalla: HTMLElement) =>
    Array.from(pantalla.querySelectorAll('app-cliente-tarjeta h2'), (titulo) => titulo.textContent?.trim());

  it('al entrar pide los clientes sin q y los pinta', () => {
    const pantalla = montar();

    // la URL entera: sin ?q=
    http.expectOne(URL_CLIENTES).flush([cliente(1, 'Acme'), cliente(2, 'Zeta')]);
    TestBed.tick();

    expect(nombres(pantalla)).toEqual(['Acme', 'Zeta']);
  });

  it('varias teclas en menos de 300 ms hacen una sola petición', () => {
    const pantalla = montar();
    http.expectOne(URL_CLIENTES).flush([]);

    escribir(pantalla, 'a');
    esperar(100);
    escribir(pantalla, 'ac');
    esperar(100);
    escribir(pantalla, 'acm');
    esperar(299);
    http.expectNone(() => true);
    esperar(1);

    http.expectOne(`${URL_CLIENTES}?q=acm`);
  });

  it('una búsqueda nueva cancela la anterior', () => {
    const pantalla = montar();
    http.expectOne(URL_CLIENTES).flush([]);

    escribir(pantalla, 'a');
    esperar(300);
    const anterior = http.expectOne(`${URL_CLIENTES}?q=a`);
    escribir(pantalla, 'ac');
    esperar(300);

    http.expectOne(`${URL_CLIENTES}?q=ac`);
    expect(anterior.cancelled).toBe(true);
  });

  it('con la lista vacía dice «No hay resultados»', () => {
    const pantalla = montar();

    http.expectOne(URL_CLIENTES).flush([]);
    TestBed.tick();

    expect(pantalla.textContent).toContain('No hay resultados');
  });

  it('si la API falla muestra su mensaje', () => {
    const pantalla = montar();
    const message = 'Error interno del servidor';

    http
      .expectOne(URL_CLIENTES)
      .flush({ message, tipo: 'ERROR_INTERNO', errors: [] }, { status: 500, statusText: 'Error' });
    TestBed.tick();

    expect(pantalla.querySelector('[role="alert"]')?.textContent?.trim()).toBe(message);
  });

  it('mientras espera la respuesta muestra el spinner', () => {
    const pantalla = montar();
    const spinner = () => pantalla.querySelector('mat-spinner');
    const peticion = http.expectOne(URL_CLIENTES);

    expect(spinner()).not.toBeNull();

    peticion.flush([]);
    TestBed.tick();

    expect(spinner()).toBeNull();
  });
});
