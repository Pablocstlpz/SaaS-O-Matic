import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Observable } from 'rxjs';

import { SimulacionesService } from './simulaciones.service';

// La URL va escrita entera: así se ve que no hay /api.
const API = 'http://localhost:3000';

describe('SimulacionesService', () => {
  let servicio: SimulacionesService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    servicio = TestBed.inject(SimulacionesService);
    http = TestBed.inject(HttpTestingController);
  });

  const datos = { cliente_id: 7, usuarios: 15, almacenamiento_gb: 100, llamadas_api: 5000 };
  const casos: [string, () => Observable<unknown>, string][] = [
    ['calcular', () => servicio.calcular({ usuarios: 15, pais: 'ES' }), '/simulations/calcular'],
    ['crear', () => servicio.crear(datos), '/simulations'],
  ];

  it.each(casos)('%s llama a su ruta con POST', (_metodo, llamar, ruta) => {
    llamar().subscribe();

    const peticion = http.expectOne(API + ruta);
    expect(peticion.request.method).toBe('POST');
    peticion.flush(null);
    // aquí y no en un afterEach: si fallara allí, el TestBed no se reiniciaría y arrastraría a las demás
    http.verify();
  });
});
