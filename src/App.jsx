import React, { useState } from 'react';
import Desktop from './components/Desktop/Desktop';
import WindowManager from './components/WindowManager/WindowManager';
import Solitario from './components/Solitario/Solitario';
import SobreNosotros from './components/SobreNosotros/SobreNosotros';
import Inscripciones from './components/Inscripciones/Inscripciones';
import Contacto from './components/Contacto/Contacto';
import Events from './components/Eventos/Eventos';
import Projects from './components/Proyectos/Proyectos';
import './App.css';

function App() {
  const [windows, setWindows] = useState([]);
  const [nextId, setNextId] = useState(0);

  const getWindowContent = (id, title) => {
    // Sobre Nosotros
    if (id === 'about') {
      return <SobreNosotros />;
    }

    if (id === 'events') {
      return <Events />;
    }

    if (id === 'projects') {
      return <Projects />;
    }

    if (id === 'inscriptions') {
      return <Inscripciones />;
    }

    if (id === 'contact') {
      return <Contacto />;
    }
    
    // Solitario
    if (id === 'solitario') {
      return <Solitario />;
    }
    
    // Configuración (Start Menu)
    if (id === 'config') {
      return (
        <div style={{ 
          padding: '20px', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          gap: '16px',
          fontFamily: 'MS Sans Serif, Arial, sans-serif'
        }}>
          <div style={{ 
            width: '64px', 
            height: '64px', 
            fontSize: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            🎓
          </div>
          
          <h2 style={{ 
            margin: 0, 
            fontSize: '16px',
            fontWeight: 'bold'
          }}>
            CODE URV - Asociación de Estudiantes
          </h2>
          
          <div style={{
            width: '100%',
            height: '2px',
            background: 'linear-gradient(90deg, #808080 0%, #dfdfdf 100%)',
            margin: '8px 0'
          }}></div>
          
          <div style={{ 
            textAlign: 'center', 
            fontSize: '12px',
            lineHeight: '1.6'
          }}>
            <p style={{ margin: '8px 0' }}>
              <strong>Versión:</strong> 1.0 (Build 2026)
            </p>
            <p style={{ margin: '8px 0' }}>
              <strong>Sistema:</strong> Windows 95 Style
            </p>
          </div>
          
          <div style={{
            width: '100%',
            height: '2px',
            background: 'linear-gradient(90deg, #808080 0%, #dfdfdf 100%)',
            margin: '8px 0'
          }}></div>
          
          <div style={{ 
            textAlign: 'center', 
            fontSize: '11px',
            color: '#000',
            lineHeight: '1.8'
          }}>
            <p style={{ margin: '4px 0' }}>
              © 2026 CODE URV
            </p>
            <p style={{ margin: '4px 0' }}>
              Todos los derechos reservados
            </p>
            <p style={{ margin: '12px 0 4px 0', fontWeight: 'bold' }}>
              Desarrollado por:
            </p>
            <p style={{ margin: '4px 0' }}>
              [Gaizka Alonso Martinez]
            </p>
            <p style={{ margin: '12px 0 4px 0', fontSize: '10px', color: '#666' }}>
              Hecho con ❤️ para la comunidad estudiantil
            </p>
          </div>
          
          <button style={{
            marginTop: '16px',
            padding: '4px 20px',
            backgroundColor: '#c0c0c0',
            border: '2px outset #dfdfdf',
            borderRightColor: '#808080',
            borderBottomColor: '#808080',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 'bold'
          }}>
            Aceptar
          </button>
        </div>
      );
    }
    
    // Contenido por defecto para otras ventanas
    return <div style={{ padding: '20px' }}>Contenido de {title}</div>;
  };

  const handleOpenWindow = (id, title, icon) => {
    setWindows((prevWindows) => {
      const existingWindow = prevWindows.find(w => w.title === title);
      if (existingWindow) {
        handleRestoreWindow(existingWindow.id);
        return prevWindows;
      }

      const maxZ = Math.max(...prevWindows.map((w) => w.zIndex), 0);
      
      // Configuración de tamaños por ventana
      let width = 650;
      let height = 450;
      let x = 50 + (nextId * 30) % 200;
      let y = 50 + (nextId * 30) % 150;
      
      if (id === 'config') {
        width = 450;
        height = 550;
        x = window.innerWidth / 2 - 225;
        y = window.innerHeight / 2 - 275;
      } else if (id === 'solitario') {
        width = 800;
        height = 600;
      } else if (id === 'about') {
        width = 700;
        height = 550;
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
        content: getWindowContent(id, title),
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
      prevWindows.map((w) =>
        w.id === id ? { ...w, minimized: true } : w
      )
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
      prevWindows.map((w) =>
        w.id === id ? { ...w, maximized: !w.maximized } : w
      )
    );
  };

  const handleFocusWindow = (id) => {
    setWindows((prevWindows) => {
      const maxZ = Math.max(...prevWindows.map((w) => w.zIndex), 0);
      return prevWindows.map((w) =>
        w.id === id ? { ...w, zIndex: maxZ + 1 } : w
      );
    });
  };

  const handleUpdatePosition = (id, position) => {
    setWindows((prevWindows) =>
      prevWindows.map((w) =>
        w.id === id ? { ...w, x: position.x, y: position.y } : w
      )
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