import { describe, expect, it } from 'vitest';
import {
  OPCION_SOCIO_ANTERIOR, aSolicitud, cuota, elegirSocioAnterior, formularioInicial, necesitaTalla, validar,
} from './inscripcion';

const completo = () => ({ ...formularioInicial(), nombre: 'Ana', correo: 'ana@urv.cat', telefono: '600000000', talla: 'M' });

describe('inscripción', () => {
  it('socio nuevo: 8€ y talla obligatoria', () => {
    const f = formularioInicial();
    expect(cuota(f).importe).toBe('8€');
    expect(necesitaTalla(f)).toBe(true);
    expect(validar({ ...completo(), talla: '' })).toMatch(/talla/i);
  });

  it('socio anterior: 5€, sin talla y se borra la que hubiera', () => {
    const f = elegirSocioAnterior(completo(), OPCION_SOCIO_ANTERIOR);
    expect(cuota(f).importe).toBe('5€');
    expect(f.talla).toBe('');
    expect(validar(f)).toBeNull();
  });

  it('valida los campos obligatorios en orden', () => {
    expect(validar(formularioInicial())).toMatch(/nombre/i);
    expect(validar({ ...completo(), telefono: ' ' })).toMatch(/teléfono/i);
    expect(validar(completo())).toBeNull();
  });

  it('la solicitud no envía talla si no hace falta', () => {
    const f = elegirSocioAnterior({ ...completo(), talla: 'L' }, OPCION_SOCIO_ANTERIOR);
    expect(aSolicitud(f).talla).toBe('');
    expect(Object.keys(aSolicitud(completo()))).toEqual(['socioAnterior', 'grado', 'curso', 'talla', 'nombre', 'correo', 'telefono']);
  });
});
