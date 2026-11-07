import { peticion } from './apiClient';

/** Eventos entre dos fechas ISO: [{ id, titulo, descripcion, lugar, inicio, todoElDia }]. */
export async function obtenerEventos(desde, hasta) {
  const { eventos } = await peticion('/eventos', { consulta: { desde, hasta } });
  return eventos;
}
