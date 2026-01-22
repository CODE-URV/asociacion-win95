import React from 'react';
import './StartMenu.css';
import logoURV from '../../assets/code_urv_logo_nobg.png';

function StartMenu({ isOpen, onClose, onOpenWindow }) {
  if (!isOpen) return null;

  const menuItems = [
    { name: 'Sobre Nosotros', icon: '💻', id: 'about' },
    { name: 'Eventos', icon: '📅', id: 'events' },
    { name: 'Proyectos', icon: '🚀', id: 'projects' },
    { name: 'Inscripciones', icon: '📝', id: 'inscriptions' },
    { name: 'Contacto', icon: '📧', id: 'contact' },
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
      {/* Overlay para cerrar al hacer clic fuera */}
      <div className="start-menu-overlay" onClick={onClose}></div>
      
      <div className="start-menu">
        {/* Banda lateral con logo */}
        <div className="start-menu-sidebar">
          <img src={logoURV} alt="CODE URV" className="start-menu-logo" />
          <span className="start-menu-title">CODE URV</span>
        </div>

        {/* Contenido del menú */}
        <div className="start-menu-content">
          {/* Sección principal */}
          <div className="start-menu-section">
            {menuItems.map((item) => (
              <button
                key={item.id}
                className="start-menu-item"
                onClick={() => handleItemClick(item)}
              >
                <span className="start-menu-item-icon">{item.icon}</span>
                <span className="start-menu-item-text">{item.name}</span>
              </button>
            ))}
          </div>

          {/* Separador */}
          <div className="start-menu-separator"></div>

          {/* Sección inferior */}
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