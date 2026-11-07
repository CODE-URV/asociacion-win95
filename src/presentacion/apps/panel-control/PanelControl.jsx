import { useState } from 'react';
import './PanelControl.css';
import projectsIcon from '../../assets/desktop_icons/projects.png';
import GestorProyectos from '../proyectos/GestorProyectos';

// Cada "applet" del Panel de control. Para añadir más, basta con otra entrada.
const APPLETS = [
  { id: 'proyectos', nombre: 'Proyectos', imagen: projectsIcon, componente: GestorProyectos },
];

export default function PanelControl() {
  const [abierto, setAbierto] = useState(null);
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
          <button key={a.id} className="pc-icono" onDoubleClick={() => setAbierto(a.id)} onKeyDown={(e) => e.key === 'Enter' && setAbierto(a.id)}>
            <img src={a.imagen} alt="" />
            <span>{a.nombre}</span>
          </button>
        ))}
      </div>
      <div className="pc-estado">{APPLETS.length} objeto(s) — haz doble clic para abrir</div>
    </div>
  );
}
