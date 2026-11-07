// Cliente HTTP común para hablar con la API PHP (/api/...).
// - Siempre envía/recibe JSON y la cookie de sesión del mismo dominio.
// - Añade la cabecera CSRF en las peticiones que modifican datos.
// - Convierte cualquier respuesta de error (aunque el servidor devuelva HTML)
//   en un ErrorApi con un mensaje legible.

export class ErrorApi extends Error {
  constructor(mensaje, estado, detalles = null) {
    super(mensaje);
    this.name = 'ErrorApi';
    this.estado = estado;
    this.detalles = detalles;
  }
}

let tokenCsrf = null;

export function establecerTokenCsrf(token) {
  tokenCsrf = token || null;
}

const MENSAJES_POR_ESTADO = {
  400: 'La petición no es válida.',
  401: 'Tienes que iniciar sesión.',
  403: 'No tienes permiso para hacer esto.',
  404: 'No se ha encontrado.',
  422: 'Hay datos que no son válidos.',
  429: 'Demasiados intentos. Espera unos minutos.',
  500: 'Error interno del servidor.',
  502: 'El servicio externo no responde.',
};

async function leerCuerpo(respuesta) {
  const texto = await respuesta.text();
  if (!texto) return null;
  try {
    return JSON.parse(texto);
  } catch {
    return null; // p. ej. una página de error HTML del servidor
  }
}

export async function peticion(ruta, { metodo = 'GET', cuerpo, consulta } = {}) {
  const url = new URL(`/api${ruta}`, window.location.origin);
  if (consulta) {
    Object.entries(consulta).forEach(([clave, valor]) => {
      if (valor !== undefined && valor !== null) url.searchParams.set(clave, valor);
    });
  }

  const cabeceras = { Accept: 'application/json' };
  if (cuerpo !== undefined) cabeceras['Content-Type'] = 'application/json';
  if (metodo !== 'GET' && tokenCsrf) cabeceras['X-CSRF-Token'] = tokenCsrf;

  let respuesta;
  try {
    respuesta = await fetch(url, {
      method: metodo,
      headers: cabeceras,
      body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined,
      credentials: 'same-origin',
    });
  } catch {
    throw new ErrorApi('No se puede conectar con el servidor.', 0);
  }

  const datos = await leerCuerpo(respuesta);

  if (!respuesta.ok) {
    const mensaje = datos?.error || MENSAJES_POR_ESTADO[respuesta.status] || `Error ${respuesta.status}`;
    throw new ErrorApi(mensaje, respuesta.status, datos?.detalles ?? null);
  }

  return datos;
}
