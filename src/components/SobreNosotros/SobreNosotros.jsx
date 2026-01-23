import React, { useState, useEffect } from 'react';
import './SobreNosotros.css';
import logoURV from '../../assets/code_urv_logo_nobg.png';

const API_KEY = import.meta.env.VITE_GOOGLE_CALENDAR_API_KEY;
const FOLDER_ID = import.meta.env.VITE_GALERIA_FOLDER_ID;

function SobreNosotros() {
    const [selectedFolder, setSelectedFolder] = useState(null);
    const [currentImgIndex, setCurrentImgIndex] = useState(0);
    const [galeria, setGaleria] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [preloadedImages, setPreloadedImages] = useState({});

    useEffect(() => {
        fetchGallery();
    }, []);

    const fetchGallery = async () => {
        try {
            // 1. Listar subcarpetas
            const foldersUrl = `https://www.googleapis.com/drive/v3/files?` + new URLSearchParams({
                q: `'${FOLDER_ID}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
                fields: 'files(id,name)',
                orderBy: 'name',
                key: API_KEY,
            });

            const foldersRes = await fetch(foldersUrl);
            if (!foldersRes.ok) throw new Error(`Error ${foldersRes.status}: ${foldersRes.statusText}`);
            const foldersData = await foldersRes.json();

            const folders = foldersData.files || [];
            const galeriaData = {};

            // 2. Para cada carpeta, listar imágenes
            for (const folder of folders) {
                const imagesUrl = `https://www.googleapis.com/drive/v3/files?` + new URLSearchParams({
                    q: `'${folder.id}' in parents and mimeType contains 'image/' and trashed=false`,
                    fields: 'files(id,name)',
                    orderBy: 'name',
                    pageSize: '100',
                    key: API_KEY,
                });

                const imagesRes = await fetch(imagesUrl);
                if (!imagesRes.ok) continue;
                const imagesData = await imagesRes.json();

                // ✅ Guardamos ambas URLs: una para Chrome y otra de respaldo para Firefox
                const images = (imagesData.files || []).map(file => ({
                    id: file.id,
                    primary: `https://drive.google.com/uc?export=view&id=${file.id}`,
                    fallback: `https://lh3.googleusercontent.com/d/${file.id}=w2000`
                }));

                if (images.length > 0) {
                    galeriaData[folder.name] = images;
                }
            }

            setGaleria(galeriaData);
            setLoading(false);
        } catch (err) {
            console.error("Error cargando galería:", err);
            setError(err.message || "No se pudo cargar la galería");
            setLoading(false);
        }
    };

    // ✅ Función para precargar imágenes de una carpeta
    const preloadFolderImages = (folderName) => {
        if (preloadedImages[folderName]) return; // Ya precargadas

        const images = galeria[folderName];
        if (!images) return;

        const loadedImages = [];
        
        images.forEach((imgData) => {
            const img = new Image();
            
            // Intenta cargar la URL principal
            img.src = imgData.primary;
            
            // Si falla, intenta con fallback
            img.onerror = () => {
                img.src = imgData.fallback;
            };
            
            loadedImages.push(img);
        });

        setPreloadedImages(prev => ({
            ...prev,
            [folderName]: loadedImages
        }));
    };

    // ✅ Precargar cuando se abre una carpeta
    const handleOpenFolder = (folderName) => {
        setSelectedFolder(folderName);
        setCurrentImgIndex(0);
        preloadFolderImages(folderName);
    };

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

    const handlePrevImage = () => {
        setCurrentImgIndex(prev => Math.max(0, prev - 1));
    };

    const handleNextImage = () => {
        if (selectedFolder) {
            setCurrentImgIndex(prev => Math.min(galeria[selectedFolder].length - 1, prev + 1));
        }
    };

    const handleKeyPress = (e) => {
        if (!selectedFolder) return;
        if (e.key === 'ArrowLeft') handlePrevImage();
        if (e.key === 'ArrowRight') handleNextImage();
        if (e.key === 'Escape') setSelectedFolder(null);
    };

    useEffect(() => {
        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [selectedFolder, currentImgIndex]);

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
                {loading ? (
                    <div className="loading-message">⏳ Cargando galería...</div>
                ) : error ? (
                    <div className="error-message">❌ {error}</div>
                ) : Object.keys(galeria).length === 0 ? (
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
                                onError={(e) => {
                                    // Si falla la URL principal, intenta con la de respaldo
                                    if (e.target.src !== galeria[selectedFolder][currentImgIndex].fallback) {
                                        e.target.src = galeria[selectedFolder][currentImgIndex].fallback;
                                    }
                                }}
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