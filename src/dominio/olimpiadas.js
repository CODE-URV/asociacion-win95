// CodeOlimpiadas: reglas que no dependen de React ni de la API.

export const TIPOS_PRUEBA = {
  imagen: 'Imagen con IA',
  wikirace: 'Wiki Race',
};

export const ESTADOS_PRUEBA = {
  preparacion: 'En preparación',
  en_curso: 'En curso',
  finalizada: 'Finalizada',
};

export const CRITERIOS_IMAGEN = {
  originalidad: 'Originalidad',
  adecuacion: 'Adecuación a lo pedido',
  calidad: 'Calidad de la propuesta',
};

export const NOTA_MAXIMA = 10;

const MEDALLAS = { 1: '🥇', 2: '🥈', 3: '🥉' };

export const medalla = (posicion) => MEDALLAS[posicion] ?? `${posicion}º`;

/** 75300 → "1:15" (o "1:15,3" con décimas); a partir de una hora, "1:02:03". */
export function formatearTiempo(ms, { decimas = false } = {}) {
  if (ms === null || ms === undefined || ms < 0) return '—';
  const totalSegundos = Math.floor(ms / 1000);
  const horas = Math.floor(totalSegundos / 3600);
  const minutos = Math.floor((totalSegundos % 3600) / 60);
  const segundos = totalSegundos % 60;
  const ss = String(segundos).padStart(2, '0');
  let texto = horas > 0 ? `${horas}:${String(minutos).padStart(2, '0')}:${ss}` : `${minutos}:${ss}`;
  if (decimas) texto += `,${Math.floor((ms % 1000) / 100)}`;
  return texto;
}

// Espacios de nombres de Wikipedia en español (y en inglés, que también funcionan en los enlaces)
// que no son artículos: no cuentan en la Wiki Race.
const ESPACIOS_NO_ARTICULO = new Set([
  'archivo', 'file', 'imagen', 'image', 'categoría', 'category', 'especial', 'special', 'plantilla', 'template',
  'ayuda', 'help', 'wikipedia', 'portal', 'anexo', 'usuario', 'usuaria', 'user', 'discusión', 'talk', 'módulo',
  'module', 'mediawiki', 'wikiproyecto', 'wikiproject', 'medio', 'media', 'wp', 'wikt', 'wikcionario',
  'commons', 'meta', 'en', 'fr', 'ca', 'de', 'it', 'pt',
]);

/**
 * Título del artículo al que lleva un enlace de Wikipedia, o null si no es un artículo
 * (imágenes, categorías, enlaces rojos, externos...). Quita el #ancla.
 */
export function articuloDesdeEnlace(href) {
  if (!href) return null;
  let ruta = href;
  const absoluta = ruta.match(/^(?:https?:)?\/\/es\.(?:m\.)?wikipedia\.org(\/.*)$/i);
  if (absoluta) ruta = absoluta[1];
  else if (/^[a-z]+:|^\/\//i.test(ruta)) return null; // otro dominio, mailto:...
  if (ruta.startsWith('./')) ruta = `/wiki/${ruta.slice(2)}`;
  if (!ruta.startsWith('/wiki/')) return null; // p. ej. /w/index.php?...&redlink=1

  let titulo = ruta.slice('/wiki/'.length).split('#')[0];
  if (titulo.includes('?')) return null;
  try {
    titulo = decodeURIComponent(titulo);
  } catch {
    return null;
  }
  titulo = titulo.replace(/_/g, ' ').trim();
  if (!titulo) return null;

  const dosPuntos = titulo.indexOf(':');
  if (dosPuntos > 0 && ESPACIOS_NO_ARTICULO.has(titulo.slice(0, dosPuntos).trim().toLowerCase())) return null;
  return titulo.charAt(0).toUpperCase() + titulo.slice(1);
}

// ---------- Formularios del Panel de control ----------

export const equipoVacio = () => ({ nombre: '', miembros: '' });

/** "Ana, Pol\nMarta" → ["Ana", "Pol", "Marta"] */
export const miembrosDesdeTexto = (texto) =>
  texto
    .split(/[\n,]/)
    .map((m) => m.trim())
    .filter(Boolean);

export function validarEquipo({ nombre, miembros }) {
  const errores = {};
  if (!nombre.trim()) errores.nombre = 'Es obligatorio.';
  else if (nombre.trim().length > 60) errores.nombre = 'Máximo 60 caracteres.';
  const lista = miembrosDesdeTexto(miembros);
  if (lista.length > 10) errores.miembros = 'Máximo 10 miembros.';
  else if (lista.some((m) => m.length > 80)) errores.miembros = 'Cada nombre tiene como máximo 80 caracteres.';
  return errores;
}

export const pruebaVacia = () => ({ nombre: '', tipo: 'imagen', descripcion: '', estado: 'preparacion', origen: '', destino: '' });

export function validarPrueba(prueba) {
  const errores = {};
  if (!prueba.nombre.trim()) errores.nombre = 'Es obligatorio.';
  else if (prueba.nombre.trim().length > 100) errores.nombre = 'Máximo 100 caracteres.';
  if (prueba.descripcion.length > 2000) errores.descripcion = 'Máximo 2000 caracteres.';
  if (prueba.tipo === 'wikirace') {
    if (!prueba.origen.trim()) errores.origen = 'Es obligatorio.';
    if (!prueba.destino.trim()) errores.destino = 'Es obligatorio.';
    else if (prueba.origen.trim().toLowerCase() === prueba.destino.trim().toLowerCase()) {
      errores.destino = 'Tiene que ser distinto del artículo de salida.';
    }
  }
  return errores;
}

/** Nota de un campo del formulario: '' → null (sin puntuar); si no, entero de 0 a 10. */
export function leerNota(valor) {
  const texto = String(valor ?? '').trim();
  if (texto === '') return { nota: null };
  const nota = Number(texto);
  if (!Number.isInteger(nota) || nota < 0 || nota > NOTA_MAXIMA) return { error: `De 0 a ${NOTA_MAXIMA}` };
  return { nota };
}
