// EJEMPLO de prueba de un servicio: URL, verbo y cuerpo correctos, y errores traducidos a ErrorApi.
// Ejecutar: npm test
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../environments/environment';
import { ErrorApi } from './base-http.service';
import { ProductosService } from './productos.service';

describe('ProductosService', () => {
  let servicio: ProductosService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    servicio = TestBed.inject(ProductosService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('crear hace POST /productos con los datos', async () => {
    const respuesta = firstValueFrom(servicio.crear({ nombre: 'Mesa', precio: 10, estado: 'activo' }));

    const peticion = http.expectOne(`${environment.apiUrl}/productos`);
    expect(peticion.request.method).toBe('POST');
    expect(peticion.request.body).toEqual({ nombre: 'Mesa', precio: 10, estado: 'activo' });
    peticion.flush({ id: 1, nombre: 'Mesa', precio: 10 });

    expect((await respuesta).id).toBe(1);
  });

  it('un error de la API llega como ErrorApi con message, status y tipo', async () => {
    const respuesta = firstValueFrom(servicio.crear({ nombre: 'Mesa', precio: 10, estado: 'activo' }));

    http
      .expectOne(`${environment.apiUrl}/productos`)
      .flush(
        { message: 'Ya existe un producto llamado «Mesa»', tipo: 'NOMBRE_REPETIDO' },
        { status: 409, statusText: 'Conflict' },
      );

    const error = await respuesta.catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ErrorApi);
    expect(error).toMatchObject({ status: 409, tipo: 'NOMBRE_REPETIDO' });
  });

  it('sin conexión (status 0) el mensaje es el nuestro, no el "Failed to fetch" del navegador', async () => {
    const respuesta = firstValueFrom(servicio.listar());

    http.expectOne(`${environment.apiUrl}/productos`).error(new ProgressEvent('error'), { status: 0 });
    // con withFetch el error trae el TypeError del navegador; se simula con un objeto que lleva message
    const conFetch = firstValueFrom(servicio.listar());
    http
      .expectOne(`${environment.apiUrl}/productos`)
      .flush(new TypeError('Failed to fetch'), { status: 0, statusText: '' });

    for (const promesa of [respuesta, conFetch]) {
      const error = await promesa.catch((e: unknown) => e);
      expect(error).toBeInstanceOf(ErrorApi);
      expect((error as ErrorApi).message).toBe('No se puede conectar con el servidor');
    }
  });
});
