import { Divisa, EUR, convertir, sumarConvertidas } from './divisas';

describe('divisas', () => {
  it('el total es la suma de las líneas convertidas, no el total convertido de golpe', () => {
    const dolares: Divisa = { codigo: 'USD', cambio: 1.105 };
    // cada línea: 100 × 1,105 = 110,5 -> 111; de golpe: 300 × 1,105 = 331,5 -> 332
    const lineas = [100, 100, 100];

    expect(convertir(300, dolares)).toBe(332);
    expect(sumarConvertidas(lineas, dolares)).toBe(333);
  });

  it('en EUR no cambia nada', () => {
    const lineas = [10000, 4000, 2940, 1];

    expect(lineas.map((linea) => convertir(linea, EUR))).toEqual(lineas);
    expect(sumarConvertidas(lineas, EUR)).toBe(16941);
  });
});
