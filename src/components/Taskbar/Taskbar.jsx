import React, { useState } from 'react';
import StartMenu from '../StartMenu/StartMenu';
import './Taskbar.css';
import logoURV from '../../assets/code_urv_logo_nobg.png';

function Taskbar({ windows, onRestoreWindow, onFocusWindow, onMinimizeWindow, onOpenWindow }) {
  const [time, setTime] = useState(new Date());
  const [isStartMenuOpen, setIsStartMenuOpen] = useState(false);

  React.useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };

  const handleWindowClick = (window) => {
    if (window.minimized) {
      onRestoreWindow(window.id);
      onFocusWindow(window.id);
    } else {
      onMinimizeWindow(window.id);
    }
  };

  const toggleStartMenu = () => {
    setIsStartMenuOpen(!isStartMenuOpen);
  };

  return (
    <>
      <div className="taskbar">
        {/* Botón Start con logo */}
        <button 
          className={`start-button ${isStartMenuOpen ? 'active' : ''}`}
          onClick={toggleStartMenu}
        >
          <img src={logoURV} alt="CODE URV" className="start-logo" />
          <span>Inicio</span>
        </button>

        {/* Separador */}
        <div className="taskbar-separator"></div>

        {/* Área de ventanas abiertas */}
        <div className="taskbar-windows">
          {windows.map((window) => (
            <button
              key={window.id}
              className={`taskbar-window-btn ${!window.minimized ? 'active' : ''}`}
              onClick={() => handleWindowClick(window)}
              title={window.title}
            >
              <span className="taskbar-window-icon">{window.icon}</span>
              <span className="taskbar-window-title">{window.title}</span>
            </button>
          ))}
        </div>

        {/* Reloj */}
        <div className="taskbar-clock">
          {formatTime(time)}
        </div>
      </div>

      {/* Menú Start */}
      <StartMenu 
        isOpen={isStartMenuOpen} 
        onClose={() => setIsStartMenuOpen(false)}
        onOpenWindow={onOpenWindow}
      />
    </>
  );
}

export default Taskbar;