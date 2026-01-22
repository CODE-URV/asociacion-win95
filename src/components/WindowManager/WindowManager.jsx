import React from 'react';
import Window from '../Window/Window';
import './WindowManager.css';

function WindowManager({ windows, onClose, onMinimize, onFocus, onUpdatePosition, onUpdateSize, onMaximize }) {
  return (
    <div className="window-manager">
      {windows.map((window) => (
        <Window
          key={window.id}
          window={window}
          onClose={onClose}
          onMinimize={onMinimize}
          onFocus={onFocus}
          onUpdatePosition={onUpdatePosition}
          onUpdateSize={onUpdateSize}
          onMaximize={onMaximize}
        />
      ))}
    </div>
  );
}

export default WindowManager;