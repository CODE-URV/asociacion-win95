import React from 'react';
import './StartMenu.css';
import logoURV from '../../assets/code_urv_logo_nobg.png';

// Importamos los iconos
import aboutUsIcon from '../../assets/desktop_icons/about_us.png';
import eventsIcon from '../../assets/desktop_icons/events.png';
import projectsIcon from '../../assets/desktop_icons/projects.png';
import sociosIcon from '../../assets/desktop_icons/socios.png';
import contactIcon from '../../assets/desktop_icons/contact.png';
import gameIcon from '../../assets/desktop_icons/game.png';

function StartMenu({ isOpen, onClose, onOpenWindow }) {
  if (!isOpen) return null;

  // Apps principales
  const mainItems = [
    { name: 'Quien Somos', icon: '💻', iconImage: aboutUsIcon, id: 'about' },
    { name: 'Eventos', icon: '📅', iconImage: eventsIcon, id: 'events' },
    { name: 'Proyectos', icon: '🚀', iconImage: projectsIcon, id: 'projects' },
    { name: 'Hazte socio', icon: '📝', iconImage: sociosIcon, id: 'inscriptions' },
    { name: 'Contacto', icon: '📧', iconImage: contactIcon, id: 'contact' },
  ];

  // Sección de Juegos
  const gameItems = [
    { name: 'Solitario', icon: '🃏', iconImage: gameIcon, id: 'solitario' },
  ];

  const handleItemClick = (item) => {
    onOpenWindow(item.id, item.name, item.icon);
    onClose();
  };

  const handleConfigClick = () => {
    onOpenWindow('config', 'Acerca de CODE URV', '⚙️');
    onClose();
  };

  return (
    <>
      <div className="start-menu-overlay" onClick={onClose}></div>
      
      <div className="start-menu">
        <div className="start-menu-sidebar">
          <img src={logoURV} alt="CODE URV" className="start-menu-logo" />
          <span className="start-menu-title">CODE URV</span>
        </div>

        <div className="start-menu-content">
          {/* SECCIÓN 1: APPS PRINCIPALES */}
          <div className="start-menu-section">
            {mainItems.map((item) => (
              <button key={item.id} className="start-menu-item" onClick={() => handleItemClick(item)}>
                <span className="start-menu-item-icon">
                  {item.iconImage ? <img src={item.iconImage} alt="" className="start-menu-mini-icon" /> : item.icon}
                </span>
                <span className="start-menu-item-text">{item.name}</span>
              </button>
            ))}
          </div>

          <div className="start-menu-separator"></div>

          {/* SECCIÓN 2: JUEGOS / ENTRETENIMIENTO */}
          <div className="start-menu-section">
            {gameItems.map((item) => (
              <button key={item.id} className="start-menu-item" onClick={() => handleItemClick(item)}>
                <span className="start-menu-item-icon">
                  {item.iconImage ? <img src={item.iconImage} alt="" className="start-menu-mini-icon" /> : item.icon}
                </span>
                <span className="start-menu-item-text">{item.name}</span>
              </button>
            ))}
          </div>

          <div className="start-menu-separator"></div>

          {/* SECCIÓN 3: CONFIG / ACERCA DE */}
          <div className="start-menu-section">
            <button className="start-menu-item" onClick={handleConfigClick}>
              <span className="start-menu-item-icon">⚙️</span>
              <span className="start-menu-item-text">Acerca de...</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default StartMenu;