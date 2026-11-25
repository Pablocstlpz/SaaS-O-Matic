import { registerLocaleData } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import localeEs from '@angular/common/locales/es';
import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { Cliente } from '../../../interfaces/cliente';
import { Calculo } from '../../../interfaces/simulacion';
import { EUR } from '../../../shared/divisas';
import { Simulador } from './simulador';

const URL_CALCULAR = 'http://localhost:3000/simulations/calcular';

// alemán a propósito: el país de la petición tiene que salir del cliente
const CLIENTE: Cliente = {
  id: 7,
  nombre_empresa: 'Acme',
  identificador_fiscal: 'DE123456789',
  email_contacto: 'hola@ejemplo.es',
  pais: 'DE',
  plan: 'pro',
  fecha_creacion: '2026-11-25T10:00:00.000Z',
};

// al simulador le da igual de dónde salgan los importes: solo los pinta
const calculo = (usuarios: number, base: number): Calculo => ({
  usuarios,
  pais: 'DE',
  tramos: [{ desde: 1, hasta: 10, usuarios, precio_unitario_centimos: 1000, subtotal_centimos: base }],
  coste_base_centimos: base,
  porcentaje_impuesto: 19,
  impuesto_centimos: 0,
  total_centimos: base,
});

describe('Simulador', () => {
  let http: HttpTestingController;
  let pantalla: HTMLElement;

  beforeAll(() => registerLocaleData(localeEs));

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: LOCALE_ID, useValue: 'es-ES' }],
    });
    http = TestBed.inject(HttpTestingController);
    const simulador = TestBed.createComponent(Simulador);
    simulador.componentRef.setInput('cliente', CLIENTE);
    simulador.componentRef.setInput('divisa', EUR);
    pantalla = simulador.nativeElement;
    TestBed.tick();
  });

  afterEach(() => vi.useRealTimers());

  const esperar = (ms: number) => {
    vi.advanceTimersByTime(ms);
    TestBed.tick();
  };

  const entrada = (selector: string) => {
    const campo = pantalla.querySelector<HTMLInputElement>(selector);
    if (!campo) throw new Error(`No hay ${selector}`);
    return campo;
  };
  const campo = () => entrada('input[formcontrolname="usuarios"]');
  const slider = () => entrada('input[type="range"]');

  const poner = (control: HTMLInputElement, valor: number | string) => {
    control.value = String(valor);
    control.dispatchEvent(new Event('input'));
    TestBed.tick();
  };

  const responder = (respuesta: Calculo) => {
    http.expectOne(URL_CALCULAR).flush(respuesta);
    TestBed.tick();
  };

  // el cálculo que se pide al entrar
  const entrar = () => {
    esperar(250);
    responder(calculo(1, 1000));
  };

  const total = () => pantalla.querySelector('[data-linea="total"]')?.textContent?.replace(/\s+/g, ' ').trim();
  const atenuado = () => pantalla.querySelector('app-desglose-precio .opacity-50') !== null;
  const diceCalculando = () => pantalla.querySelector('app-desglose-precio')?.textContent?.includes('calculando');

  it('mover el slider varias veces en menos de 250 ms hace una petición, con el país del cliente', () => {
    entrar();

    poner(slider(), 20);
    esperar(100);
    poner(slider(), 30);
    esperar(100);
    poner(slider(), 40);
    esperar(249);
    http.expectNone(() => true);
    esperar(1);

    expect(http.expectOne(URL_CALCULAR).request.body).toStrictEqual({ usuarios: 40, pais: 'DE' });
  });

  it('el slider y el campo numérico van juntos; con 500 el slider se queda al máximo y se calcula con 500', () => {
    entrar();

    poner(slider(), 40);
    expect(campo().value).toBe('40');

    poner(campo(), 30);
    expect(slider().value).toBe('30');

    poner(campo(), 500);
    expect(slider().value).toBe('200');
    esperar(250);
    expect(http.expectOne(URL_CALCULAR).request.body).toStrictEqual({ usuarios: 500, pais: 'DE' });
  });

  it('fuera de 1 a 100.000 avisa junto al campo y no pide nada', () => {
    entrar();
    const aviso = () => campo().closest('mat-form-field')?.querySelector('mat-error')?.textContent?.trim();
    const rango = 'Los usuarios deben ser un número entero entre 1 y 100.000';

    for (const [valor, mensaje] of [
      [0, rango],
      [100001, rango],
      [2.5, rango],
      ['', 'Los usuarios son obligatorios'],
    ] as const) {
      poner(campo(), valor);
      esperar(250);

      expect(aviso()).toBe(mensaje);
      http.expectNone(() => true);
    }
  });

  it('un cambio nuevo cancela la petición en vuelo', () => {
    entrar();
    poner(slider(), 20);
    esperar(250);
    const anterior = http.expectOne(URL_CALCULAR);

    poner(slider(), 30);

    // en el momento: si llegara durante los 250 ms, se pintaría un precio que ya no es el vigente
    expect(anterior.cancelled).toBe(true);
  });

  it('mientras calcula atenúa el precio anterior; luego enseña el nuevo, y si falla no deja el viejo', () => {
    entrar();

    poner(slider(), 20);
    expect(total()).toBe('10,00 €');
    expect(atenuado()).toBe(true);
    expect(diceCalculando()).toBe(true);

    esperar(250);
    responder(calculo(20, 18000));
    expect(total()).toBe('180,00 €');
    expect(atenuado()).toBe(false);
    expect(diceCalculando()).toBe(false);

    poner(slider(), 30);
    esperar(250);
    const message = 'Error interno del servidor';
    http
      .expectOne(URL_CALCULAR)
      .flush({ message, tipo: 'ERROR_INTERNO', errors: [] }, { status: 500, statusText: 'Error' });
    TestBed.tick();

    expect(total()).toBeUndefined();
    expect(pantalla.querySelector('[role="alert"]')?.textContent?.trim()).toBe(message);
  });
});
