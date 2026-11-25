import { formatCurrency, getCurrencySymbol } from '@angular/common';
import { LOCALE_ID, Pipe, PipeTransform, inject } from '@angular/core';

import { Divisa, sumarConvertidas } from '../shared/divisas';

// Céntimos de euro -> texto en la divisa elegida:
//   {{ linea.subtotal_centimos | importe: divisa }}
//   {{ [s.coste_base_centimos, s.impuesto_centimos] | importe: divisa }}   (el total de esas líneas)
// Un total se pide con sus líneas, no con el total en euros, para que cuadre (spec §5).
// Es puro: la divisa llega como argumento, así al cambiarla se vuelve a pintar.
@Pipe({ name: 'importe' })
export class ImportePipe implements PipeTransform {
  private readonly idioma = inject(LOCALE_ID);

  transform(centimos: number | readonly number[], divisa: Divisa): string {
    const lineas = typeof centimos === 'number' ? [centimos] : centimos;
    const importe = sumarConvertidas(lineas, divisa) / 100;
    const simbolo = getCurrencySymbol(divisa.codigo, 'wide', this.idioma);
    return formatCurrency(importe, this.idioma, simbolo, divisa.codigo);
  }
}
