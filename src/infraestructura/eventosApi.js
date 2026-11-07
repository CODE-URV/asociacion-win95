import { peticion } from './apiClient';

/** Eventos entre dos fechas ISO: [{ id, titulo, descripcion, lugar, inicio, todoElDia }]. */
export async function obtenerEventos(desde, hasta) {
  const { eventos } = await peticion('/eventos', { consulta: { desde, hasta } });
  return eventos;
}

// ---------- Administración (Panel de control → Calendario) ----------

export async function listarEventosAdmin() {
  const { eventos } = await peticion('/admin/eventos');
  return eventos;
}

export async function crearEvento(datos) {
  const { evento } = await peticion('/admin/eventos', { metodo: 'POST', cuerpo: datos });
  return evento;
}

export async function actualizarEvento(id, datos) {
  const { evento } = await peticion(`/admin/eventos/${encodeURIComponent(id)}`, { metodo: 'PUT', cuerpo: datos });
  return evento;
}

export async function eliminarEvento(id) {
  await peticion(`/admin/eventos/${encodeURIComponent(id)}`, { metodo: 'DELETE' });
}