// Dominio de las actividades (charlas, talleres...). Las mismas reglas que
// api/src/Dominio/Actividad.php e InscripcionActividad.php, para avisar antes de enviar.

export const TIPOS = ['Charla', 'Taller', 'Otro'];

// Valores en catalán: son los mismos que en los formularios de la asociación
export const GRADOS = [
  'Grau en Enginyeria Informàtica',
  'Doble Grau en Enginyeria Informàtica i en Biotecnologia',
  'Grau en Enginyeria de Sistemes i Serveis de Telecomunicacions',
  'Grau en Enginyeria Matemàtica i Física',
  'Grau en Enginyeria Electrònica Industrial i Automàtica',
  'Grau en Enginyeria Elèctrica',
  'Grau en Enginyeria Mecànica',
  'Doble Grau en Enginyeria Elèctrica i en Enginyeria Electrònica Industrial i Automàtica',
  'No soc estudiant',
];
export const OTRO_GRADO = 'Altres';

export const CURSOS = ['1er', '2n', '3er', '4t', '5e (Dobles graus)', 'No soc estudiant'];

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function actividadVacia() {
  return {
    titulo: '',
    tipo: 'Charla',
    descripcion: '',
    informacionExtra: '',
    lugar: '',
    inicio: '',
    fin: '',
    ponente: '',
    plazas: null,
    publicada: false,
    inscripcionesAbiertas: true,
    enCalendario: true,
  };
}

export function personaVacia() {
  return {
    email: '',
    nombre: '',
    apellidos: '',
    grado: GRADOS[0],
    otroGrado: '',
    curso: CURSOS[0],
    confirmaAsistencia: false,
    aceptaPrivacidad: false,
  };
}

/** Datos que se envían al servidor (el grado "Altres" se sustituye por lo escrito). */
export function personaASolicitud(persona) {
  return {
    email: persona.email.trim(),
    nombre: persona.nombre.trim(),
    apellidos: persona.apellidos.trim(),
    grado: persona.grado === OTRO_GRADO ? persona.otroGrado.trim() : persona.grado,
    curso: persona.curso,
    confirmaAsistencia: persona.confirmaAsistencia,
    aceptaPrivacidad: persona.aceptaPrivacidad,
  };
}

/** { campo: mensaje } de la persona que se apunta. */
export function validarPersona(persona) {
  const errores = {};
  if (!EMAIL.test(persona.email.trim())) errores.email = 'Escribe un correo válido.';
  if (!persona.nombre.trim()) errores.nombre = 'El nombre es obligatorio.';
  if (!persona.apellidos.trim()) errores.apellidos = 'Los apellidos son obligatorios.';
  if (persona.grado === OTRO_GRADO && !persona.otroGrado.trim()) errores.grado = 'Indica qué estudias.';
  if (!persona.confirmaAsistencia) errores.confirmaAsistencia = 'Tienes que confirmar que asistirás.';
  if (!persona.aceptaPrivacidad) errores.aceptaPrivacidad = 'Tienes que aceptar el uso de tus datos.';
  return errores;
}

/** { campo: mensaje } de la actividad. */
export function validarActividad(datos) {
  const errores = {};
  if (!datos.titulo.trim()) errores.titulo = 'El título es obligatorio.';
  if (!datos.lugar.trim()) errores.lugar = 'El lugar es obligatorio.';
  if (!TIPOS.includes(datos.tipo)) errores.tipo = 'Tipo no válido.';
  if (!datos.inicio) errores.inicio = 'Indica cuándo empieza.';
  if (!datos.fin) errores.fin = 'Indica cuándo acaba.';
  if (datos.inicio && datos.fin && datos.fin <= datos.inicio) errores.fin = 'Tiene que acabar después de empezar.';
  if (datos.plazas !== null && (!Number.isInteger(datos.plazas) || datos.plazas < 1 || datos.plazas > 2000)) {
    errores.plazas = 'Entre 1 y 2000, o vacío si no hay límite.';
  }
  return errores;
}

const aFecha = (texto) => new Date(texto); // 'AAAA-MM-DDTHH:MM' en hora local

/** "miércoles, 19 de noviembre · 16:00 – 19:00" */
export function textoHorario(actividad) {
  const inicio = aFecha(actividad.inicio);
  const fin = aFecha(actividad.fin);
  const dia = inicio.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  const hora = (d) => d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  const mismoDia = inicio.toDateString() === fin.toDateString();
  return mismoDia
    ? `${dia} · ${hora(inicio)} – ${hora(fin)}`
    : `${dia} ${hora(inicio)} – ${fin.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })} ${hora(fin)}`;
}

/** Estado para mostrar en la lista pública. */
export function estadoPublico(actividad) {
  if (actividad.terminada) return { texto: 'Finalizada', clase: 'finalizada' };
  if (actividad.motivoCerrada) return { texto: actividad.plazasLibres === 0 ? 'Completa' : 'Inscripción cerrada', clase: 'cerrada' };
  return { texto: 'Inscripción abierta', clase: 'abierta' };
}

/** Enlace que lleva el QR proyectado en la sala. */
export function urlAsistencia(origen, actividadId, codigo) {
  return `${origen}/?asistencia=${actividadId}&codigo=${encodeURIComponent(codigo)}`;
}

/** Lee ?asistencia=ID&codigo=XXX de la URL al escanear el QR. */
export function leerUrlAsistencia(busqueda) {
  const parametros = new URLSearchParams(busqueda);
  const id = Number(parametros.get('asistencia'));
  const codigo = parametros.get('codigo');
  return Number.isInteger(id) && id > 0 && codigo ? { actividadId: id, codigo } : null;
}

/** CSV de inscritos (separado por ; y con BOM para que Excel lo abra bien). */
export function csvInscritos(inscritos) {
  const columnas = ['Nombre', 'Apellidos', 'Correo', 'Grado', 'Curso', 'Inscrito', 'Asistió', 'Certificado'];
  const celda = (valor) => `"${String(valor ?? '').replaceAll('"', '""')}"`;
  const filas = inscritos.map((i) => [
    i.nombre, i.apellidos, i.email, i.grado, i.curso,
    i.inscritoEn?.replace('T', ' '), i.asistioEn ? 'Sí' : 'No', i.certificadoEnviadoEn ? 'Enviado' : '',
  ].map(celda).join(';'));
  return '﻿' + [columnas.map(celda).join(';'), ...filas].join('\r\n');
}
