import React from 'react';
import './StartMenu.css';
import logoURV from '../../assets/code_urv_logo_nobg.png';
import { getAppsPorSeccion } from '../../apps/registry';

function StartMenu({ isOpen, onClose, onOpenWindow }) {
  if (!isOpen) return null;

  const itemsPrincipales = getAppsPorSeccion('principal');
  const itemsJuegos = getAppsPorSeccion('juegos');
  const itemsSistema = getAppsPorSeccion('sistema');

  const handleItemClick = (app) => {
    onOpenWindow(app.id, app.tituloVentana || app.nombre, app.icono);
    onClose();
  };

  // Pequeño ayudante para no repetir el JSX de cada botón tres veces
  const renderItem = (app) => (
    <button key={app.id} className="start-menu-item" onClick={() => handleItemClick(app)}>
      <span className="start-menu-item-icon">
        {app.iconoImg
          ? <img src={app.iconoImg} alt="" className="start-menu-mini-icon" />
          : app.icono}
      </span>
      <span className="start-menu-item-text">{app.nombre}</span>
    </button>
  );

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
            {itemsPrincipales.map(renderItem)}
          </div>

          <div className="start-menu-separator"></div>

          {/* SECCIÓN 2: JUEGOS */}
          <div className="start-menu-section">
            {itemsJuegos.map(renderItem)}
          </div>

          <div className="start-menu-separator"></div>

          {/* SECCIÓN 3: SISTEMA (Acerca de...) */}
          <div className="start-menu-section">
            {itemsSistema.map(renderItem)}
          </div>
        </div>
      </div>
    </>
  );
}

export default StartMenu;