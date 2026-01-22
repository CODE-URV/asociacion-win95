import React from 'react';
import './Contacto.css';
import logoURV from '../../assets/code_urv_logo_nobg.png';

function Contacto() {
  const redes = [
    { name: 'Instagram', icon: '📸', url: 'https://www.instagram.com/codeurv/', color: '#E1306C' },
    { name: 'LinkedIn', icon: '💼', url: 'https://es.linkedin.com/company/code-urv', color: '#0077B5' },
  ];

  return (
    <div className="contacto-wrapper">
      <div className="contacto-container">
        <div className="contacto-header">
          <div className="contacto-avatar">
            <img src={logoURV} alt="Logo CODE URV" />
          </div>
          <div className="contacto-info-main">
            <h3>CODE URV</h3>
            <p>Asociación de Estudiantes de Ingeniería</p>
            <p>📍 ETSE, Campus Sescelades, Tarragona</p>
          </div>
        </div>

        <div className="contacto-section-title">Nuestras Redes</div>
        <div className="redes-grid">
          {redes.map((red) => (
            <a key={red.name} href={red.url} target="_blank" rel="noopener noreferrer" className="red-card">
              <span className="red-icon">{red.icon}</span>
              <span className="red-name">{red.name}</span>
            </a>
          ))}
        </div>

        <div className="contacto-section-title">Contacto Directo</div>
        <div className="contacto-footer">
          <div className="contacto-field">
            <strong>📧 Email:</strong> <span>codeurv@urv.cat</span>
          </div>
          <div className="contacto-actions">
            <button className="win95-button" onClick={() => window.location.href = 'mailto:codeurv@urv.cat'}>
              ✉️ Enviar Email
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Contacto;