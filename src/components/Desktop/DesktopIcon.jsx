import React from 'react';

function DesktopIcon({ name, icon, onDoubleClick }) {
  return (
    <div className="desktop-icon" onDoubleClick={onDoubleClick}>
      <div className="desktop-icon-image">{icon}</div>
      <div className="desktop-icon-label">{name}</div>
    </div>
  );
}

export default DesktopIcon;