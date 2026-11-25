import { DatePipe } from '@angular/common';
import { Component, computed, input } from '@angular/core';

import { Cliente } from '../../../interfaces/cliente';
import { PAISES } from '../../../shared/regex';

// Hijo de presentación: los datos de un cliente, cada uno en su tarjeta.
@Component({
  selector: 'app-cliente-datos',
  imports: [DatePipe],
  templateUrl: './cliente-datos.html',
  styleUrl: './cliente-datos.css',
  host: { class: 'block' },
})
export class ClienteDatos {
  readonly cliente = input.required<Cliente>();

  // la API manda el código; se pinta el nombre
  protected readonly pais = computed(() => PAISES.find((p) => p.codigo === this.cliente().pais)?.nombre);
}
