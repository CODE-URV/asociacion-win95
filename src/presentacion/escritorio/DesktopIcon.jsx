import useModoTactil from './useModoTactil';

/** Icono del escritorio: doble clic con ratón, un toque en pantallas táctiles. */
function DesktopIcon({ nombre, icono, imagen, alAbrir }) {
  const tactil = useModoTactil();

  return (
    <div
      className="desktop-icon"
      role="button"
      tabIndex={0}
      onClick={tactil ? alAbrir : undefined}
      onDoubleClick={tactil ? undefined : alAbrir}
      onKeyDown={(e) => e.key === 'Enter' && alAbrir()}
    >
      <div className="desktop-icon-image">
        {imagen ? <img src={imagen} alt="" /> : <span className="desktop-icon-emoji">{icono}</span>}
      </div>
      <div className="desktop-icon-label">{nombre}</div>
    </div>
  );
}

export default DesktopIcon;
