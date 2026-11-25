import { Pipe, PipeTransform } from '@angular/core';

// EJEMPLO de pipe: transforma un valor SOLO para mostrarlo en la plantilla. No cambia datos,
// no llama a servicios y no guarda estado: si hace algo de eso, no es un pipe.
//   {{ fila.fecha_actualizacion | tiempoRelativo: idioma.actual() }}  ->  «hace 3 días»
//
// Es puro (lo normal): Angular solo lo recalcula cuando cambia la entrada o un argumento.
// Por eso el idioma llega como argumento; si se leyera aqui dentro, al cambiar de idioma no se repintaria.

// de mayor a menor, en segundos
const UNIDADES: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 31_536_000],
  ['month', 2_592_000],
  ['week', 604_800],
  ['day', 86_400],
  ['hour', 3_600],
  ['minute', 60],
];

@Pipe({ name: 'tiempoRelativo' })
export class TiempoRelativoPipe implements PipeTransform {
  // `ahora` solo lo pasan las pruebas, para que el resultado no dependa del reloj
  transform(fecha: string | Date | null | undefined, idioma = 'es', ahora = new Date()): string {
    if (!fecha) return '';
    const segundos = (new Date(fecha).getTime() - ahora.getTime()) / 1000;
    if (Number.isNaN(segundos)) return '';

    const formato = new Intl.RelativeTimeFormat(idioma, { numeric: 'auto' });
    for (const [unidad, tamano] of UNIDADES) {
      if (Math.abs(segundos) >= tamano) return formato.format(Math.round(segundos / tamano), unidad);
    }
    return formato.format(0, 'second'); // «ahora»
  }
}
