// Dominio de la inscripción de socios. Los textos de las opciones se envían tal cual
// a la hoja de Google (Apps Script), por eso están en catalán.

export const OPCION_SOCIO_NUEVO = 'NO vaig ser soci i VULL la samarreta (8€)';
export const OPCION_SOCIO_ANTERIOR = 'Vaig ser soci i ja tinc la samarreta (5€)';

export const CURSOS = [
  { valor: '1er', texto: '1er' },
  { valor: '2n', texto: '2n' },
  { valor: '3r', texto: '3r' },
  { valor: '4t', texto: '4t' },
  { valor: 'Màster', texto: 'Máster / Otros' },
];

export const TALLAS = ['S', 'M', 'L', 'XL'];

export function formularioInicial() {
  return {
    socioAnterior: OPCION_SOCIO_NUEVO,
    grado: 'Grau en Enginyeria Informàtica',
    curso: '1er',
    talla: '',
    nombre: '',
    correo: '',
    telefono: '',
  };
}

export function esSocioAnterior(formulario) {
  return formulario.socioAnterior === OPCION_SOCIO_ANTERIOR;
}

/** Los socios nuevos pagan la camiseta y tienen que elegir talla. */
export function necesitaTalla(formulario) {
  return !esSocioAnterior(formulario);
}

export function cuota(formulario) {
  return esSocioAnterior(formulario)
    ? { importe: '5€', descripcion: 'Socios de cursos anteriores (ya tienen camiseta)' }
    : { importe: '8€', descripcion: 'Nuevos socios (incluye camiseta)' };
}

/** Cambia la opción de socio anterior; si ya tiene camiseta, se borra la talla. */
export function elegirSocioAnterior(formulario, opcion) {
  return { ...formulario, socioAnterior: opcion, talla: opcion === OPCION_SOCIO_ANTERIOR ? '' : formulario.talla };
}

/** Devuelve el primer error o null si el formulario es válido. */
export function validar(formulario) {
  if (!formulario.nombre.trim()) return 'El nombre y apellidos es obligatorio.';
  if (!formulario.grado.trim()) return 'Indica el grado que estudias.';
  if (!formulario.curso.trim()) return 'Indica tu curso actual.';
  if (!formulario.correo.trim()) return 'El correo electrónico es obligatorio.';
  if (!formulario.telefono.trim()) return 'El número de teléfono es obligatorio.';
  if (necesitaTalla(formulario) && !formulario.talla) return 'Selecciona una talla de camiseta.';
  return null;
}

/** Datos que se envían al servidor. */
export function aSolicitud(formulario) {
  return {
    socioAnterior: formulario.socioAnterior,
    grado: formulario.grado,
    curso: formulario.curso,
    talla: necesitaTalla(formulario) ? formulario.talla : '',
    nombre: formulario.nombre,
    correo: formulario.correo,
    telefono: formulario.telefono,
  };
}
