import { useState } from 'react';
import './PanelControl.css';
import projectsIcon from '../../assets/desktop_icons/projects.png';
import GestorProyectos from '../proyectos/GestorProyectos';
import GestorActividades from '../actividades/GestorActividades';
import GestorCalendario from '../calendario/GestorCalendario';
import eventsIcon from '../../assets/desktop_icons/events.png';
import useModoTactil from '../../escritorio/useModoTactil';

// Cada "applet" del Panel de control. Para añadir más, basta con otra entrada.
const APPLETS = [
  { id: 'actividades', nombre: 'Actividades', icono: '🎤', componente: GestorActividades },
  { id: 'calendario', nombre: 'Calendario', imagen: eventsIcon, componente: GestorCalendario },
  { id: 'proyectos', nombre: 'Proyectos', imagen: projectsIcon, componente: GestorProyectos },
];

export default function PanelControl() {
  const [abierto, setAbierto] = useState(null);
  const tactil = useModoTactil();
  const applet = APPLETS.find((a) => a.id === abierto);

  if (applet) {
    const Componente = applet.componente;
    return (
      <div className="pc">
        <div className="pc-ruta">
          <button className="pc-atras" onClick={() => setAbierto(null)}>◀ Panel de control</button>
          <span>› {applet.nombre}</span>
        </div>
        <div className="pc-contenido">
          <Componente />
        </div>
      </div>
    );
  }

  return (
    <div className="pc">
      <div className="pc-iconos">
        {APPLETS.map((a) => (
          <button
            key={a.id}
            className="pc-icono"
            onClick={tactil ? () => setAbierto(a.id) : undefined}
            onDoubleClick={tactil ? undefined : () => setAbierto(a.id)}
            onKeyDown={(e) => e.key === 'Enter' && setAbierto(a.id)}
          >
            {a.imagen ? <img src={a.imagen} alt="" /> : <span className="pc-icono-emoji">{a.icono}</span>}
            <span>{a.nombre}</span>
          </button>
        ))}
      </div>
      <div className="pc-estado">
        {APPLETS.length} objeto(s) — {tactil ? 'toca para abrir' : 'haz doble clic para abrir'}
      </div>
    </div>
  );
}
