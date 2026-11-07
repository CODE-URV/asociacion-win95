// Dominio de los proyectos. Las mismas reglas se comprueban en el servidor
// (api/src/Dominio/Proyecto.php); aquí sirven para avisar antes de enviar.

export const ESTADOS = ['Planificación', 'En Progreso', 'Completado', 'Pausado', 'Cancelado'];

export const FILTROS = ['Todos', 'En Progreso', 'Completado', 'Planificación'];

export const LIMITES = {
  nombre: 120,
  descripcion: 2000,
  responsable: 120,
  email: 190,
  repositorio: 255,
};

const ESTILO_ESTADO = {
  'completado': { color: '#4caf50', icono: '✅' },
  'en progreso': { color: '#ffc107', icono: '⚙️' },
  'planificación': { color: '#2196f3', icono: '📋' },
  'pausado': { color: '#ff9800', icono: '⏸️' },
  'cancelado': { color: '#f44336', icono: '❌' },
};

const normalizar = (texto) => (texto ?? '').toLowerCase().trim();

export function colorDeEstado(estado) {
  return ESTILO_ESTADO[normalizar(estado)]?.color ?? '#808080';
}

export function iconoDeEstado(estado) {
  return ESTILO_ESTADO[normalizar(estado)]?.icono ?? '📦';
}

export function filtrar(proyectos, filtro) {
  if (filtro === 'Todos') return proyectos;
  return proyectos.filter((p) => normalizar(p.estado) === normalizar(filtro));
}

export function proyectoVacio() {
  return {
    nombre: '',
    descripcion: '',
    responsable: '',
    email: '',
    estado: 'Planificación',
    progreso: 0,
    tecnologias: [],
    repositorio: '',
    colaboradores: [],
  };
}

/** "react | php, mysql" → ['react', 'php', 'mysql'] */
export function listaDesdeTexto(texto) {
  return (texto ?? '')
    .split(/[|,]/)
    .map((t) => t.trim())
    .filter(Boolean);
}

export function textoDesdeLista(lista) {
  return (lista ?? []).join(', ');
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_HTTP = /^https?:\/\/\S+$/i;

/** Devuelve { campo: mensaje } con los errores; vacío si es válido. */
export function validar(datos) {
  const errores = {};
  const nombre = (datos.nombre ?? '').trim();

  if (!nombre) errores.nombre = 'El nombre es obligatorio.';
  for (const [campo, maximo] of Object.entries(LIMITES)) {
    if ((datos[campo] ?? '').length > maximo) errores[campo] = `Máximo ${maximo} caracteres.`;
  }
  if (!ESTADOS.includes(datos.estado)) errores.estado = 'Estado no válido.';

  const progreso = Number(datos.progreso);
  if (!Number.isInteger(progreso) || progreso < 0 || progreso > 100) {
    errores.progreso = 'El progreso es un número entero entre 0 y 100.';
  }
  if (datos.email && !EMAIL.test(datos.email)) errores.email = 'El email no es válido.';
  if (datos.repositorio && !URL_HTTP.test(datos.repositorio)) {
    errores.repositorio = 'El repositorio debe ser una URL que empiece por http:// o https://';
  }
  return errores;
}
