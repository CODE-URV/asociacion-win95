import React, { useState } from 'react';
import Desktop from './components/Desktop/Desktop';
import WindowManager from './components/WindowManager/WindowManager';
import { getApp } from './apps/registry';
import './App.css';

function App() {
  const [windows, setWindows] = useState([]);
  const [nextId, setNextId] = useState(0);

  const getWindowContent = (id) => {
    const app = getApp(id);
    if (!app || !app.componente) {
      return <div style={{ padding: '20px' }}>Contenido no disponible</div>;
    }
    const Componente = app.componente;
    return <Componente />;
  };

  const handleOpenWindow = (id, title, icon) => {
    setWindows((prevWindows) => {
      const existingWindow = prevWindows.find((w) => w.title === title);
      if (existingWindow) {
        handleRestoreWindow(existingWindow.id);
        return prevWindows;
      }

      const maxZ = Math.max(...prevWindows.map((w) => w.zIndex), 0);
      const app = getApp(id);

      // Tamaño desde el registro (con un valor por defecto por si acaso)
      const width = app?.tamaño?.width ?? 650;
      const height = app?.tamaño?.height ?? 450;

      // El 'config' se centra; el resto va en cascada
      let x = 50 + (nextId * 30) % 200;
      let y = 50 + (nextId * 30) % 150;
      if (id === 'config') {
        x = window.innerWidth / 2 - width / 2;
        y = window.innerHeight / 2 - height / 2;
      }

      const newWindow = {
        id: nextId,
        title,
        icon,
        x,
        y,
        width,
        height,
        minimized: false,
        maximized: false,
        zIndex: maxZ + 1,
        content: getWindowContent(id),
      };
      return [...prevWindows, newWindow];
    });
    setNextId(nextId + 1);
  };

  const handleCloseWindow = (id) => {
    setWindows((prevWindows) => prevWindows.filter((w) => w.id !== id));
  };

  const handleMinimizeWindow = (id) => {
    setWindows((prevWindows) =>
      prevWindows.map((w) => (w.id === id ? { ...w, minimized: true } : w))
    );
  };

  const handleRestoreWindow = (id) => {
    setWindows((prevWindows) => {
      const maxZ = Math.max(...prevWindows.map((w) => w.zIndex), 0);
      return prevWindows.map((w) =>
        w.id === id ? { ...w, minimized: false, zIndex: maxZ + 1 } : w
      );
    });
  };

  const handleMaximizeWindow = (id) => {
    setWindows((prevWindows) =>
      prevWindows.map((w) => (w.id === id ? { ...w, maximized: !w.maximized } : w))
    );
  };

  const handleFocusWindow = (id) => {
    setWindows((prevWindows) => {
      const maxZ = Math.max(...prevWindows.map((w) => w.zIndex), 0);
      return prevWindows.map((w) => (w.id === id ? { ...w, zIndex: maxZ + 1 } : w));
    });
  };

  const handleUpdatePosition = (id, position) => {
    setWindows((prevWindows) =>
      prevWindows.map((w) => (w.id === id ? { ...w, x: position.x, y: position.y } : w))
    );
  };

  const handleUpdateSize = (id, size) => {
    setWindows((prevWindows) =>
      prevWindows.map((w) =>
        w.id === id ? { ...w, width: size.width, height: size.height } : w
      )
    );
  };

  return (
    <div className="app-container">
      <Desktop
        onOpenWindow={handleOpenWindow}
        windows={windows}
        onRestoreWindow={handleRestoreWindow}
        onFocusWindow={handleFocusWindow}
        onMinimizeWindow={handleMinimizeWindow}
      />
      <WindowManager
        windows={windows.filter((w) => !w.minimized)}
        onClose={handleCloseWindow}
        onMinimize={handleMinimizeWindow}
        onFocus={handleFocusWindow}
        onUpdatePosition={handleUpdatePosition}
        onUpdateSize={handleUpdateSize}
        onMaximize={handleMaximizeWindow}
      />
    </div>
  );
}

export default App;