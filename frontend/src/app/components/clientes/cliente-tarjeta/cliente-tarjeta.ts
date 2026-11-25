import { Component, computed, input } from '@angular/core';

import { Cliente } from '../../../interfaces/cliente';
import { PAISES } from '../../../shared/regex';

// Hijo de presentación: pinta un cliente. El enlace al detalle lo pone el padre.
@Component({
  selector: 'app-cliente-tarjeta',
  templateUrl: './cliente-tarjeta.html',
  styleUrl: './cliente-tarjeta.css',
  // columna a toda la altura: país y plan quedan alineados entre tarjetas de la misma fila
  host: { class: 'flex h-full flex-col' },
})
export class ClienteTarjeta {
  readonly cliente = input.required<Cliente>();

  // la API manda el código; se pinta el nombre
  protected readonly pais = computed(() => PAISES.find((p) => p.codigo === this.cliente().pais)?.nombre);
}
