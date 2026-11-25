import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { Calculo } from '../../../interfaces/simulacion';
import { Divisa } from '../../../shared/divisas';
import { DesglosePrecio } from './desglose-precio';

// España y 15 usuarios, como lo devuelve la API
const CALCULO: Calculo = {
  usuarios: 15,
  pais: 'ES',
  tramos: [
    { desde: 1, hasta: 10, usuarios: 10, precio_unitario_centimos: 1000, subtotal_centimos: 10000 },
    { desde: 11, hasta: 50, usuarios: 5, precio_unitario_centimos: 800, subtotal_centimos: 4000 },
  ],
  coste_base_centimos: 14000,
  porcentaje_impuesto: 21,
  impuesto_centimos: 2940,
  total_centimos: 16940,
};

describe('DesglosePrecio', () => {
  beforeAll(() => registerLocaleData(localeEs));

  // a este cambio, la base convertida de golpe daría 154,01 y el total, 186,35
  const DOLARES: Divisa = { codigo: 'USD', cambio: 1.10004 };

  // devuelve cómo leer la pantalla: el texto de cada elemento, con los espacios reducidos a uno
  const montar = (calculo: Calculo) => {
    TestBed.configureTestingModule({ providers: [{ provide: LOCALE_ID, useValue: 'es-ES' }] });
    const desglose = TestBed.createComponent(DesglosePrecio);
    desglose.componentRef.setInput('calculo', calculo);
    desglose.componentRef.setInput('divisa', DOLARES);
    desglose.componentRef.setInput('calculando', false);
    TestBed.tick();

    const pantalla: HTMLElement = desglose.nativeElement;
    return (selector: string) =>
      Array.from(pantalla.querySelectorAll(selector), (e) => e.textContent?.replace(/\s+/g, ' ').trim());
  };

  it('los tramos convertidos suman la base, y la base más el impuesto suman el total', () => {
    const textos = montar(CALCULO);
    const lineas = (nombre: string) => textos(`[data-linea="${nombre}"]`);

    // 110,00 + 44,00 = 154,00 y 154,00 + 32,34 = 186,34
    expect(lineas('tramo')).toEqual(['110,00 US$', '44,00 US$']);
    expect(lineas('base')).toEqual(['154,00 US$']);
    expect(lineas('impuesto')).toEqual(['32,34 US$']);
    expect(lineas('total')).toEqual(['186,34 US$']);
  });

  it('en otra divisa, el precio por usuario sigue en euros', () => {
    const [primero, segundo] = CALCULO.tramos;
    // 11 usuarios: el segundo tramo tiene uno solo
    const textos = montar({ ...CALCULO, tramos: [primero, { ...segundo, usuarios: 1, subtotal_centimos: 800 }] });

    expect(textos('[data-tarifa]')).toEqual(['10 usuarios × 10,00 €', '1 usuario × 8,00 €']);
  });
});
