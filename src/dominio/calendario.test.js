import { describe, expect, it } from 'vitest';
import { DIAS_SEMANA, agruparPorDia, celdasDelMes } from './calendario';

describe('calendario', () => {
  it('la semana empieza en lunes', () => {
    expect(DIAS_SEMANA[0]).toBe('L');
    expect(DIAS_SEMANA[6]).toBe('D');
  });

  it('el 1 de noviembre de 2026 (domingo) cae en la columna del domingo', () => {
    const celdas = celdasDelMes(2026, 10);
    const indice = celdas.findIndex((c) => c?.dia === 1);
    expect(indice % 7).toBe(6);
    expect(celdas.filter(Boolean)).toHaveLength(30);
  });

  it('un mes que empieza en lunes no tiene huecos', () => {
    // 1 de junio de 2026 es lunes
    expect(celdasDelMes(2026, 5)[0]).toEqual({ dia: 1, clave: '2026-06-01' });
  });

  it('agrupa eventos por día, con hora o de día completo', () => {
    const mapa = agruparPorDia([
      { id: 'a', inicio: '2026-11-07T18:00:00+01:00' },
      { id: 'b', inicio: '2026-11-07' },
      { id: 'c', inicio: '2026-11-09' },
    ]);
    expect(mapa['2026-11-07'].map((e) => e.id)).toEqual(['a', 'b']);
    expect(mapa['2026-11-09']).toHaveLength(1);
  });
});
