import { describe, expect, it } from 'vitest';
import { colorDeEstado, filtrar, listaDesdeTexto, proyectoVacio, validar } from './proyecto';

describe('proyecto', () => {
  it('un proyecto con nombre es válido', () => {
    expect(validar({ ...proyectoVacio(), nombre: 'Web' })).toEqual({});
  });

  it('detecta los errores por campo', () => {
    const errores = validar({
      ...proyectoVacio(),
      nombre: ' ',
      progreso: 150,
      email: 'no-es-email',
      repositorio: 'github.com/x',
      estado: 'Inventado',
    });
    expect(Object.keys(errores).sort()).toEqual(['email', 'estado', 'nombre', 'progreso', 'repositorio']);
  });

  it('convierte listas escritas a mano', () => {
    expect(listaDesdeTexto('React | PHP, MySQL,, ')).toEqual(['React', 'PHP', 'MySQL']);
  });

  it('filtra por estado sin importar mayúsculas', () => {
    const lista = [{ estado: 'En Progreso' }, { estado: 'completado' }];
    expect(filtrar(lista, 'Completado')).toHaveLength(1);
    expect(filtrar(lista, 'Todos')).toHaveLength(2);
  });

  it('estado desconocido usa gris', () => {
    expect(colorDeEstado('???')).toBe('#808080');
  });
});
