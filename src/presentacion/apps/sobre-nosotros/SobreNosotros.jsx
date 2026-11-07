import { useState, useEffect } from 'react';
import './SobreNosotros.css';
import logoURV from '../../assets/code_urv_logo_nobg.png';

// Galería local con imágenes importadas dinámicamente
const galeriaLocal = {
  excursiones: [
    { id: 'exc1', primary: new URL('../../assets/excursiones/excursion1.jpeg', import.meta.url).href, fallback: '' },
    { id: 'exc1', primary: new URL('../../assets/excursiones/excursion2.JPG', import.meta.url).href, fallback: '' },
    { id: 'exc1', primary: new URL('../../assets/excursiones/excursion3.jpeg', import.meta.url).href, fallback: '' },
    { id: 'exc1', primary: new URL('../../assets/excursiones/excursion4.JPG', import.meta.url).href, fallback: '' },
  ],
  hackatones: [
    { id: 'hack1', primary: new URL('../../assets/hackatones/hackaton1.jpeg', import.meta.url).href, fallback: '' },
    { id: 'hack2', primary: new URL('../../assets/hackatones/hackaton2.jpg', import.meta.url).href, fallback: '' },
    { id: 'hack1', primary: new URL('../../assets/hackatones/hackaton3.jpg', import.meta.url).href, fallback: '' },
    { id: 'hack2', primary: new URL('../../assets/hackatones/hackaton4.jpg', import.meta.url).href, fallback: '' },
    { id: 'hack2', primary: new URL('../../assets/hackatones/hackaton5.jpg', import.meta.url).href, fallback: '' },
  ],
  charlas: [
    { id: 'char1', primary: new URL('../../assets/charlas/charla1.jpeg', import.meta.url).href, fallback: '' },
    { id: 'char2', primary: new URL('../../assets/charlas/charla2.jpg', import.meta.url).href, fallback: '' },
    { id: 'char1', primary: new URL('../../assets/charlas/charla3.jpg', import.meta.url).href, fallback: '' },
    { id: 'char2', primary: new URL('../../assets/charlas/charla4.jpg', import.meta.url).href, fallback: '' },
  ],
};

