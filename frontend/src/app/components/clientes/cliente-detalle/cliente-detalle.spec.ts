import { registerLocaleData } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import localeEs from '@angular/common/locales/es';
import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { Cliente } from '../../../interfaces/cliente';
import { Simulacion } from '../../../interfaces/simulacion';
import { DivisasService } from '../../../services/divisas.service';
import { ClienteDetalle } from './cliente-detalle';

const URL_CLIENTE = 'http://localhost:3000/customers/7';
const URL_HISTORIAL = `${URL_CLIENTE}/simulations`;
const URL_TIPOS = 'https://open.er-api.com/v6/latest/EUR';

const CLIENTE: Cliente = {
  id: 7,
  nombre_empresa: 'Acme',
  identificador_fiscal: 'A58818501',
  email_contacto: 'hola@ejemplo.es',
  pais: 'ES',
  plan: 'pro',
  fecha_creacion: '2026-11-25T10:00:00.000Z',
};

const simulacion = (id: number, usuarios: number, base: number, impuesto: number): Simulacion => ({
  id,
  cliente_id: 7,
  usuarios,
  almacenamiento_gb: 50,
  llamadas_api: 1000,
  coste_base_centimos: base,
  porcentaje_impuesto: 21,
  impuesto_centimos: impuesto,
  total_centimos: base + impuesto,
  fecha_creacion: '2026-11-25T10:00:00.000Z',
});

describe('ClienteDetalle', () => {
  let http: HttpTestingController;

  beforeAll(() => registerLocaleData(localeEs));

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: LOCALE_ID, useValue: 'es-ES' }],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => vi.useRealTimers());

  // con una petición pendiente la app no llega a estar estable: se repinta a mano
  const montar = (): HTMLElement => {
    const detalle = TestBed.createComponent(ClienteDetalle);
    // como llega de la ruta: en texto
    detalle.componentRef.setInput('id', '7');
    TestBed.tick();
    return detalle.nativeElement;
  };

  const responder = (simulaciones: Simulacion[]) => {
    http.expectOne(URL_CLIENTE).flush(CLIENTE);
    http.expectOne(URL_HISTORIAL).flush(simulaciones);
    TestBed.tick();
  };

  // el texto de cada elemento, con los espacios (también los de no separar) reducidos a uno
  const textos = (pantalla: HTMLElement, selector: string) =>
    Array.from(pantalla.querySelectorAll(selector), (e) => e.textContent?.replace(/\s+/g, ' ').trim());

  // de cada simulación: coste base, impuesto y total
  const importes = (pantalla: HTMLElement) => textos(pantalla, 'app-historial-simulaciones dl:last-of-type dd');

  it('pinta los datos y el historial en el orden en que llega', () => {
    const pantalla = montar();

    // ni por id ni por usuarios: cualquier reordenación se notaría
    responder([simulacion(2, 15, 14000, 2940), simulacion(3, 51, 42500, 8925), simulacion(1, 10, 10000, 2100)]);

    expect(textos(pantalla, 'app-cliente-datos h1')).toEqual(['Acme']);
    expect(textos(pantalla, 'app-cliente-datos dd')).toEqual([
      'A58818501',
      'hola@ejemplo.es',
      'España',
      'pro',
      '25 de noviembre de 2026',
    ]);
    expect(textos(pantalla, 'app-historial-simulaciones dl:first-of-type div:first-child dd')).toEqual([
      '15',
      '51',
      '10',
    ]);
  });

  it('al cambiar la divisa, los importes cambian sin pedir nada al backend', () => {
    const pantalla = montar();
    http.expectOne(URL_TIPOS).flush({ rates: { USD: 1.1, GBP: 0.85 } });
    responder([simulacion(1, 15, 14000, 2940)]);

    expect(importes(pantalla)).toEqual(['140,00 €', '29,40 €', '169,40 €']);

    TestBed.inject(DivisasService).elegir('USD');
    TestBed.tick();

    expect(importes(pantalla)).toEqual(['154,00 US$', '32,34 US$', '186,34 US$']);
    http.expectNone(() => true);
  });

  it('con un cliente que no existe dice que no existe', () => {
    const pantalla = montar();
    const message = 'El cliente no existe';
    const error = { message, tipo: 'NO_ENCONTRADO', errors: [] };
    const respuesta = { status: 404, statusText: 'Not Found' };

    http.expectOne(URL_CLIENTE).flush(error, respuesta);
    http.expectOne(URL_HISTORIAL).flush(error, respuesta);
    TestBed.tick();

    expect(textos(pantalla, '[role="alert"]')).toEqual([message]);
  });

  it('la simulación guardada aparece la primera del historial sin recargar', () => {
    vi.useFakeTimers();
    const pantalla = montar();
    responder([simulacion(1, 10, 10000, 2100)]);
    // sin precio no se puede guardar
    vi.advanceTimersByTime(250);
    http.expectOne('http://localhost:3000/simulations/calcular').flush({ ...simulacion(0, 1, 1000, 210), tramos: [] });
    TestBed.tick();

    pantalla.querySelector<HTMLButtonElement>('app-simulador button')?.click();
    http.expectOne('http://localhost:3000/simulations').flush(simulacion(2, 15, 14000, 2940));
    TestBed.tick();

    expect(textos(pantalla, 'app-historial-simulaciones dl:first-of-type div:first-child dd')).toEqual(['15', '10']);
    http.expectNone(URL_HISTORIAL);
  });

  it('sin simulaciones muestra el estado vacío', () => {
    const pantalla = montar();

    responder([]);

    expect(textos(pantalla, 'app-historial-simulaciones')).toEqual(['Todavía no hay simulaciones guardadas']);
  });
});
