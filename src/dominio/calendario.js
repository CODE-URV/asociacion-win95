// Dominio del calendario de eventos: cálculos de fechas sin React ni red.

export const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

// La semana empieza en lunes, como en España.
export const DIAS_SEMANA = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

const dosCifras = (n) => String(n).padStart(2, '0');

/** Clave 'AAAA-MM-DD' de un día (hora local). */
export function claveDia(anio, mes, dia) {
  return `${anio}-${dosCifras(mes + 1)}-${dosCifras(dia)}`;
}

export function claveDeFecha(fecha) {
  return claveDia(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
}

/** Inicio y fin del mes en ISO, para pedir los eventos de ese mes. */
export function rangoDelMes(anio, mes) {
  return {
    desde: new Date(anio, mes, 1).toISOString(),
    hasta: new Date(anio, mes + 1, 0, 23, 59, 59).toISOString(),
  };
}

/**
 * Celdas de la cuadrícula del mes empezando en lunes:
 * null para los huecos antes del día 1, y { dia, clave } para cada día.
 */
export function celdasDelMes(anio, mes) {
  const diasEnMes = new Date(anio, mes + 1, 0).getDate();
  const diaSemana = new Date(anio, mes, 1).getDay(); // 0 = domingo
  const huecos = diaSemana === 0 ? 6 : diaSemana - 1;

  const celdas = Array.from({ length: huecos }, () => null);
  for (let dia = 1; dia <= diasEnMes; dia++) {
    celdas.push({ dia, clave: claveDia(anio, mes, dia) });
  }
  return celdas;
}

/** Agrupa eventos ({ inicio: 'AAAA-MM-DD...' }) por día. */
export function agruparPorDia(eventos) {
  return eventos.reduce((mapa, evento) => {
    const clave = evento.inicio.slice(0, 10);
    (mapa[clave] ??= []).push(evento);
    return mapa;
  }, {});
}

/** Texto de la hora del evento, o null si dura todo el día. */
export function horaDelEvento(evento) {
  if (evento.todoElDia) return null;
  return new Date(evento.inicio).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

// ---------- Edición de eventos (Panel de control) ----------

export function eventoVacio() {
  return { titulo: '', descripcion: '', lugar: '', todoElDia: false, inicio: '', fin: '' };
}

/** { campo: mensaje } — mismas reglas que api/src/Dominio/Evento.php */
export function validarEvento(evento) {
  const errores = {};
  if (!evento.titulo.trim()) errores.titulo = 'El título es obligatorio.';
  if (!evento.inicio) errores.inicio = 'Indica cuándo empieza.';
  if (!evento.fin) errores.fin = 'Indica cuándo acaba.';
  if (evento.inicio && evento.fin) {
    const malOrden = evento.todoElDia ? evento.fin < evento.inicio : evento.fin <= evento.inicio;
    if (malOrden) errores.fin = 'Tiene que acabar después de empezar.';
  }
  return errores;
}

/** Al marcar o desmarcar "todo el día" se adapta el formato de las fechas. */
export function cambiarTodoElDia(evento, todoElDia) {
  const convertir = (valor, hora) => {
    if (!valor) return '';
    return todoElDia ? valor.slice(0, 10) : `${valor.slice(0, 10)}T${hora}`;
  };
  return { ...evento, todoElDia, inicio: convertir(evento.inicio, '18:00'), fin: convertir(evento.fin, '19:00') };
}

/** "vie 5 dic · todo el día" / "mié 18 nov · 15:10–16:10" */
export function textoFechaEvento(evento) {
  const dia = (texto) => new Date(texto.length === 10 ? `${texto}T00:00` : texto)
    .toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
  if (evento.todoElDia) {
    return evento.fin && evento.fin !== evento.inicio
      ? `${dia(evento.inicio)} – ${dia(evento.fin)} · todo el día`
      : `${dia(evento.inicio)} · todo el día`;
  }
  const hora = (texto) => texto.slice(11, 16);
  return evento.inicio.slice(0, 10) === evento.fin.slice(0, 10)
    ? `${dia(evento.inicio)} · ${hora(evento.inicio)}–${hora(evento.fin)}`
    : `${dia(evento.inicio)} ${hora(evento.inicio)} – ${dia(evento.fin)} ${hora(evento.fin)}`;
}