function SobreNosotros() {
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const [galeria] = useState(galeriaLocal);

  const valores = [
    {
      titulo: 'Colaboración',
      descripcion: 'Trabajamos juntos para alcanzar objetivos comunes',
      icono: '🤝'
    },
    {
      titulo: 'Aprendizaje',
      descripcion: 'Crecimiento continuo en habilidades técnicas',
      icono: '📚'
    },
    {
      titulo: 'Innovación',
      descripcion: 'Impulsamos soluciones tecnológicas del futuro',
      icono: '🚀'
    },
    {
      titulo: 'Comunidad',
      descripcion: 'Somos una familia de apasionados por la informática',
      icono: '👥'
    }
  ];

  const totalImagenes = selectedFolder ? galeria[selectedFolder].length : 0;

  const handlePrevImage = () => {
    setCurrentImgIndex(prev => Math.max(0, prev - 1));
  };

  const handleNextImage = () => {
    setCurrentImgIndex(prev => Math.min(totalImagenes - 1, prev + 1));
  };

  useEffect(() => {
    if (!selectedFolder) return;
    const handleKeyPress = (e) => {
      if (e.key === 'ArrowLeft') setCurrentImgIndex(prev => Math.max(0, prev - 1));
      if (e.key === 'ArrowRight') setCurrentImgIndex(prev => Math.min(totalImagenes - 1, prev + 1));
      if (e.key === 'Escape') setSelectedFolder(null);
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedFolder, totalImagenes]);

  const handleOpenFolder = (folderName) => {
    setSelectedFolder(folderName);
    setCurrentImgIndex(0);
  };

  return (
    <div className="sobre-nosotros-container">
      {/* HERO SECTION */}
      <div className="hero-section">
        <img src={logoURV} alt="CODE URV" className="hero-logo" />
        <h1>CODE URV</h1>
        <p className="hero-subtitle">Asociación de Estudiantes de Informática</p>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <div className="contenido-principal">
        <div className="seccion">
          <h2>¿Quiénes Somos?</h2>
          <p className="texto-principal">
            Somos CODE URV, la asociación de estudiantes de Informática de la Universitat Rovira i Virgili.
            Formada por apasionados de la tecnología de la ETSE, nos dedicamos a impulsar el talento y crear
            una comunidad donde la innovación, el aprendizaje y la colaboración son nuestros pilares.
            En nuestro segundo año, seguimos preparando la próxima generación de profesionales que transformarán
            el mundo digital.
          </p>
        </div>

        <div className="seccion">
          <h2>Nuestra Misión</h2>
          <p className="texto-principal">
            Crear un ecosistema de aprendizaje y desarrollo donde cada estudiante pueda potenciar sus habilidades
            técnicas, colaborar en proyectos reales y conectar con profesionales del sector. Nos comprometemos a
            ser el puente entre la academia y la industria, formando profesionales competentes, creativos y
            comprometidos con la excelencia tecnológica.
          </p>
        </div>

        {/* VALORES */}
        <div className="seccion valores-seccion">
          <h2>Nuestros Valores</h2>
          <div className="valores-grid">
            {valores.map((valor, idx) => (
              <div key={idx} className="valor-card">
                <div className="valor-icono">{valor.icono}</div>
                <h3>{valor.titulo}</h3>
                <p>{valor.descripcion}</p>
              </div>
            ))}
          </div>
        </div>

        {/* QUÉ HACEMOS */}
        <div className="seccion">
          <h2>¿Qué Hacemos?</h2>
          <ul className="lista-actividades">
            <li>🏆 <strong>Hackathons</strong> - Competiciones de programación y desarrollo</li>
            <li>🎤 <strong>Charlas Técnicas</strong> - Conferencias de profesionales del sector</li>
            <li>💻 <strong>Proyectos de Informática</strong> - Desarrollo colaborativo de software</li>
            <li>🤝 <strong>Comunidad</strong> - Espacio de colaboración y apoyo mutuo</li>
          </ul>
        </div>
      </div>

      {/* GALERÍA DE EVENTOS (CARPETAS) */}
      <div className="galeria-seccion">
        <h2>Nuestros Eventos</h2>
        {Object.keys(galeria).length === 0 ? (
          <div className="empty-message">📁 No hay carpetas con imágenes</div>
        ) : (
          <div className="galeria-grid">
            {Object.keys(galeria).map((folderName) => (
              <div
                key={folderName}
                className="galeria-item folder-item"
                onClick={() => handleOpenFolder(folderName)}
              >
                <div className="folder-icon">📁</div>
                <div className="folder-name">{folderName}</div>
                <div className="galeria-overlay">
                  <span>Abrir ({galeria[folderName].length})</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL DE SLIDER */}
      {selectedFolder && galeria[selectedFolder] && galeria[selectedFolder].length > 0 && (
        <div className="modal-overlay" onClick={() => setSelectedFolder(null)}>
          <div className="modal-content slider-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span>📁 {selectedFolder} ({currentImgIndex + 1}/{galeria[selectedFolder].length})</span>
              <button className="modal-close" onClick={() => setSelectedFolder(null)}>✕</button>
            </div>

            <div className="slider-container">
              <img
                src={galeria[selectedFolder][currentImgIndex].primary}
                alt={`${selectedFolder} ${currentImgIndex + 1}`}
                className="modal-image"
                crossOrigin="anonymous"
              />
            </div>

            <div className="slider-controls">
              <button
                className="slider-btn"
                onClick={handlePrevImage}
                disabled={currentImgIndex === 0}
              >
                ◀ Anterior
              </button>
              <span className="slider-counter">
                {currentImgIndex + 1} / {galeria[selectedFolder].length}
              </span>
              <button
                className="slider-btn"
                onClick={handleNextImage}
                disabled={currentImgIndex === galeria[selectedFolder].length - 1}
              >
                Siguiente ▶
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SobreNosotros;