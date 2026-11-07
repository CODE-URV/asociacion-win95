import './Inscripciones.css';
import logoURV from '../../assets/code_urv_logo_nobg.png';
import { CURSOS, OPCION_SOCIO_ANTERIOR, OPCION_SOCIO_NUEVO, TALLAS } from '../../../dominio/inscripcion';
import useInscripcion from '../../../aplicacion/useInscripcion';

function Inscripciones() {
    const { formulario, estado, cuota, necesitaTalla, cambiar, elegirSocioAnterior, enviar, reiniciar } = useInscripcion();

    const alCambiar = (campo) => (e) => cambiar(campo, e.target.value);

    const alEnviar = async (e) => {
        e.preventDefault();
        const resultado = await enviar();
        if (!resultado.ok) alert(resultado.error);
    };

    return (
        <div className="insc-root">
            {/* CABECERA CON LOGO */}
            <div className="insc-header">
                <img src={logoURV} alt="CODE URV" className="insc-logo" />
                <div className="insc-header-text">
                    <h1>Hazte SOCIO de CODE URV</h1>
                    <p>Únete a la comunidad de estudiantes de informática de la URV</p>
                </div>
            </div>

            {/* CUOTA */}
            <div className="insc-cuota-section">
                <div className="insc-cuota-box">
                    <div className="insc-cuota-title">Cuota Anual</div>
                    <div className="insc-cuota-amount">{cuota.importe}</div>
                    <div className="insc-cuota-desc">{cuota.descripcion}</div>
                </div>
                <div className="insc-payment-info">
                    <div className="insc-payment-row">
                        <span className="insc-payment-label">💳 Bizum:</span>
                        <span className="insc-payment-value">12734</span>
                    </div>
                    <div className="insc-payment-row">
                        <span className="insc-payment-label">🏦 Transferencia:</span>
                        <span className="insc-payment-value">ES13 3025 0023 3114 0009 1013</span>
                    </div>
                </div>
            </div>

            {/* SEPARADOR */}
            <div className="insc-separator">
                <span>Formulario de Inscripción</span>
            </div>

            {/* FORMULARIO O MENSAJE DE ÉXITO */}
            {estado === 'sent' ? (
                <div className="insc-success-panel">
                    <div className="insc-success-icon">✅</div>
                    <h2>¡Solicitud Enviada Correctamente!</h2>
                    <p>
                        Hemos recibido tu inscripción. Te enviaremos información y comunicaciones a tu correo universitario.
                    </p>
                    <button className="win95-btn primary" onClick={reiniciar}>
                        Enviar otra inscripción
                    </button>
                </div>
            ) : (
                <div className="insc-form-panel">
                    <form className="insc-form" onSubmit={alEnviar}>

                        <div className="insc-field">
                            <label className="insc-label">
                                <span className="insc-label-text">Indica tu nombre y apellidos:</span>
                                <span className="insc-required">*</span>
                            </label>
                            <input
                                className="insc-input"
                                type="text"
                                value={formulario.nombre}
                                onChange={alCambiar('nombre')}
                                placeholder="Ej: Juan García López"
                            />
                        </div>

                        <div className="insc-field">
                            <label className="insc-label">
                                <span className="insc-label-text">¿Qué grado estudias?</span>
                                <span className="insc-required">*</span>
                            </label>
                            <input
                                className="insc-input"
                                type="text"
                                value={formulario.grado}
                                onChange={alCambiar('grado')}
                                placeholder="Ej: Grau en Enginyeria Informàtica"
                            />
                        </div>

                        <div className="insc-field">
                            <label className="insc-label">
                                <span className="insc-label-text">Indica tu curso:</span>
                                <span className="insc-required">*</span>
                            </label>
                            <select className="insc-select" value={formulario.curso} onChange={alCambiar('curso')}>
                                {CURSOS.map((c) => (
                                    <option key={c.valor} value={c.valor}>{c.texto}</option>
                                ))}
                            </select>
                        </div>

                        <div className="insc-field">
                            <label className="insc-label">
                                <span className="insc-label-text">¿Fuiste socio el año pasado (y ya tienes la camiseta)?</span>
                                <span className="insc-required">*</span>
                            </label>
                            <div className="insc-radio-group">
                                <label className="insc-radio-label">
                                    <input
                                        type="radio"
                                        checked={formulario.socioAnterior === OPCION_SOCIO_NUEVO}
                                        onChange={() => elegirSocioAnterior(OPCION_SOCIO_NUEVO)}
                                    />
                                    <span>No, no fui socio y quiero la camiseta (8€)</span>
                                </label>
                                <label className="insc-radio-label">
                                    <input
                                        type="radio"
                                        checked={formulario.socioAnterior === OPCION_SOCIO_ANTERIOR}
                                        onChange={() => elegirSocioAnterior(OPCION_SOCIO_ANTERIOR)}
                                    />
                                    <span>Sí, fui socio y ya tengo la camiseta (5€)</span>
                                </label>
                            </div>
                        </div>

                        <div className={`insc-field ${!necesitaTalla ? 'insc-field-disabled' : ''}`}>
                            <label className="insc-label">
                                <span className="insc-label-text">Talla de camiseta (si no la tienes)</span>
                                {necesitaTalla && <span className="insc-required">*</span>}
                            </label>
                            <select
                                className="insc-select"
                                value={formulario.talla}
                                onChange={alCambiar('talla')}
                                disabled={!necesitaTalla}
                            >
                                <option value="">Selecciona una talla...</option>
                                {TALLAS.map((t) => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select>
                        </div>

                        <div className="insc-field">
                            <label className="insc-label">
                                <span className="insc-label-text">Número de teléfono (para WhatsApp de socios):</span>
                                <span className="insc-required">*</span>
                            </label>
                            <input
                                className="insc-input"
                                type="tel"
                                value={formulario.telefono}
                                onChange={alCambiar('telefono')}
                                placeholder="600 000 000"
                            />
                        </div>

                        <div className="insc-field">
                            <label className="insc-label">
                                <span className="insc-label-text">Correo electrónico (URV o personal):</span>
                                <span className="insc-required">*</span>
                            </label>
                            <input
                                className="insc-input"
                                type="email"
                                value={formulario.correo}
                                onChange={alCambiar('correo')}
                                placeholder="nom.cognom@estudiants.urv.cat"
                            />
                        </div>

                        <div className="insc-actions">
                            <button className="win95-btn primary" type="submit" disabled={estado === 'sending'}>
                                {estado === 'sending' ? '⏳ Enviando...' : '✉️ Enviar Inscripción'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}

export default Inscripciones;
