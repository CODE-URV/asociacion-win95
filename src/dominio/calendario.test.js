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

describe('edición de eventos', () => {
  it('valida título y orden de fechas (todo el día admite el mismo día)', async () => {
    const { validarEvento } = await import('./calendario');
    expect(validarEvento({ titulo: 'Hackathon', todoElDia: true, inicio: '2026-12-05', fin: '2026-12-05' })).toEqual({});
    expect(validarEvento({ titulo: 'Charla', todoElDia: false, inicio: '2026-12-05T18:00', fin: '2026-12-05T18:00' }).fin).toBeDefined();
    expect(validarEvento({ titulo: ' ', todoElDia: false, inicio: '', fin: '' })).toHaveProperty('titulo');
  });

  it('al marcar "todo el día" las fechas pierden la hora y al desmarcarlo la recuperan', async () => {
    const { cambiarTodoElDia } = await import('./calendario');
    const diaCompleto = cambiarTodoElDia({ titulo: 'x', todoElDia: false, inicio: '2026-12-05T10:00', fin: '2026-12-05T12:00' }, true);
    expect([diaCompleto.inicio, diaCompleto.fin]).toEqual(['2026-12-05', '2026-12-05']);
    const conHora = cambiarTodoElDia(diaCompleto, false);
    expect([conHora.inicio, conHora.fin]).toEqual(['2026-12-05T18:00', '2026-12-05T19:00']);
  });

  it('texto de fecha para la lista del panel', async () => {
    const { textoFechaEvento } = await import('./calendario');
    expect(textoFechaEvento({ todoElDia: false, inicio: '2026-11-18T15:10', fin: '2026-11-18T16:10' })).toMatch(/15:10–16:10$/);
    expect(textoFechaEvento({ todoElDia: true, inicio: '2026-12-05', fin: '2026-12-05' })).toMatch(/todo el día$/);
  });
});