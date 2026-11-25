// EJEMPLO de prueba de una funcion pura: sin TestBed, sin HTTP, sin reloj.
import { TiempoRelativoPipe } from './tiempo-relativo-pipe';

describe('TiempoRelativoPipe', () => {
  const pipe = new TiempoRelativoPipe();
  const ahora = new Date('2026-10-20T12:00:00Z');

  it('cuenta días hacia atrás en castellano y en inglés', () => {
    expect(pipe.transform('2026-10-17T12:00:00Z', 'es', ahora)).toBe('hace 3 días');
    expect(pipe.transform('2026-10-17T12:00:00Z', 'en', ahora)).toBe('3 days ago');
  });

  it('usa palabras para los casos cercanos', () => {
    expect(pipe.transform('2026-10-19T12:00:00Z', 'es', ahora)).toBe('ayer');
    expect(pipe.transform('2026-10-20T11:59:30Z', 'es', ahora)).toBe('ahora');
  });

  it('elige la unidad más grande que cabe', () => {
    expect(pipe.transform('2026-10-20T09:00:00Z', 'es', ahora)).toBe('hace 3 horas');
    expect(pipe.transform('2025-10-20T12:00:00Z', 'es', ahora)).toBe('el año pasado');
  });

  it('sin fecha o con una fecha imposible no pinta nada', () => {
    expect(pipe.transform(null, 'es', ahora)).toBe('');
    expect(pipe.transform('no es una fecha', 'es', ahora)).toBe('');
  });
});
