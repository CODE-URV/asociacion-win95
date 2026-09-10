import React from 'react';
import DesktopIcon from './DesktopIcon';
import Taskbar from '../Taskbar/Taskbar';
import './Desktop.css';
import logoURV from '../../assets/code_urv_logo_desktop.png';
import { getAppsPorSeccion } from '../../apps/registry';

function Desktop({ onOpenWindow, windows, onRestoreWindow, onFocusWindow, onMinimizeWindow }) {
  // El escritorio muestra las apps 'principal' + 'juegos' (todo menos las de 'sistema')
  const iconosEscritorio = [
    ...getAppsPorSeccion('principal'),
    ...getAppsPorSeccion('juegos'),
  ];

  return (
    <div className="desktop">
      {/* Logo centrado */}
      <div className="desktop-logo">
        <img src={logoURV} alt="CODE URV Logo" />
      </div>

      {/* Iconos del escritorio */}
      <div className="desktop-icons">
        {iconosEscritorio.map((app) => (
          <DesktopIcon
            key={app.id}
            name={app.nombre}
            icon={app.icono}
            iconImage={app.iconoImg}
            onDoubleClick={() => onOpenWindow(app.id, app.nombre, app.icono)}
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