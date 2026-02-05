import React, { useState, useEffect } from 'react';
import './Proyectos.css';

function Proyectos() {
    const [proyectos, setProyectos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedId, setSelectedId] = useState(null);
    const [filtro, setFiltro] = useState('Todos');

    useEffect(() => {
        fetchProyectos();
    }, []);

    const parseCSVLine = (line) => {
        const result = [];
        let cur = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(cur.trim());
                cur = '';
            } else {
                cur += char;
            }
        }
        result.push(cur.trim());
        return result;
    };

    const fetchProyectos = async () => {
        try {
            const response = await fetch('/api/get-proyectos');
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err?.error || `Error ${response.status}`);
            }
            const text = await response.text();

            const rows = text.split(/\r?\n/).filter(row => row.trim() !== '').slice(1);

            const data = rows.map(row => {
                const cols = parseCSVLine(row);
                const clean = (val) => val?.replace(/^"|"$/g, '').trim();

                return {
                    id: clean(cols[0]),
                    nombre: clean(cols[1]),
                    descripcion: clean(cols[2]),
                    responsable: clean(cols[3]),
                    email: clean(cols[4]),
                    estado: clean(cols[5]),
                    progreso: clean(cols[6]),
                    tecnologias: clean(cols[7])?.split('|').map(t => t.trim()).filter(Boolean) || [],
                    repositorio: clean(cols[8]),
                    colaboradores: clean(cols[9])?.split('|').map(c => c.trim()).filter(Boolean) || []
                };
            }).filter(p => p.nombre);

            setProyectos(data);
        } catch (err) {
            console.error("Error cargando proyectos:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const getEstadoColor = (estado) => {
        switch (estado?.toLowerCase().trim()) {
            case 'completado': return '#4caf50';
            case 'en progreso': return '#ffc107';
            case 'planificación': return '#2196f3';
            case 'pausado': return '#ff9800';
            case 'cancelado': return '#f44336';
            default: return '#808080';
        }
    };

    const getEstadoIcon = (estado) => {
        switch (estado?.toLowerCase().trim()) {
            case 'completado': return '✅';
            case 'en progreso': return '⚙️';
            case 'planificación': return '📋';
            case 'pausado': return '⏸️';
            case 'cancelado': return '❌';
            default: return '📦';
        }
    };

    const proyectosFiltrados = filtro === 'Todos'
        ? proyectos
        : proyectos.filter(p => p.estado?.toLowerCase().trim() === filtro.toLowerCase().trim());

    const proyectoSeleccionado = proyectos.find(p => p.id === selectedId);

    if (loading) {
        return (
            <div className="proyectos-win95">
                <div className="proyectos-header">📂 PROYECTOS - CODE URV</div>
                <div className="proyectos-loading">⏳ Cargando proyectos...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="proyectos-win95">
                <div className="proyectos-header">📂 PROYECTOS - CODE URV</div>
                <div className="proyectos-error">
                    ❌ Error: {error}
                </div>
            </div>
        );
    }

    return (
        <div className="proyectos-win95">
            <div className="proyectos-header">📂 PROYECTOS - CODE URV</div>

            <div className="proyectos-tabs">
                {['Todos', 'En Progreso', 'Completado', 'Planificación'].map(f => (
                    <button
                        key={f}
                        className={`tab-btn ${filtro === f ? 'active' : ''}`}
                        onClick={() => setFiltro(f)}
                    >
                        {f}
                    </button>
                ))}
            </div>

            <div className="proyectos-layout">
                <div className={`proyectos-sidebar ${!selectedId ? 'full-width' : ''}`}>
                    <div className="proyectos-list-header">
                        📋 Lista de Proyectos ({proyectosFiltrados.length})
                    </div>
                    <div className="proyectos-list">
                        {proyectosFiltrados.map(p => (
                            <div
                                key={p.id}
                                className={`proyecto-item ${selectedId === p.id ? 'selected' : ''}`}
                                onClick={() => setSelectedId(p.id)}
                            >
                                <div className="item-header">
                                    <span className="item-icon" style={{ color: getEstadoColor(p.estado) }}>
                                        {getEstadoIcon(p.estado)}
                                    </span>
                                    <span className="item-name">{p.nombre}</span>
                                </div>
                                <div className="item-lead">👤 {p.responsable}</div>
                                <div className="item-progress-container">
                                    <div
                                        className="item-progress-bar"
                                        style={{
                                            width: `${p.progreso}%`,
                                            backgroundColor: getEstadoColor(p.estado)
                                        }}
                                    ></div>
                                    <span className="item-progress-text">{p.progreso}%</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {proyectoSeleccionado && (
                    <div className="proyectos-details">
                        <div className="details-header">
                            <span className="details-icon" style={{ color: getEstadoColor(proyectoSeleccionado.estado) }}>
                                {getEstadoIcon(proyectoSeleccionado.estado)}
                            </span>
                            <h3>{proyectoSeleccionado.nombre}</h3>
                            <button className="close-details-btn" onClick={() => setSelectedId(null)}>✕</button>
                        </div>

                        <div className="details-content">
                            <div className="detail-section">
                                <div className="section-title">📝 Descripción</div>
                                <div className="section-content">{proyectoSeleccionado.descripcion}</div>
                            </div>

                            <div className="detail-section">
                                <div className="section-title">👤 Responsable</div>
                                <div className="section-content">
                                    <strong>{proyectoSeleccionado.responsable}</strong><br />
                                    📧 {proyectoSeleccionado.email}
                                </div>
                            </div>

                            <div className="detail-section">
                                <div className="section-title">📊 Estado</div>
                                <div className="section-content">
                                    <div className="estado-badge" style={{ backgroundColor: getEstadoColor(proyectoSeleccionado.estado), color: 'white' }}>
                                        {proyectoSeleccionado.estado} ({proyectoSeleccionado.progreso}%)
                                    </div>
                                    <div className="detail-progress-container">
                                        <div
                                            className="detail-progress-bar"
                                            style={{
                                                width: `${proyectoSeleccionado.progreso}%`,
                                                backgroundColor: getEstadoColor(proyectoSeleccionado.estado)
                                            }}
                                        ></div>
                                    </div>
                                </div>
                            </div>

                            {proyectoSeleccionado.tecnologias.length > 0 && (
                                <div className="detail-section">
                                    <div className="section-title">💻 Tecnologías</div>
                                    <div className="section-content">
                                        <div className="tech-badges">
                                            {proyectoSeleccionado.tecnologias.map((tech, i) => (
                                                <span key={i} className="tech-badge">{tech}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {proyectoSeleccionado.colaboradores?.length > 0 && (
                                <div className="detail-section">
                                    <div className="section-title">👥 Colaboradores</div>
                                    <div className="section-content">
                                        <div className="tech-badges">
                                            {proyectoSeleccionado.colaboradores.map((col, i) => (
                                                <span key={i} className="tech-badge">{col}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {proyectoSeleccionado.repositorio && (
                                <div className="detail-section">
                                    <button className="repo-btn" onClick={() => window.open(proyectoSeleccionado.repositorio, '_blank')}>
                                        🔗 Ver Repositorio
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Proyectos;