import { describe, expect, it } from 'vitest';
import {
  OTRO_GRADO, actividadVacia, csvInscritos, estadoPublico, leerUrlAsistencia, personaASolicitud, personaVacia,
  urlAsistencia, validarActividad, validarPersona,
} from './actividad';
import { abrirVentana } from './ventanas';

const persona = (cambios = {}) => ({
  ...personaVacia(),
  email: 'ana@urv.cat',
  nombre: 'Ana',
  apellidos: 'Pérez',
  confirmaAsistencia: true,
  aceptaPrivacidad: true,
  ...cambios,
});

describe('actividades', () => {
  it('la persona necesita correo válido, nombre, apellidos y las dos casillas', () => {
    expect(validarPersona(persona())).toEqual({});
    const errores = validarPersona(persona({ email: 'mal', nombre: ' ', confirmaAsistencia: false, aceptaPrivacidad: false }));
    expect(Object.keys(errores).sort()).toEqual(['aceptaPrivacidad', 'confirmaAsistencia', 'email', 'nombre']);
  });

  it('"Otro" grado envía lo que se escribe y es obligatorio', () => {
    expect(validarPersona(persona({ grado: OTRO_GRADO, otroGrado: '' })).grado).toBeDefined();
    expect(personaASolicitud(persona({ grado: OTRO_GRADO, otroGrado: ' Medicina ' })).grado).toBe('Medicina');
    expect(personaASolicitud(persona()).otroGrado).toBeUndefined();
  });

  it('la actividad tiene que acabar después de empezar', () => {
    const base = { ...actividadVacia(), titulo: 'Charla', lugar: 'Aula 1', inicio: '2026-11-19T16:00', fin: '2026-11-19T19:00' };
    expect(validarActividad(base)).toEqual({});
    expect(validarActividad({ ...base, fin: '2026-11-19T15:00' }).fin).toBeDefined();
    expect(validarActividad({ ...base, plazas: 0 }).plazas).toBeDefined();
  });

  it('el enlace del QR se lee igual que se escribe', () => {
    const url = new URL(urlAsistencia('https://codeurv.com', 7, 'AB12CD34EF'));
    expect(leerUrlAsistencia(url.search)).toEqual({ actividadId: 7, codigo: 'AB12CD34EF' });
    expect(leerUrlAsistencia('?asistencia=abc&codigo=X')).toBeNull();
    expect(leerUrlAsistencia('')).toBeNull();
  });

  it('estado público: abierta, completa, cerrada o finalizada', () => {
    expect(estadoPublico({ motivoCerrada: null }).texto).toBe('Inscripción abierta');
    expect(estadoPublico({ motivoCerrada: 'No quedan plazas.', plazasLibres: 0 }).texto).toBe('Completa');
    expect(estadoPublico({ motivoCerrada: 'cerradas', plazasLibres: null }).texto).toBe('Inscripción cerrada');
    expect(estadoPublico({ terminada: true }).texto).toBe('Finalizada');
  });

  it('CSV para Excel: BOM, punto y coma y comillas escapadas', () => {
    const csv = csvInscritos([{ nombre: 'Ana "La" Pro', apellidos: 'Pérez', email: 'a@b.c', grado: 'GEI', curso: '1er', inscritoEn: '2026-11-10T12:00:00', asistioEn: null }]);
    expect(csv.startsWith('﻿')).toBe(true);
    expect(csv).toContain('"Ana ""La"" Pro";"Pérez"');
    expect(csv).toContain('"No"');
  });

  it('una ventana puede abrirse con parámetros y se actualizan al reabrirla', () => {
    const app = { id: 'asistencia', titulo: 'Asistencia', icono: '✅' };
    let lista = abrirVentana([], app, { ancho: 1000, alto: 800 }, 0, { actividadId: 1, codigo: 'A' });
    expect(lista[0].parametros).toEqual({ actividadId: 1, codigo: 'A' });
    lista = abrirVentana(lista, app, { ancho: 1000, alto: 800 }, 1, { actividadId: 1, codigo: 'B' });
    expect(lista).toHaveLength(1);
    expect(lista[0].parametros.codigo).toBe('B');
  });
});
