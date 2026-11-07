import { useEffect, useState } from 'react';
import StartMenu from './StartMenu';
import './Taskbar.css';
import logoURV from '../assets/code_urv_logo_nobg.png';

function Reloj() {
  const [ahora, setAhora] = useState(() => new Date());

  useEffect(() => {
    const temporizador = setInterval(() => setAhora(new Date()), 1000);
    return () => clearInterval(temporizador);
  }, []);

  return (
    <div className="taskbar-clock">
      {ahora.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
    </div>
  );
}

function Taskbar({ apps, ventanas, acciones, sesion, alCerrarSesion }) {
  const [menuAbierto, setMenuAbierto] = useState(false);

  // Clic en una ventana de la barra: si está minimizada se restaura; si no, se minimiza
  const alPulsarVentana = (ventana) => {
    if (ventana.minimized) acciones.restaurar(ventana.id);
    else acciones.minimizar(ventana.id);
  };

  return (
    <>
      <div className="taskbar">
        <button className={`start-button ${menuAbierto ? 'active' : ''}`} onClick={() => setMenuAbierto(!menuAbierto)}>
          <img src={logoURV} alt="CODE URV" className="start-logo" />
          <span>Inicio</span>
        </button>

        <div className="taskbar-separator" />

        <div className="taskbar-windows">
          {ventanas.map((ventana) => (
            <button
              key={ventana.id}
              className={`taskbar-window-btn ${!ventana.minimized ? 'active' : ''}`}
              onClick={() => alPulsarVentana(ventana)}
              title={ventana.title}
            >
              <span className="taskbar-window-icon">{ventana.icon}</span>
              <span className="taskbar-window-title">{ventana.title}</span>
            </button>
          ))}
        </div>

        <Reloj />
      </div>

      {menuAbierto && (
        <StartMenu
          apps={apps}
          sesion={sesion}
          alAbrir={(app) => acciones.abrir(app)}
          alCerrarSesion={alCerrarSesion}
          alCerrar={() => setMenuAbierto(false)}
        />
      )}
    </>
  );
}

export default Taskbar;
