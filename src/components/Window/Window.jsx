import React, { useState } from 'react';
import './Window.css';

function Window({ window, onClose, onMinimize, onFocus, onUpdatePosition, onUpdateSize, onMaximize }) {
  const [position, setPosition] = useState({ x: window.x, y: window.y });
  const [size, setSize] = useState({ width: window.width, height: window.height });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const MIN_WIDTH = 300;
  const MIN_HEIGHT = 200;

  const handleTitleBarMouseDown = (e) => {
    if (e.target.closest('.window-btn')) {
      return;
    }

    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
    onFocus(window.id);
    e.preventDefault();
  };

  const handleResizeMouseDown = (e, direction) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsResizing(true);
    setResizeDirection(direction);
    setDragStart({
      x: e.clientX,
      y: e.clientY,
    });
    onFocus(window.id);
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      setPosition({ x: newX, y: newY });
    }

    if (isResizing && resizeDirection) {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;

      let newWidth = size.width;
      let newHeight = size.height;
      let newX = position.x;
      let newY = position.y;

      if (resizeDirection.includes('e')) {
        newWidth = Math.max(MIN_WIDTH, size.width + deltaX);
      }
      if (resizeDirection.includes('w')) {
        newWidth = Math.max(MIN_WIDTH, size.width - deltaX);
        newX = position.x + deltaX;
      }
      if (resizeDirection.includes('s')) {
        newHeight = Math.max(MIN_HEIGHT, size.height + deltaY);
      }
      if (resizeDirection.includes('n')) {
        newHeight = Math.max(MIN_HEIGHT, size.height - deltaY);
        newY = position.y + deltaY;
      }

      setSize({ width: newWidth, height: newHeight });
      setPosition({ x: newX, y: newY });
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      onUpdatePosition(window.id, position);
    }
    if (isResizing) {
      setIsResizing(false);
      onUpdateSize(window.id, size);
    }
  };

  React.useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, dragStart, position, size, resizeDirection]);

  return (
    <div
      className={`window ${isDragging ? 'dragging' : ''} ${isResizing ? 'resizing' : ''} ${window.maximized ? 'maximized' : ''}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
        zIndex: window.zIndex,
      }}
      onMouseDown={() => onFocus(window.id)}
    >
      {/* Title Bar */}
      <div 
        className="window-title-bar" 
        onMouseDown={handleTitleBarMouseDown}
        onDoubleClick={() => onMaximize(window.id)}
      >
        <div className="window-title">
          <span className="window-icon">{window.icon}</span>
          <span className="window-title-text">{window.title}</span>
        </div>
        <div className="window-buttons">
          <button
            className="window-btn window-minimize-btn"
            onClick={(e) => {
              e.stopPropagation();
              onMinimize(window.id);
            }}
            title="Minimizar"
          >
            _
          </button>
          <button
            className="window-btn window-maximize-btn"
            onClick={(e) => {
              e.stopPropagation();
              onMaximize(window.id);
            }}
            title="Maximizar"
          >
            □
          </button>
          <button
            className="window-btn window-close-btn"
            onClick={(e) => {
              e.stopPropagation();
              onClose(window.id);
            }}
            title="Cerrar"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="window-content">
        {window.content}
      </div>

      {/* Resize Handles */}
      {!window.maximized && (
        <>
          <div className="resize-handle resize-n" onMouseDown={(e) => handleResizeMouseDown(e, 'n')} />
          <div className="resize-handle resize-s" onMouseDown={(e) => handleResizeMouseDown(e, 's')} />
          <div className="resize-handle resize-e" onMouseDown={(e) => handleResizeMouseDown(e, 'e')} />
          <div className="resize-handle resize-w" onMouseDown={(e) => handleResizeMouseDown(e, 'w')} />
          <div className="resize-handle resize-ne" onMouseDown={(e) => handleResizeMouseDown(e, 'ne')} />
          <div className="resize-handle resize-nw" onMouseDown={(e) => handleResizeMouseDown(e, 'nw')} />
          <div className="resize-handle resize-se" onMouseDown={(e) => handleResizeMouseDown(e, 'se')} />
          <div className="resize-handle resize-sw" onMouseDown={(e) => handleResizeMouseDown(e, 'sw')} />
        </>
      )}
    </div>
  );
}

export default Window;