import { peticion } from './apiClient';

// ---------- Público ----------

export async function listarActividades() {
  const { actividades } = await peticion('/actividades');
  return actividades;
}

export function inscribirse(actividadId, solicitud) {
  return peticion(`/actividades/${actividadId}/inscripciones`, { metodo: 'POST', cuerpo: solicitud });
}

/** Cambia el código del QR (válido ~1 min) por un pase de 15 min. */
export async function obtenerPase(actividadId, codigo) {
  const { pase } = await peticion(`/actividades/${actividadId}/pase`, { metodo: 'POST', cuerpo: { codigo } });
  return pase;
}

/** { requiereDatos } o { registrada, yaRegistrada, nombre } */
export function registrarAsistencia(actividadId, datos) {
  return peticion(`/actividades/${actividadId}/asistencia`, { metodo: 'POST', cuerpo: datos });
}

// ---------- Administración ----------

export async function listarActividadesAdmin() {
  const { actividades } = await peticion('/admin/actividades');
  return actividades;
}

export async function crearActividad(datos) {
  const { actividad } = await peticion('/admin/actividades', { metodo: 'POST', cuerpo: datos });
  return actividad;
}

export async function actualizarActividad(id, datos) {
  const { actividad } = await peticion(`/admin/actividades/${id}`, { metodo: 'PUT', cuerpo: datos });
  return actividad;
}

export async function eliminarActividad(id) {
  await peticion(`/admin/actividades/${id}`, { metodo: 'DELETE' });
}

export async function listarInscritos(actividadId) {
  const { inscripciones } = await peticion(`/admin/actividades/${actividadId}/inscripciones`);
  return inscripciones;
}

export async function marcarAsistencia(actividadId, inscripcionId, asistio) {
  const { inscripcion } = await peticion(`/admin/actividades/${actividadId}/inscripciones/${inscripcionId}`, {
    metodo: 'PUT',
    cuerpo: { asistio },
  });
  return inscripcion;
}

export async function eliminarInscripcion(actividadId, inscripcionId) {
  await peticion(`/admin/actividades/${actividadId}/inscripciones/${inscripcionId}`, { metodo: 'DELETE' });
}

/** Envía el siguiente lote de certificados: { enviados, pendientes, error } */
export function enviarLoteCertificados(actividadId) {
  return peticion(`/admin/actividades/${actividadId}/certificados`, { metodo: 'POST' });
}

export async function reenviarCertificado(actividadId, inscripcionId) {
  const { inscripcion } = await peticion(`/admin/actividades/${actividadId}/inscripciones/${inscripcionId}/certificado`, {
    metodo: 'POST',
  });
  return inscripcion;
}

/** PDF de muestra (se abre en otra pestaña con la sesión de admin). */
export function urlVistaPreviaCertificado(actividadId, inscripcionId = null) {
  const consulta = inscripcionId ? `?inscripcion=${inscripcionId}` : '';
  return `/api/admin/actividades/${actividadId}/certificado-previo${consulta}`;
}

/** { codigo, cambiaEn, ahora } — cambiaEn y ahora en segundos (hora del servidor) */
export function obtenerCodigoQr(actividadId) {
  return peticion(`/admin/actividades/${actividadId}/qr`);
}
