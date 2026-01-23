import React from 'react';
import DesktopIcon from './DesktopIcon';
import Taskbar from '../Taskbar/Taskbar';
import './Desktop.css';
import logoURV from '../../assets/code_urv_logo_desktop.png';
import aboutUsIcon from '../../assets/desktop_icons/about_us.png';
import eventsIcon from '../../assets/desktop_icons/events.png';
import projectsIcon from '../../assets/desktop_icons/projects.png';
import sociosIcon from '../../assets/desktop_icons/socios.png';
import contactIcon from '../../assets/desktop_icons/contact.png';
import gameIcon from '../../assets/desktop_icons/game.png';

function Desktop({ onOpenWindow, windows, onRestoreWindow, onFocusWindow, onMinimizeWindow }) {
  const desktopIcons = [
    { name: 'Quien somos', icon: '💻', iconImage: aboutUsIcon, id: 'about' },
    { name: 'Eventos', icon: '📅', iconImage: eventsIcon, id: 'events' },
    { name: 'Proyectos', icon: '🚀',iconImage: projectsIcon,  id: 'projects' },
    { name: 'Hazte socio', icon: '📝', iconImage: sociosIcon, id: 'inscriptions' },
    { name: 'Contacto', icon: '📧', iconImage: contactIcon, id: 'contact' },
    { name: 'Solitario', icon: '🃏',iconImage: gameIcon, id: 'solitario' },
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
            iconImage={icon.iconImage}
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