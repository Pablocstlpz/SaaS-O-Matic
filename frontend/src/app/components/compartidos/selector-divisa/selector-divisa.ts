import { Component, input, output } from '@angular/core';
import { MatSelectModule } from '@angular/material/select';

import { CODIGOS_DIVISA, CodigoDivisa } from '../../../shared/divisas';

// Pieza compartida de presentacion: recibe datos por input() y avisa por output(), sin servicios.
@Component({
  selector: 'app-selector-divisa',
  imports: [MatSelectModule],
  templateUrl: './selector-divisa.html',
  styleUrl: './selector-divisa.css',
})
export class SelectorDivisa {
  readonly divisa = input.required<CodigoDivisa>();
  // false mientras no haya tipos de cambio: no se puede salir de euros
  readonly disponible = input.required<boolean>();
  // true mientras se esperan los tipos
  readonly cargando = input.required<boolean>();
  readonly elegir = output<CodigoDivisa>();

  protected readonly codigos = CODIGOS_DIVISA;
}
