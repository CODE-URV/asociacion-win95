import './StartMenu.css';
import logoURV from '../assets/code_urv_logo_nobg.png';

const SECCIONES = ['principal', 'juegos', 'sistema'];

function Elemento({ icono, imagen, texto, alPulsar }) {
  return (
    <button className="start-menu-item" onClick={alPulsar}>
      <span className="start-menu-item-icon">
        {imagen ? <img src={imagen} alt="" className="start-menu-mini-icon" /> : icono}
      </span>
      <span className="start-menu-item-text">{texto}</span>
    </button>
  );
}

function StartMenu({ apps, sesion, alAbrir, alCerrarSesion, alCerrar }) {
  const pulsar = (accion) => () => {
    accion();
    alCerrar();
  };

  const secciones = SECCIONES.map((seccion) => apps.filter((app) => app.menu === seccion)).filter(
    (lista) => lista.length > 0
  );

  return (
    <>
      <div className="start-menu-overlay" onClick={alCerrar} />

      <div className="start-menu">
        <div className="start-menu-sidebar">
          <img src={logoURV} alt="CODE URV" className="start-menu-logo" />
          <span className="start-menu-title">CODE URV</span>
        </div>

        <div className="start-menu-content">
          {secciones.map((lista) => (
            <div key={lista[0].menu}>
              <div className="start-menu-section">
                {lista.map((app) => (
                  <Elemento
                    key={app.id}
                    icono={app.icono}
                    imagen={app.imagen}
                    texto={app.id === 'config' ? 'Acerca de...' : app.titulo}
                    alPulsar={pulsar(() => alAbrir(app))}
                  />
                ))}
              </div>
              <div className="start-menu-separator" />
            </div>
          ))}

          <div className="start-menu-section">
            <Elemento icono="🔑" texto={`Cerrar sesión de ${sesion?.nombre ?? 'Invitado'}...`} alPulsar={pulsar(alCerrarSesion)} />
          </div>
        </div>
      </div>
    </>
  );
}

export default StartMenu;
