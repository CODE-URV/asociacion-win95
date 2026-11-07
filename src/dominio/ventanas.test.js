import { describe, expect, it } from 'vitest';
import {
  abrirVentana, cerrarApps, cerrarVentana, encajarEnPantalla, minimizarVentana, traerAlFrente,
} from './ventanas';

const pantalla = { ancho: 1280, alto: 800 };
const app = (id, tamano) => ({ id, titulo: id, icono: '•', tamano });

describe('gestor de ventanas', () => {
  it('abre una ventana nueva encima de las demás', () => {
    const una = abrirVentana([], app('a'), pantalla, 0);
    const dos = abrirVentana(una, app('b'), pantalla, 1);
    expect(dos).toHaveLength(2);
    expect(dos[1].zIndex).toBeGreaterThan(dos[0].zIndex);
  });

  it('no duplica una aplicación ya abierta: la restaura y la trae al frente', () => {
    let lista = abrirVentana([], app('a'), pantalla, 0);
    lista = abrirVentana(lista, app('b'), pantalla, 1);
    lista = minimizarVentana(lista, lista[0].id);
    lista = abrirVentana(lista, app('a'), pantalla, 2);

    expect(lista).toHaveLength(2);
    const a = lista.find((v) => v.appId === 'a');
    expect(a.minimized).toBe(false);
    expect(a.zIndex).toBeGreaterThan(lista.find((v) => v.appId === 'b').zIndex);
  });

  it('ajusta al tamaño de la pantalla las ventanas demasiado grandes', () => {
    const [v] = abrirVentana([], app('solitario', { ancho: 800, alto: 600 }), { ancho: 700, alto: 500 }, 0);
    expect(v.x + v.width).toBeLessThanOrEqual(700);
    expect(v.y + v.height).toBeLessThanOrEqual(500 - 48);
  });

  it('encajarEnPantalla mantiene la ventana dentro de los márgenes', () => {
    const g = encajarEnPantalla({ x: -50, y: 2000, width: 400, height: 300 }, pantalla);
    expect(g.x).toBeGreaterThanOrEqual(0);
    expect(g.y + g.height).toBeLessThanOrEqual(pantalla.alto);
  });

  it('cierra ventanas por id y por aplicación', () => {
    let lista = abrirVentana([], app('a'), pantalla, 0);
    lista = abrirVentana(lista, app('panel'), pantalla, 1);
    expect(cerrarVentana(lista, lista[0].id).map((v) => v.appId)).toEqual(['panel']);
    expect(cerrarApps(lista, ['panel']).map((v) => v.appId)).toEqual(['a']);
  });

  it('traerAlFrente con restaurar quita el minimizado', () => {
    let lista = abrirVentana([], app('a'), pantalla, 0);
    lista = minimizarVentana(lista, lista[0].id);
    expect(traerAlFrente(lista, lista[0].id, { restaurar: true })[0].minimized).toBe(false);
  });
});
