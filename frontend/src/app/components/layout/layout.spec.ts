import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { DivisasService } from '../../services/divisas.service';
import { EUR } from '../../shared/divisas';
import { Layout } from './layout';

const URL_TIPOS = 'https://open.er-api.com/v6/latest/EUR';
const AVISO = 'No se pueden cargar los tipos de cambio. Los importes se muestran en euros';

describe('Layout: selector de divisa y pie', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => vi.useRealTimers());

  // primer repintado: crea o actualiza el select; este marca su valor en una microtarea, que hay
  // que dejar correr antes del segundo repintado
  const repintar = async () => {
    TestBed.tick();
    await vi.advanceTimersByTimeAsync(0);
    TestBed.tick();
  };

  const montar = async (): Promise<HTMLElement> => {
    const layout = TestBed.createComponent(Layout);
    await repintar();
    return layout.nativeElement;
  };

  const selector = (pantalla: HTMLElement) => pantalla.querySelector<HTMLElement>('header mat-select');
  const aviso = () => document.querySelector('mat-snack-bar-container')?.textContent ?? '';

  // pulsa el selector y devuelve las opciones que se despliegan
  const abrir = (pantalla: HTMLElement): HTMLElement[] => {
    selector(pantalla)?.querySelector<HTMLElement>('.mat-mdc-select-trigger')?.click();
    TestBed.tick();
    return Array.from(document.querySelectorAll<HTMLElement>('mat-option'));
  };

  const esperarSoloEuros = (pantalla: HTMLElement) => {
    expect(TestBed.inject(DivisasService).activa()).toEqual(EUR);
    expect(selector(pantalla)?.textContent).toContain('EUR');
    expect(selector(pantalla)?.getAttribute('aria-disabled')).toBe('true');
    expect(abrir(pantalla)).toHaveLength(0);
    expect(aviso()).toContain(AVISO);
  };

  it('pide los tipos una sola vez aunque haya varios consumidores', async () => {
    await montar();
    await montar();
    TestBed.inject(DivisasService);

    // expectOne falla si hay más de una petición
    http.expectOne(URL_TIPOS);
  });

  it('mientras cargan los tipos, el selector dice «Cargando divisas…»', async () => {
    const caja = (await montar()).querySelector('app-selector-divisa');

    expect(caja?.textContent?.trim()).toBe('Cargando divisas…');

    http.expectOne(URL_TIPOS).flush({ rates: { USD: 1.1, GBP: 0.85 } });
    await repintar();

    expect(caja?.textContent?.trim()).toBe('EUR');
  });

  it('el pie cita a ExchangeRate-API con su enlace', async () => {
    const pie = (await montar()).querySelector('footer');

    expect(pie?.textContent?.replace(/\s+/g, ' ').trim()).toBe('Tipos de cambio por ExchangeRate-API');
    const enlace = pie?.querySelector('a');
    expect(enlace?.getAttribute('href')).toBe('https://www.exchangerate-api.com');
    expect(enlace?.getAttribute('target')).toBe('_blank');
    expect(enlace?.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('con la API caída sigue en euros, no deja cambiar y avisa', async () => {
    const pantalla = await montar();

    http.expectOne(URL_TIPOS).flush(null, { status: 500, statusText: 'Error' });
    await repintar();

    esperarSoloEuros(pantalla);
  });

  it('sin respuesta a los 5 s se comporta como con la API caída', async () => {
    const pantalla = await montar();
    const peticion = http.expectOne(URL_TIPOS);

    vi.advanceTimersByTime(5000);
    await repintar();

    esperarSoloEuros(pantalla);
    expect(peticion.cancelled).toBe(true);
  });

  it('con respuesta antes de los 5 s usa los tipos', async () => {
    const pantalla = await montar();
    const peticion = http.expectOne(URL_TIPOS);

    vi.advanceTimersByTime(4999);
    peticion.flush({ rates: { USD: 1.1, GBP: 0.85 } });
    vi.advanceTimersByTime(1);
    await repintar();
    abrir(pantalla)
      .find((opcion) => opcion.textContent?.trim() === 'USD')
      ?.click();
    await repintar();

    expect(TestBed.inject(DivisasService).activa()).toEqual({ codigo: 'USD', cambio: 1.1 });
    expect(selector(pantalla)?.textContent).toContain('USD');
    expect(aviso()).toBe('');
  });
});
