import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { Calculo, DatosCalculo, DatosSimulacion, Simulacion } from '../interfaces/simulacion';
import { BaseHttpService } from './base-http.service';

// Un método por endpoint de /simulations, tipado, sin estado ni lógica de pantalla.
@Injectable({ providedIn: 'root' })
export class SimulacionesService extends BaseHttpService {
  // calcula sin guardar: es la vista previa del slider
  calcular(datos: DatosCalculo): Observable<Calculo> {
    return this.post<Calculo>('/simulations/calcular', datos);
  }

  crear(datos: DatosSimulacion): Observable<Simulacion> {
    return this.post<Simulacion>('/simulations', datos);
  }
}
