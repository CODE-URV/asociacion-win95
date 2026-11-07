function DesktopIcon({ nombre, icono, imagen, alAbrir }) {
  return (
    <div
      className="desktop-icon"
      role="button"
      tabIndex={0}
      onDoubleClick={alAbrir}
      onKeyDown={(e) => e.key === 'Enter' && alAbrir()}
    >
      <div className="desktop-icon-image">
        {imagen ? <img src={imagen} alt={nombre} /> : <span className="desktop-icon-emoji">{icono}</span>}
      </div>
      <div className="desktop-icon-label">{nombre}</div>
    </div>
  );
}

export default DesktopIcon;
