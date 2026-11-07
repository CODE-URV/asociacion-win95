import DesktopIcon from './DesktopIcon';
import Taskbar from './Taskbar';
import './Desktop.css';
import logoURV from '../assets/code_urv_logo_desktop.png';

function Desktop({ apps, ventanas, acciones, sesion, alCerrarSesion }) {
  return (
    <div className="desktop">
      <div className="desktop-logo">
        <img src={logoURV} alt="CODE URV Logo" />
      </div>

      <div className="desktop-icons">
        {apps
          .filter((app) => app.escritorio)
          .map((app) => (
            <DesktopIcon
              key={app.id}
              nombre={app.titulo}
              icono={app.icono}
              imagen={app.imagen}
              alAbrir={() => acciones.abrir(app)}
            />
          ))}
      </div>

      <Taskbar
        apps={apps}
        ventanas={ventanas}
        acciones={acciones}
        sesion={sesion}
        alCerrarSesion={alCerrarSesion}
      />
    </div>
  );
}

export default Desktop;
