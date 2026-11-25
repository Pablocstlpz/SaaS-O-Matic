import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, input } from '@angular/core';

import { Simulacion } from '../../../interfaces/simulacion';
import { ImportePipe } from '../../../pipes/importe.pipe';
import { Divisa } from '../../../shared/divisas';

// Hijo de presentación: las simulaciones guardadas, en el orden en que llegan (la API manda la
// más nueva primero). Los importes llegan en céntimos de euro y solo se convierten al pintar.
@Component({
  selector: 'app-historial-simulaciones',
  imports: [DatePipe, DecimalPipe, ImportePipe],
  templateUrl: './historial-simulaciones.html',
  styleUrl: './historial-simulaciones.css',
  host: { class: 'block' },
})
export class HistorialSimulaciones {
  readonly simulaciones = input.required<Simulacion[]>();
  readonly divisa = input.required<Divisa>();
}
