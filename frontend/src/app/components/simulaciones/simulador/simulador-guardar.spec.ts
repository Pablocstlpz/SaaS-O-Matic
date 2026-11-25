import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { Cliente } from '../../../interfaces/cliente';
import { Calculo } from '../../../interfaces/simulacion';
import { EUR } from '../../../shared/divisas';
import { Simulador } from './simulador';

const URL_GUARDAR = 'http://localhost:3000/simulations';
const URL_CALCULAR = `${URL_GUARDAR}/calcular`;

const CLIENTE: Cliente = {
  id: 7,
  nombre_empresa: 'Acme',
  identificador_fiscal: 'A58818501',
  email_contacto: 'hola@ejemplo.es',
  pais: 'ES',
  plan: 'pro',
  fecha_creacion: '2026-11-25T10:00:00.000Z',
};

// aquí no se miran los importes: basta con que haya un precio vigente
const CALCULO: Calculo = {
  usuarios: 1,
  pais: 'ES',
  tramos: [],
  coste_base_centimos: 1000,
  porcentaje_impuesto: 21,
  impuesto_centimos: 210,
  total_centimos: 1210,
};

describe('Simulador: guardar', () => {
  let http: HttpTestingController;
  let pantalla: HTMLElement;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    const simulador = TestBed.createComponent(Simulador);
    simulador.componentRef.setInput('cliente', CLIENTE);
    simulador.componentRef.setInput('divisa', EUR);
    pantalla = simulador.nativeElement;
    TestBed.tick();
    // sin precio no se puede guardar: se entra con el primer cálculo ya hecho
    calcular();
  });

  afterEach(() => vi.useRealTimers());

  const esperarAlSlider = () => {
    vi.advanceTimersByTime(250);
    TestBed.tick();
  };

  const calcular = () => {
    esperarAlSlider();
    http.expectOne(URL_CALCULAR).flush(CALCULO);
    TestBed.tick();
  };

  const campo = (nombre: string) => {
    const entrada = pantalla.querySelector<HTMLInputElement>(`input[formcontrolname="${nombre}"]`);
    if (!entrada) throw new Error(`No hay campo ${nombre}`);
    return entrada;
  };

  const escribir = (nombre: string, valor: number) => {
    campo(nombre).value = String(valor);
    campo(nombre).dispatchEvent(new Event('input'));
    TestBed.tick();
  };

  const boton = () => {
    const guardar = pantalla.querySelector<HTMLButtonElement>('button');
    if (!guardar) throw new Error('No hay botón de guardar');
    return guardar;
  };

  it('envía cliente_id, usuarios, almacenamiento_gb y llamadas_api, y nada más', () => {
    escribir('usuarios', 15);
    escribir('almacenamiento_gb', 50);
    escribir('llamadas_api', 1000);
    calcular();

    boton().click();

    const { request } = http.expectOne(URL_GUARDAR);
    expect(request.method).toBe('POST');
    expect(request.body).toStrictEqual({ cliente_id: 7, usuarios: 15, almacenamiento_gb: 50, llamadas_api: 1000 });
  });

  it('un 400 se pinta junto a su campo', () => {
    const mensaje = 'El almacenamiento debe ser un número entero de GB entre 0 y 1.000.000';
    boton().click();

    http
      .expectOne(URL_GUARDAR)
      .flush(
        { message: mensaje, tipo: 'VALIDACION', errors: [{ campo: 'almacenamiento_gb', mensaje }] },
        { status: 400, statusText: 'Bad Request' },
      );
    TestBed.tick();

    const hueco = campo('almacenamiento_gb').closest('mat-form-field');
    expect(hueco?.querySelector('mat-error')?.textContent?.trim()).toBe(mensaje);
    // junto al campo, no repetido como error general
    expect(pantalla.querySelector('[role="alert"]')).toBeNull();
  });

  it('mientras calcula no deja guardar', () => {
    // el precio anterior sigue a la vista, pero ya no es el de estos usuarios
    escribir('usuarios', 20);

    expect(boton().disabled).toBe(true);
    boton().click();
    http.expectNone(URL_GUARDAR);
  });

  it('si el cálculo ha fallado no deja guardar', () => {
    escribir('usuarios', 20);
    esperarAlSlider();
    http.expectOne(URL_CALCULAR).flush(null, { status: 500, statusText: 'Error' });
    TestBed.tick();

    expect(boton().disabled).toBe(true);
    boton().click();
    http.expectNone(URL_GUARDAR);
  });

  it('el botón no deja guardar dos veces seguidas', () => {
    // el segundo clic, antes de que la pantalla se repinte
    boton().click();
    boton().click();

    http.expectOne(URL_GUARDAR);
    TestBed.tick();
    expect(boton().disabled).toBe(true);
  });
});
