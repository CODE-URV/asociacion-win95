import { peticion, establecerTokenCsrf } from './apiClient';

// Sesión en el servidor (cookie httpOnly) + token CSRF para las peticiones de admin.

function guardarCsrf(respuesta) {
  establecerTokenCsrf(respuesta?.csrf);
  return respuesta;
}

/** Devuelve { usuario: { nombre } | null, csrf }. */
export async function obtenerSesion() {
  return guardarCsrf(await peticion('/sesion'));
}

export async function iniciarSesion(usuario, contrasena) {
  return guardarCsrf(await peticion('/sesion', { metodo: 'POST', cuerpo: { usuario, contrasena } }));
}

export async function cerrarSesion() {
  const respuesta = await peticion('/sesion', { metodo: 'DELETE' });
  establecerTokenCsrf(null);
  return respuesta;
}

// Recordar que este navegador ya ha pasado por la pantalla de inicio de sesión.
const CLAVE_LOGIN_VISTO = 'codeurv.loginVisto';

export function loginYaVisto() {
  try {
    return window.localStorage.getItem(CLAVE_LOGIN_VISTO) === '1';
  } catch {
    return false;
  }
}

export function marcarLoginVisto() {
  try {
    window.localStorage.setItem(CLAVE_LOGIN_VISTO, '1');
  } catch {
    // modo privado o almacenamiento bloqueado: se volverá a mostrar, no pasa nada
  }
}
