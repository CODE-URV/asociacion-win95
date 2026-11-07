import { describe, expect, it } from 'vitest';
import { SESION_INVITADO, crearSesionAdmin, interpretarInicioSesion, puedeUsarApp } from './sesion';

describe('inicio de sesión', () => {
  it('Invitado o vacío entra como invitado, sin mirar la contraseña', () => {
    expect(interpretarInicioSesion('Invitado', '')).toEqual({ tipo: 'invitado' });
    expect(interpretarInicioSesion('  invitado ', 'loquesea')).toEqual({ tipo: 'invitado' });
    expect(interpretarInicioSesion('', '')).toEqual({ tipo: 'invitado' });
  });

  it('otro usuario necesita contraseña', () => {
    expect(interpretarInicioSesion('admin', '').tipo).toBe('error');
    expect(interpretarInicioSesion(' admin ', 'secreto')).toEqual({ tipo: 'credenciales', usuario: 'admin', contrasena: 'secreto' });
  });

  it('las apps de administración solo las ve el admin', () => {
    const panel = { id: 'panel', soloAdmin: true };
    const publica = { id: 'eventos' };
    expect(puedeUsarApp(SESION_INVITADO, panel)).toBe(false);
    expect(puedeUsarApp(SESION_INVITADO, publica)).toBe(true);
    expect(puedeUsarApp(crearSesionAdmin('admin'), panel)).toBe(true);
  });
});
