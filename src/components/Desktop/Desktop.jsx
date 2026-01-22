import React from 'react';
import DesktopIcon from './DesktopIcon';
import Taskbar from '../Taskbar/Taskbar';
import './Desktop.css';
import logoURV from '../../assets/code_urv_logo_nobg.png';

function Desktop({ onOpenWindow, windows, onRestoreWindow, onFocusWindow, onMinimizeWindow }) {
  const desktopIcons = [
    { name: 'Sobre Nosotros', icon: '💻', id: 'about' },
    { name: 'Eventos', icon: '📅', id: 'events' },
    { name: 'Proyectos', icon: '🚀', id: 'projects' },
    { name: 'Inscripciones', icon: '📝', id: 'inscriptions' },
    { name: 'Contacto', icon: '📧', id: 'contact' },
    { name: 'Solitario', icon: '🃏', id: 'solitario' },
  ];

  return (
    <div className="desktop">
      {/* Logo centrado */}
      <div className="desktop-logo">
        <img src={logoURV} alt="CODE URV Logo" />
      </div>

      {/* Iconos del escritorio */}
      <div className="desktop-icons">
        {desktopIcons.map((icon) => (
          <DesktopIcon
            key={icon.id}
            name={icon.name}
            icon={icon.icon}
            onDoubleClick={() => onOpenWindow(icon.id, icon.name, icon.icon)}
          />
        ))}
      </div>

      {/* Taskbar */}
      <Taskbar 
        windows={windows} 
        onRestoreWindow={onRestoreWindow}
        onFocusWindow={onFocusWindow}
        onMinimizeWindow={onMinimizeWindow}
        onOpenWindow={onOpenWindow}
      />
    </div>
  );
}

export default Desktop;