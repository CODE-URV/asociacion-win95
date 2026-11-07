import { useEffect, useRef, useState } from 'react';
import './Window.css';

const ANCHO_MIN = 300;
const ALTO_MIN = 200;
const BORDES = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];

/**
 * Ventana arrastrable y redimensionable. Durante el arrastre la posición vive en
 * estado local (para que sea fluido) y al soltar se guarda en el gestor de ventanas.
 */
function Window({ ventana, alCerrar, alMinimizar, alEnfocar, alMover, alRedimensionar, alMaximizar, children }) {
  const [posicion, setPosicion] = useState({ x: ventana.x, y: ventana.y });
  const [tamano, setTamano] = useState({ width: ventana.width, height: ventana.height });
  const [accion, setAccion] = useState(null); // null | { tipo: 'mover' } | { tipo: 'redimensionar', borde }
  const inicio = useRef(null); // ratón, posición y tamaño al empezar
  const final = useRef(null); // última posición/tamaño calculados durante la acción

  const empezarMover = (e) => {
    if (e.target.closest('.window-btn') || ventana.maximized) return;
    e.preventDefault();
    inicio.current = { ratonX: e.clientX, ratonY: e.clientY, ...posicion, ...tamano };
    setAccion({ tipo: 'mover' });
    alEnfocar(ventana.id);
  };

  const empezarRedimensionar = (e, borde) => {
    e.preventDefault();
    e.stopPropagation();
    inicio.current = { ratonX: e.clientX, ratonY: e.clientY, ...posicion, ...tamano };
    setAccion({ tipo: 'redimensionar', borde });
    alEnfocar(ventana.id);
  };

  useEffect(() => {
    if (!accion) return undefined;

    const alMoverRaton = (e) => {
      const i = inicio.current;
      const dx = e.clientX - i.ratonX;
      const dy = e.clientY - i.ratonY;

      if (accion.tipo === 'mover') {
        const nueva = { x: i.x + dx, y: i.y + dy };
        final.current = { posicion: nueva, tamano: { width: i.width, height: i.height } };
        setPosicion(nueva);
        return;
      }

      const { borde } = accion;
      let { x, y, width, height } = i;
      if (borde.includes('e')) width = Math.max(ANCHO_MIN, i.width + dx);
      if (borde.includes('s')) height = Math.max(ALTO_MIN, i.height + dy);
      if (borde.includes('w')) {
        width = Math.max(ANCHO_MIN, i.width - dx);
        x = i.x + (i.width - width);
      }
      if (borde.includes('n')) {
        height = Math.max(ALTO_MIN, i.height - dy);
        y = i.y + (i.height - height);
      }
      final.current = { posicion: { x, y }, tamano: { width, height } };
      setPosicion({ x, y });
      setTamano({ width, height });
    };

    const alSoltar = () => {
      if (final.current) {
        alMover(ventana.id, final.current.posicion);
        if (accion.tipo === 'redimensionar') alRedimensionar(ventana.id, final.current.tamano);
      }
      final.current = null;
      setAccion(null);
    };

    document.addEventListener('mousemove', alMoverRaton);
    document.addEventListener('mouseup', alSoltar);
    return () => {
      document.removeEventListener('mousemove', alMoverRaton);
      document.removeEventListener('mouseup', alSoltar);
    };
  }, [accion, ventana.id, alMover, alRedimensionar]);

  const clases = [
    'window',
    accion?.tipo === 'mover' && 'dragging',
    accion?.tipo === 'redimensionar' && 'resizing',
    ventana.maximized && 'maximized',
  ].filter(Boolean).join(' ');

  const boton = (clase, titulo, texto, accionBoton) => (
    <button
      className={`window-btn ${clase}`}
      title={titulo}
      onClick={(e) => {
        e.stopPropagation();
        accionBoton(ventana.id);
      }}
    >
      {texto}
    </button>
  );

  return (
    <div
      className={clases}
      style={{
        left: `${posicion.x}px`,
        top: `${posicion.y}px`,
        width: `${tamano.width}px`,
        height: `${tamano.height}px`,
        zIndex: ventana.zIndex,
      }}
      onMouseDown={() => alEnfocar(ventana.id)}
    >
      <div className="window-title-bar" onMouseDown={empezarMover} onDoubleClick={() => alMaximizar(ventana.id)}>
        <div className="window-title">
          <span className="window-icon">{ventana.icon}</span>
          <span className="window-title-text">{ventana.title}</span>
        </div>
        <div className="window-buttons">
          {boton('window-minimize-btn', 'Minimizar', '_', alMinimizar)}
          {boton('window-maximize-btn', 'Maximizar', '□', alMaximizar)}
          {boton('window-close-btn', 'Cerrar', '✕', alCerrar)}
        </div>
      </div>

      <div className="window-content">{children}</div>

      {!ventana.maximized &&
        BORDES.map((borde) => (
          <div key={borde} className={`resize-handle resize-${borde}`} onMouseDown={(e) => empezarRedimensionar(e, borde)} />
        ))}
    </div>
  );
}

export default Window;
