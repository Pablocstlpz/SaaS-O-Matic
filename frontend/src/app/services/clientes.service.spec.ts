import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Observable, firstValueFrom } from 'rxjs';

import { DatosCliente } from '../interfaces/cliente';
import { ErrorApi } from './base-http.service';
import { ClientesService } from './clientes.service';

// La URL va escrita entera: así se ve que no hay /api.
const API = 'http://localhost:3000';

const DATOS: DatosCliente = {
  nombre_empresa: 'Acme',
  identificador_fiscal: 'A58818501',
  email_contacto: 'hola@acme.es',
  pais: 'ES',
  plan: 'pro',
};

const CASOS: [string, (servicio: ClientesService) => Observable<unknown>, string, string][] = [
  ['listar', (s) => s.listar(), 'GET', '/customers'],
  ['obtener', (s) => s.obtener(7), 'GET', '/customers/7'],
  ['listarSimulaciones', (s) => s.listarSimulaciones(7), 'GET', '/customers/7/simulations'],
  ['crear', (s) => s.crear(DATOS), 'POST', '/customers'],
];

describe('ClientesService', () => {
  let servicio: ClientesService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    servicio = TestBed.inject(ClientesService);
    http = TestBed.inject(HttpTestingController);
  });

  it.each(CASOS)('%s llama a su ruta y verbo', (_metodo, llamar, verbo, ruta) => {
    llamar(servicio).subscribe();

    const peticion = http.expectOne(API + ruta);
    expect(peticion.request.method).toBe(verbo);
    peticion.flush(null);
    // aquí y no en un afterEach: si fallara allí, el TestBed no se reiniciaría y arrastraría a las demás
    http.verify();
  });

  it('un error del servidor llega como ErrorApi con status, message, tipo y errors', async () => {
    const respuesta = firstValueFrom(servicio.crear(DATOS));
    const message = 'Ya existe un cliente con ese identificador fiscal';
    const tipo = 'IDENTIFICADOR_REPETIDO';
    const errors = [{ campo: 'identificador_fiscal', mensaje: message }];

    http.expectOne(`${API}/customers`).flush({ message, tipo, errors }, { status: 409, statusText: 'Conflict' });

    const error = await respuesta.catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ErrorApi);
    expect(error).toMatchObject({ status: 409, message, tipo, errors });
  });
});
