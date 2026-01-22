import React from 'react';

function DesktopIcon({ name, icon, iconImage, onDoubleClick }) {
  return (
    <div className="desktop-icon" onDoubleClick={onDoubleClick}>
      <div className="desktop-icon-image">
        {iconImage ? <img src={iconImage} alt={name} /> : icon}
      </div>
      <div className="desktop-icon-label">{name}</div>
    </div>
  );
}

export default DesktopIcon;