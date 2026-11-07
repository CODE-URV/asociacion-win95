// Dominio de la sesión: quién está usando el escritorio.

export const NOMBRE_INVITADO = 'Invitado';

export const SESION_INVITADO = Object.freeze({ nombre: NOMBRE_INVITADO, esAdmin: false });

export function crearSesionAdmin(nombre) {
  return Object.freeze({ nombre, esAdmin: true });
}

/**
 * Decide qué hacer con lo que se ha escrito en el diálogo de inicio de sesión:
 * sin usuario o con "Invitado" se entra como invitado; con cualquier otro usuario
 * hay que comprobar las credenciales en el servidor.
 */
export function interpretarInicioSesion(usuario, contrasena) {
  const nombre = (usuario ?? '').trim();
  if (nombre === '' || nombre.toLowerCase() === NOMBRE_INVITADO.toLowerCase()) {
    return { tipo: 'invitado' };
  }
  if ((contrasena ?? '') === '') {
    return { tipo: 'error', mensaje: 'Escribe la contraseña.' };
  }
  return { tipo: 'credenciales', usuario: nombre, contrasena };
}

/** Una aplicación solo se muestra si es pública o si la sesión es de administrador. */
export function puedeUsarApp(sesion, app) {
  return !app.soloAdmin || Boolean(sesion?.esAdmin);
}
