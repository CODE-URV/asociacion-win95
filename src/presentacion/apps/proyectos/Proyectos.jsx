import { useState } from 'react';
import './Proyectos.css';
import { FILTROS, colorDeEstado, filtrar, iconoDeEstado } from '../../../dominio/proyecto';
import useProyectos from '../../../aplicacion/useProyectos';

function Cabecera() {
    return <div className="proyectos-header">📂 PROYECTOS - CODE URV</div>;
}

function Proyectos() {
    const { proyectos, cargando, error } = useProyectos();
    const [selectedId, setSelectedId] = useState(null);
    const [filtro, setFiltro] = useState('Todos');

    if (cargando) {
        return (
            <div className="proyectos-win95">
                <Cabecera />
                <div className="proyectos-loading">⏳ Cargando proyectos...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="proyectos-win95">
                <Cabecera />
                <div className="proyectos-error">❌ No se han podido cargar los proyectos: {error}</div>
            </div>
        );
    }

    const proyectosFiltrados = filtrar(proyectos, filtro);
    const seleccionado = proyectos.find((p) => p.id === selectedId);

    return (
        <div className="proyectos-win95">
            <Cabecera />

            <div className="proyectos-tabs">
                {FILTROS.map((f) => (
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
                <div className={`proyectos-sidebar ${!seleccionado ? 'full-width' : ''}`}>
                    <div className="proyectos-list-header">
                        📋 Lista de Proyectos ({proyectosFiltrados.length})
                    </div>
                    <div className="proyectos-list">
                        {proyectosFiltrados.length === 0 && (
                            <div className="proyectos-loading">📭 Todavía no hay proyectos en esta categoría.</div>
                        )}
                        {proyectosFiltrados.map((p) => (
                            <div
                                key={p.id}
                                className={`proyecto-item ${selectedId === p.id ? 'selected' : ''}`}
                                onClick={() => setSelectedId(p.id)}
                            >
                                <div className="item-header">
                                    <span className="item-icon" style={{ color: colorDeEstado(p.estado) }}>
                                        {iconoDeEstado(p.estado)}
                                    </span>
                                    <span className="item-name">{p.nombre}</span>
                                </div>
                                {p.responsable && <div className="item-lead">👤 {p.responsable}</div>}
                                <div className="item-progress-container">
                                    <div
                                        className="item-progress-bar"
                                        style={{ width: `${p.progreso}%`, backgroundColor: colorDeEstado(p.estado) }}
                                    />
                                    <span className="item-progress-text">{p.progreso}%</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {seleccionado && (
                    <div className="proyectos-details">
                        <div className="details-header">
                            <span className="details-icon" style={{ color: colorDeEstado(seleccionado.estado) }}>
                                {iconoDeEstado(seleccionado.estado)}
                            </span>
                            <h3>{seleccionado.nombre}</h3>
                            <button className="close-details-btn" onClick={() => setSelectedId(null)}>✕</button>
                        </div>

                        <div className="details-content">
                            {seleccionado.descripcion && (
                                <div className="detail-section">
                                    <div className="section-title">📝 Descripción</div>
                                    <div className="section-content">{seleccionado.descripcion}</div>
                                </div>
                            )}

                            {(seleccionado.responsable || seleccionado.email) && (
                                <div className="detail-section">
                                    <div className="section-title">👤 Responsable</div>
                                    <div className="section-content">
                                        <strong>{seleccionado.responsable}</strong><br />
                                        {seleccionado.email && <>📧 {seleccionado.email}</>}
                                    </div>
                                </div>
                            )}

                            <div className="detail-section">
                                <div className="section-title">📊 Estado</div>
                                <div className="section-content">
                                    <div className="estado-badge" style={{ backgroundColor: colorDeEstado(seleccionado.estado), color: 'white' }}>
                                        {seleccionado.estado} ({seleccionado.progreso}%)
                                    </div>
                                    <div className="detail-progress-container">
                                        <div
                                            className="detail-progress-bar"
                                            style={{ width: `${seleccionado.progreso}%`, backgroundColor: colorDeEstado(seleccionado.estado) }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {seleccionado.tecnologias.length > 0 && (
                                <div className="detail-section">
                                    <div className="section-title">💻 Tecnologías</div>
                                    <div className="section-content">
                                        <div className="tech-badges">
                                            {seleccionado.tecnologias.map((tech) => (
                                                <span key={tech} className="tech-badge">{tech}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {seleccionado.colaboradores.length > 0 && (
                                <div className="detail-section">
                                    <div className="section-title">👥 Colaboradores</div>
                                    <div className="section-content">
                                        <div className="tech-badges">
                                            {seleccionado.colaboradores.map((col) => (
                                                <span key={col} className="tech-badge">{col}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {seleccionado.repositorio && (
                                <div className="detail-section">
                                    <a className="repo-btn" href={seleccionado.repositorio} target="_blank" rel="noopener noreferrer">
                                        🔗 Ver Repositorio
                                    </a>
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
