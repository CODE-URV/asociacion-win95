import DesktopIcon from './DesktopIcon';
import './Desktop.css';
import logoURV from '../assets/code_urv_logo_desktop.png';

/** Fondo del escritorio con el logo y los iconos de las aplicaciones. */
function Desktop({ apps, acciones }) {
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
    </div>
  );
}

export default Desktop;
