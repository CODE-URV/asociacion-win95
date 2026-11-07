// Dominio del gestor de ventanas: funciones puras que reciben el estado
// (lista de ventanas) y devuelven el nuevo estado. No dependen de React.

export const MARGEN_PANTALLA = 16;
export const ALTO_BARRA_TAREAS = 48; // igual que .taskbar en Taskbar.css

const zMaximo = (ventanas) => Math.max(0, ...ventanas.map((v) => v.zIndex));

/** Ajusta tamaño y posición para que la ventana quepa en la pantalla. */
export function encajarEnPantalla({ x, y, width, height }, pantalla) {
  const anchoDisponible = Math.max(200, pantalla.ancho - MARGEN_PANTALLA * 2);
  const altoDisponible = Math.max(150, pantalla.alto - ALTO_BARRA_TAREAS - MARGEN_PANTALLA * 2);
  const ancho = Math.min(width, anchoDisponible);
  const alto = Math.min(height, altoDisponible);
  return {
    width: ancho,
    height: alto,
    x: Math.min(Math.max(MARGEN_PANTALLA, x), pantalla.ancho - ancho - MARGEN_PANTALLA),
    y: Math.min(Math.max(MARGEN_PANTALLA, y), pantalla.alto - ALTO_BARRA_TAREAS - alto - MARGEN_PANTALLA),
  };
}

/**
 * Abre la aplicación indicada. Si ya estaba abierta, la restaura y la trae al frente.
 * `app` viene del registro de aplicaciones (id, titulo, icono, tamano, centrada).
 */
export function abrirVentana(ventanas, app, pantalla, secuencia, parametros = null) {
  const existente = ventanas.find((v) => v.appId === app.id);
  if (existente) {
    const conParametros = parametros
      ? ventanas.map((v) => (v.id === existente.id ? { ...v, parametros } : v))
      : ventanas;
    return traerAlFrente(conParametros, existente.id, { restaurar: true });
  }

  const { ancho = 650, alto = 450 } = app.tamano ?? {};
  const desplazamiento = (secuencia * 30) % 200;
  const posicionInicial = app.centrada
    ? { x: (pantalla.ancho - ancho) / 2, y: (pantalla.alto - alto) / 2 }
    : { x: 50 + desplazamiento, y: 50 + (desplazamiento % 150) };

  const geometria = encajarEnPantalla({ ...posicionInicial, width: ancho, height: alto }, pantalla);

  return [
    ...ventanas,
    {
      id: `${app.id}-${secuencia}`,
      appId: app.id,
      title: app.titulo,
      icon: app.icono,
      ...geometria,
      minimized: false,
      maximized: false,
      zIndex: zMaximo(ventanas) + 1,
      parametros, // datos para el contenido (p. ej. la actividad del QR escaneado)
    },
  ];
}

export function cerrarVentana(ventanas, id) {
  return ventanas.filter((v) => v.id !== id);
}

export function cerrarApps(ventanas, appIds) {
  return ventanas.filter((v) => !appIds.includes(v.appId));
}

export function minimizarVentana(ventanas, id) {
  return ventanas.map((v) => (v.id === id ? { ...v, minimized: true } : v));
}

export function traerAlFrente(ventanas, id, { restaurar = false } = {}) {
  const z = zMaximo(ventanas) + 1;
  return ventanas.map((v) =>
    v.id === id ? { ...v, zIndex: z, minimized: restaurar ? false : v.minimized } : v
  );
}

export function alternarMaximizada(ventanas, id) {
  return ventanas.map((v) => (v.id === id ? { ...v, maximized: !v.maximized } : v));
}

export function moverVentana(ventanas, id, { x, y }) {
  return ventanas.map((v) => (v.id === id ? { ...v, x, y } : v));
}

export function redimensionarVentana(ventanas, id, { width, height }) {
  return ventanas.map((v) => (v.id === id ? { ...v, width, height } : v));
}
