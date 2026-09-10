import React from 'react';

function AcercaDe() {
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

      <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>
        CODE URV - Asociación de Estudiantes
      </h2>

      <div style={{
        width: '100%',
        height: '2px',
        background: 'linear-gradient(90deg, #808080 0%, #dfdfdf 100%)',
        margin: '8px 0'
      }}></div>

      <div style={{ textAlign: 'center', fontSize: '12px', lineHeight: '1.6' }}>
        <p style={{ margin: '8px 0' }}><strong>Versión:</strong> 1.0 (Build 2026)</p>
        <p style={{ margin: '8px 0' }}><strong>Sistema:</strong> Windows 95 Style</p>
      </div>

      <div style={{
        width: '100%',
        height: '2px',
        background: 'linear-gradient(90deg, #808080 0%, #dfdfdf 100%)',
        margin: '8px 0'
      }}></div>

      <div style={{ textAlign: 'center', fontSize: '11px', color: '#000', lineHeight: '1.8' }}>
        <p style={{ margin: '4px 0' }}>© 2026 CODE URV</p>
        <p style={{ margin: '4px 0' }}>Todos los derechos reservados</p>
        <p style={{ margin: '12px 0 4px 0', fontWeight: 'bold' }}>Desarrollado por los admministradores de CODE URV</p>
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

export default AcercaDe;