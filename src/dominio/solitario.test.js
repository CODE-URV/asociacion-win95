import { describe, expect, it } from 'vitest';
import {
  aColumna, aFundacion, crearPartida, desdeColumna, desdeDescarte, haGanado, hayMovimientos, mismoOrigen, mover,
  moverAColumna, moverAFundacion, robar,
} from './solitario';

const carta = (lenguaje, rango, valor, bocaArriba = true) => ({ id: `${lenguaje}-${rango}`, lenguaje, rango, valor, bocaArriba });
const vacia = () => ({ mazo: [], descarte: [], fundaciones: [[], [], [], []], columnas: [[], [], [], [], [], [], []], movimientos: 0 });

describe('solitario', () => {
  it('reparte 28 cartas en columnas (solo la última boca arriba) y 24 en el mazo', () => {
    const p = crearPartida();
    expect(p.columnas.map((c) => c.length)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(p.columnas.every((c) => c.slice(0, -1).every((x) => !x.bocaArriba) && c.at(-1).bocaArriba)).toBe(true);
    expect(p.mazo).toHaveLength(24);
    expect(new Set([...p.mazo, ...p.columnas.flat()].map((c) => c.id)).size).toBe(52);
  });

  it('robar pasa 3 cartas al descarte y al acabar el mazo lo vuelve a llenar', () => {
    let p = crearPartida();
    p = robar(p);
    expect(p.descarte).toHaveLength(3);
    expect(p.descarte.every((c) => c.bocaArriba)).toBe(true);
    for (let i = 0; i < 7; i++) p = robar(p);
    expect(p.mazo).toHaveLength(0);
    p = robar(p);
    expect(p.mazo).toHaveLength(24);
    expect(p.descarte).toHaveLength(0);
  });

  it('a la fundación de Java solo va el As de Java, y luego el 2', () => {
    const p = { ...vacia(), descarte: [carta('Python', 'A', 1)] };
    expect(moverAFundacion(p, desdeDescarte(), 0)).toBeNull(); // fundación 0 = Java
    const ok = moverAFundacion({ ...vacia(), descarte: [carta('Java', 'A', 1)] }, desdeDescarte(), 0);
    expect(ok.fundaciones[0]).toHaveLength(1);
    expect(ok.movimientos).toBe(1);
  });

  it('en columna: descendente y de distinto lenguaje; al mover se destapa la carta de debajo', () => {
    const p = vacia();
    p.columnas[0] = [carta('Java', '5', 5, false), carta('Python', '8', 8)];
    p.columnas[1] = [carta('Java', '9', 9)];
    const r = moverAColumna(p, desdeColumna(0, 1), 1);
    expect(r.columnas[1].map((c) => c.id)).toEqual(['Java-9', 'Python-8']);
    expect(r.columnas[0][0].bocaArriba).toBe(true);
    // Mismo lenguaje no vale
    p.columnas[2] = [carta('Python', '9', 9)];
    expect(moverAColumna(p, desdeColumna(0, 1), 2)).toBeNull();
  });

  it('en columna vacía solo entra un K', () => {
    const p = { ...vacia(), descarte: [carta('C++', 'Q', 12)] };
    expect(moverAColumna(p, desdeDescarte(), 0)).toBeNull();
    const k = { ...vacia(), descarte: [carta('C++', 'K', 13)] };
    expect(moverAColumna(k, desdeDescarte(), 0).columnas[0]).toHaveLength(1);
  });

  it('mover() acepta fundación o columna como destino (modo táctil)', () => {
    const p = { ...vacia(), descarte: [carta('Java', 'A', 1)] };
    expect(mover(p, desdeDescarte(), aFundacion(0)).fundaciones[0]).toHaveLength(1);
    expect(mover(p, desdeDescarte(), aColumna(0))).toBeNull(); // un As no va a columna vacía
  });

  it('mismoOrigen compara tipo, columna y posición', () => {
    expect(mismoOrigen(desdeColumna(2, 3), desdeColumna(2, 3))).toBe(true);
    expect(mismoOrigen(desdeColumna(2, 3), desdeColumna(2, 4))).toBe(false);
    expect(mismoOrigen(desdeDescarte(), desdeDescarte())).toBe(true);
    expect(mismoOrigen(null, desdeDescarte())).toBe(false);
  });

  it('no modifica el estado original', () => {
    const p = { ...vacia(), descarte: [carta('Java', 'A', 1)] };
    moverAFundacion(p, desdeDescarte(), 0);
    expect(p.descarte).toHaveLength(1);
  });

  it('detecta victoria y partida sin movimientos', () => {
    const llena = vacia();
    llena.fundaciones = [0, 1, 2, 3].map(() => Array.from({ length: 13 }, (_, i) => carta('X', String(i), i + 1)));
    expect(haGanado(llena)).toBe(true);

    const bloqueada = vacia();
    bloqueada.columnas[0] = [carta('Java', '3', 3)];
    bloqueada.columnas[1] = [carta('Java', '9', 9)];
    expect(hayMovimientos(bloqueada)).toBe(false);
  });
});
