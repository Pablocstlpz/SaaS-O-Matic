import { DecimalPipe } from '@angular/common';
import { Component, computed, input } from '@angular/core';

import { Calculo } from '../../../interfaces/simulacion';
import { ImportePipe } from '../../../pipes/importe.pipe';
import { Divisa, EUR } from '../../../shared/divisas';

// Hijo de presentación: el precio que ha calculado la API, línea a línea. No calcula precios:
// solo convierte al pintar.
@Component({
  selector: 'app-desglose-precio',
  imports: [DecimalPipe, ImportePipe],
  templateUrl: './desglose-precio.html',
  styleUrl: './desglose-precio.css',
  host: { class: 'block' },
})
export class DesglosePrecio {
  readonly calculo = input.required<Calculo>();
  readonly divisa = input.required<Divisa>();
  // true: el precio que se ve ya no es el vigente
  readonly calculando = input.required<boolean>();

  // el precio por usuario es la tarifa: se pinta siempre en euros (spec §5)
  protected readonly euros = EUR;

  // la base se pide con los tramos y el total con los tramos y el impuesto: cada línea se convierte
  // por separado y lo que se ve cuadra (spec §5)
  protected readonly lineasBase = computed(() => this.calculo().tramos.map((tramo) => tramo.subtotal_centimos));
  protected readonly lineasTotal = computed(() => [...this.lineasBase(), this.calculo().impuesto_centimos]);
}
