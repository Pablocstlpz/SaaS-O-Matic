import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { Cliente } from '../../../interfaces/cliente';
import { NotificacionesService } from '../../../services/notificaciones.service';
import { LIMITES } from '../../../shared/regex';
import { ClienteAlta } from './cliente-alta';

const URL_CLIENTES = 'http://localhost:3000/customers';

const NOMBRE_MAL = 'El nombre de empresa debe ser un texto de 2 a 120 caracteres';
const EMAIL_MAL = 'El email de contacto debe ser una dirección válida de 254 caracteres como máximo';
const IDENTIFICADOR_MAL = 'El identificador fiscal debe ser válido para el país elegido';
const REPETIDO = 'Ya existe un cliente con ese identificador fiscal';

const CREADO: Cliente = {
  id: 9,
  nombre_empresa: 'Acme',
  identificador_fiscal: '12345678Z',
  email_contacto: 'hola@ejemplo.es',
  pais: 'ES',
  plan: 'pro',
  fecha_creacion: '2026-11-25T10:00:00.000Z',
};

describe('ClienteAlta', () => {
  let http: HttpTestingController;
  let pantalla: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])] });
    http = TestBed.inject(HttpTestingController);
    pantalla = TestBed.createComponent(ClienteAlta).nativeElement;
    TestBed.tick();
  });

  const control = (nombre: string) => {
    const elemento = pantalla.querySelector<HTMLElement>(`[formcontrolname="${nombre}"]`);
    if (!elemento) throw new Error(`No hay campo ${nombre}`);
    return elemento;
  };

  // el aviso junto al campo; null si no hay
  const aviso = (nombre: string) =>
    control(nombre).closest('mat-form-field')?.querySelector('mat-error')?.textContent?.trim() ?? null;

  const escribir = (nombre: string, valor: string) => {
    const entrada = control(nombre);
    if (!(entrada instanceof HTMLInputElement)) throw new Error(`${nombre} no es un campo de texto`);
    entrada.value = valor;
    entrada.dispatchEvent(new Event('input'));
    TestBed.tick();
  };

  const elegir = (nombre: string, texto: string) => {
    control(nombre).querySelector<HTMLElement>('.mat-mdc-select-trigger')?.click();
    TestBed.tick();
    const opciones = Array.from(document.querySelectorAll<HTMLElement>('mat-option'));
    opciones.find((opcion) => opcion.textContent?.trim() === texto)?.click();
    TestBed.tick();
  };

  const rellenar = (identificador: string) => {
    escribir('nombre_empresa', 'Acme');
    escribir('email_contacto', 'hola@ejemplo.es');
    elegir('pais', 'España');
    escribir('identificador_fiscal', identificador);
    elegir('plan', 'pro');
  };

  const enviar = () => {
    pantalla.querySelector<HTMLButtonElement>('button[type="submit"]')?.click();
    TestBed.tick();
  };

  const responderError = (status: number, tipo: string, mensaje: string) => {
    const errors = [{ campo: 'identificador_fiscal', mensaje }];
    http.expectOne(URL_CLIENTES).flush({ message: mensaje, tipo, errors }, { status, statusText: 'Error' });
    TestBed.tick();
  };

  it('cada campo avisa en vivo con los límites de shared/regex.ts', () => {
    const { NOMBRE_EMPRESA_MIN, NOMBRE_EMPRESA_MAX, EMAIL_MAX } = LIMITES;
    const { IDENTIFICADOR_EXTRANJERO_MIN, IDENTIFICADOR_EXTRANJERO_MAX } = LIMITES;
    const email = (largo: number) => `${'a'.repeat(largo - '@ejemplo.es'.length)}@ejemplo.es`;
    // fuera de España el identificador solo tiene longitud
    elegir('pais', 'Francia');
    const casos: [string, string, string | null][] = [
      ['nombre_empresa', 'x'.repeat(NOMBRE_EMPRESA_MIN - 1), NOMBRE_MAL],
      ['nombre_empresa', 'x'.repeat(NOMBRE_EMPRESA_MIN), null],
      ['nombre_empresa', 'x'.repeat(NOMBRE_EMPRESA_MAX), null],
      ['nombre_empresa', 'x'.repeat(NOMBRE_EMPRESA_MAX + 1), NOMBRE_MAL],
      ['email_contacto', email(EMAIL_MAX), null],
      ['email_contacto', email(EMAIL_MAX + 1), EMAIL_MAL],
      ['identificador_fiscal', '7'.repeat(IDENTIFICADOR_EXTRANJERO_MIN - 1), IDENTIFICADOR_MAL],
      ['identificador_fiscal', '7'.repeat(IDENTIFICADOR_EXTRANJERO_MIN), null],
      ['identificador_fiscal', '7'.repeat(IDENTIFICADOR_EXTRANJERO_MAX), null],
      ['identificador_fiscal', '7'.repeat(IDENTIFICADOR_EXTRANJERO_MAX + 1), IDENTIFICADOR_MAL],
    ];

    // sin salir del campo ni enviar
    for (const [campo, valor, esperado] of casos) {
      escribir(campo, valor);
      expect(aviso(campo), `${campo} con ${valor.length} caracteres`).toBe(esperado);
    }
  });

  it('el identificador fiscal solo se comprueba en formato y longitud: 12345678A pasa el formulario', () => {
    rellenar('12345678A');

    expect(aviso('identificador_fiscal')).toBeNull();
    enviar();
    expect(http.expectOne(URL_CLIENTES).request.body).toMatchObject({ identificador_fiscal: '12345678A' });
  });

  it('un 400 con errors en identificador_fiscal se pinta junto a ese campo', () => {
    rellenar('12345678A');
    enviar();
    responderError(400, 'VALIDACION', IDENTIFICADOR_MAL);

    expect(aviso('identificador_fiscal')).toBe(IDENTIFICADOR_MAL);
    // junto al campo, no repetido como error general
    expect(pantalla.querySelector('[role="alert"]')).toBeNull();
  });

  it('un 409 IDENTIFICADOR_REPETIDO se pinta junto al identificador', () => {
    rellenar('12345678Z');
    enviar();
    responderError(409, 'IDENTIFICADOR_REPETIDO', REPETIDO);

    expect(aviso('identificador_fiscal')).toBe(REPETIDO);
    expect(pantalla.querySelector('[role="alert"]')).toBeNull();
  });

  it('al crear, avisa y lleva al detalle', () => {
    const avisar = vi.spyOn(TestBed.inject(NotificacionesService), 'aviso').mockImplementation(() => undefined);
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    rellenar('12345678Z');
    enviar();

    http.expectOne(URL_CLIENTES).flush(CREADO, { status: 201, statusText: 'Created' });

    expect(avisar).toHaveBeenCalledWith('Cliente dado de alta');
    expect(navegar).toHaveBeenCalledWith(['/clientes', 9]);
  });
});
