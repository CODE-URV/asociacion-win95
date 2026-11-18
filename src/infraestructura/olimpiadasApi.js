import { peticion } from './apiClient';

// ---------- Público ----------

/** { equipos, pruebas, ranking, criterios, puntosPorPosicion } */
export const obtenerOlimpiadas = () => peticion('/olimpiadas');

/** { visibles }: si el público ve el icono en el escritorio */
export const obtenerVisibilidad = () => peticion('/olimpiadas/visibilidad');

export const urlImagen = (pruebaId, equipoId) => `/api/olimpiadas/pruebas/${pruebaId}/equipos/${equipoId}/imagen`;

/** Empieza (o recupera) la partida del equipo: { prueba, equipo, partida, transcurridoMs } */
export const empezarWikiRace = (pruebaId, codigo) =>
  peticion(`/olimpiadas/pruebas/${pruebaId}/partida`, { metodo: 'POST', cuerpo: { codigo } });

export const pasoWikiRace = (pruebaId, codigo, articulo) =>
  peticion(`/olimpiadas/pruebas/${pruebaId}/partida/pasos`, { metodo: 'POST', cuerpo: { codigo, articulo } });

// ---------- Administración ----------

export const obtenerOlimpiadasAdmin = () => peticion('/admin/olimpiadas');

export const cambiarVisibilidad = (visibles) =>
  peticion('/admin/olimpiadas/visibilidad', { metodo: 'PUT', cuerpo: { visibles } });

export const crearEquipo = (datos) => peticion('/admin/olimpiadas/equipos', { metodo: 'POST', cuerpo: datos });
export const actualizarEquipo = (id, datos) => peticion(`/admin/olimpiadas/equipos/${id}`, { metodo: 'PUT', cuerpo: datos });
export const eliminarEquipo = (id) => peticion(`/admin/olimpiadas/equipos/${id}`, { metodo: 'DELETE' });

export const crearPrueba = (datos) => peticion('/admin/olimpiadas/pruebas', { metodo: 'POST', cuerpo: datos });
export const actualizarPrueba = (id, datos) => peticion(`/admin/olimpiadas/pruebas/${id}`, { metodo: 'PUT', cuerpo: datos });
export const eliminarPrueba = (id) => peticion(`/admin/olimpiadas/pruebas/${id}`, { metodo: 'DELETE' });

const rutaEquipo = (pruebaId, equipoId) => `/admin/olimpiadas/pruebas/${pruebaId}/equipos/${equipoId}`;

export const puntuar = (pruebaId, equipoId, notas) =>
  peticion(`${rutaEquipo(pruebaId, equipoId)}/notas`, { metodo: 'PUT', cuerpo: notas });

/** imagen: data URL o base64 */
export const subirImagen = (pruebaId, equipoId, imagen) =>
  peticion(`${rutaEquipo(pruebaId, equipoId)}/imagen`, { metodo: 'PUT', cuerpo: { imagen } });

export const eliminarImagen = (pruebaId, equipoId) => peticion(`${rutaEquipo(pruebaId, equipoId)}/imagen`, { metodo: 'DELETE' });

export const urlImagenAdmin = (pruebaId, equipoId) => `/api${rutaEquipo(pruebaId, equipoId)}/imagen`;

export const reiniciarPartida = (pruebaId, equipoId) =>
  peticion(`${rutaEquipo(pruebaId, equipoId)}/partida`, { metodo: 'DELETE' });
