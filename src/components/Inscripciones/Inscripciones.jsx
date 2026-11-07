import React, { useMemo, useState } from 'react';
import './Inscripciones.css';
import logoURV from '../../assets/code_urv_logo_nobg.png';

function Inscripciones() {
    const [status, setStatus] = useState('idle'); // idle | sending | sent | error

    const [form, setForm] = useState({
        socioAnterior: 'NO vaig ser soci i VULL la samarreta (8€)',
        grado: 'Grau en Enginyeria Informàtica',
        curso: '1er',
        talla: '',
        nombre: '',
        correo: '',
        telefono: '',
    });

    const cuotaTexto = useMemo(() => {
        if (form.socioAnterior.startsWith('Vaig ser soci')) return '5€';
        return '8€';
    }, [form.socioAnterior]);

    const cuotaDescripcion = useMemo(() => {
        if (form.socioAnterior.startsWith('Vaig ser soci')) return 'Socios de cursos anteriores (ya tienen camiseta)';
        return 'Nuevos socios (incluye camiseta)';
    }, [form.socioAnterior]);

    const needsTalla = useMemo(() => {
        return form.socioAnterior.startsWith('NO vaig ser soci');
    }, [form.socioAnterior]);

    const onChange = (key) => (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const validate = () => {
        if (!form.nombre.trim()) return 'El nombre y apellidos es obligatorio.';
        if (!form.grado.trim()) return 'Indica el grado que estudias.';
        if (!form.curso.trim()) return 'Indica tu curso actual.';
        if (!form.correo.trim()) return 'El correo electrónico es obligatorio.';
        if (!form.telefono.trim()) return 'El número de teléfono es obligatorio.';
        if (needsTalla && !form.talla) return 'Selecciona una talla de camiseta.';
        return null;
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        const err = validate();
        if (err) {
            setStatus('error');
            alert(err);
            return;
        }

        setStatus('sending');

        try {
            const r = await fetch('/api/send-inscripcion', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    socioAnterior: form.socioAnterior,
                    grado: form.grado,
                    curso: form.curso,
                    talla: needsTalla ? form.talla : '',
                    nombre: form.nombre,
                    correo: form.correo,
                    telefono: form.telefono,
                }),
            });

            if (!r.ok) {
                const body = await r.json().catch(() => null);
                throw new Error(body?.error || `Error ${r.status}`);
            }

            setStatus('sent');

        } catch (error) {
            console.error('Error enviando inscripción:', error);
            setStatus('error');
            alert('Error de conexión: ' + (error.message || error));
        }
    };

    const reset = () => {
        setForm({
            socioAnterior: 'NO vaig ser soci i VULL la samarreta (8€)',
            grado: 'Grau en Enginyeria Informàtica',
            curso: '1er',
            talla: '',
            nombre: '',
            correo: '',
            telefono: '',
        });
        setStatus('idle');
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
                    <div className="insc-cuota-amount">{cuotaTexto}</div>
                    <div className="insc-cuota-desc">{cuotaDescripcion}</div>
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
            {status === 'sent' ? (
                <div className="insc-success-panel">
                    <div className="insc-success-icon">✅</div>
                    <h2>¡Solicitud Enviada Correctamente!</h2>
                    <p>
                        Hemos recibido tu inscripción. Te enviaremos información y comunicaciones a tu correo universitario.
                    </p>
                    <button className="win95-btn primary" onClick={reset}>
                        Enviar otra inscripción
                    </button>
                </div>
            ) : (
                <div className="insc-form-panel">
                    <form className="insc-form" onSubmit={onSubmit}>

                        {/* PREGUNTA: Nombre */}
                        <div className="insc-field">
                            <label className="insc-label">
                                <span className="insc-label-text">Indica tu nombre y apellidos:</span>
                                <span className="insc-required">*</span>
                            </label>
                            <input
                                className="insc-input"
                                type="text"
                                value={form.nombre}
                                onChange={onChange('nombre')}
                                placeholder="Ej: Juan García López"
                            />
                        </div>

                        {/* PREGUNTA: Grado */}
                        <div className="insc-field">
                            <label className="insc-label">
                                <span className="insc-label-text">¿Qué grado estudias?</span>
                                <span className="insc-required">*</span>
                            </label>
                            <input
                                className="insc-input"
                                type="text"
                                value={form.grado}
                                onChange={onChange('grado')}
                                placeholder="Ej: Grau en Enginyeria Informàtica"
                            />
                        </div>

                        {/* PREGUNTA: Curso */}
                        <div className="insc-field">
                            <label className="insc-label">
                                <span className="insc-label-text">Indica tu curso:</span>
                                <span className="insc-required">*</span>
                            </label>
                            <select
                                className="insc-select"
                                value={form.curso}
                                onChange={onChange('curso')}
                            >
                                <option value="1er">1er</option>
                                <option value="2n">2n</option>
                                <option value="3r">3r</option>
                                <option value="4t">4t</option>
                                <option value="Màster">Máster / Otros</option>
                            </select>
                        </div>

                        {/* PREGUNTA: Socio anterior */}
                        <div className="insc-field">
                            <label className="insc-label">
                                <span className="insc-label-text">¿Fuiste socio el año pasado (y ya tienes la camiseta)?</span>
                                <span className="insc-required">*</span>
                            </label>
                            <div className="insc-radio-group">
                                <label className="insc-radio-label">
                                    <input
                                        type="radio"
                                        value="NO vaig ser soci i VULL la samarreta (8€)"
                                        checked={form.socioAnterior.startsWith('NO vaig ser soci')}
                                        onChange={(e) => setForm((p) => ({ ...p, socioAnterior: e.target.value }))}
                                    />
                                    <span>No, no fui socio y quiero la camiseta (8€)</span>
                                </label>
                                <label className="insc-radio-label">
                                    <input
                                        type="radio"
                                        value="Vaig ser soci i ja tinc la samarreta (5€)"
                                        checked={form.socioAnterior.startsWith('Vaig ser soci')}
                                        onChange={(e) => setForm((p) => ({ ...p, socioAnterior: e.target.value, talla: '' }))}
                                    />
                                    <span>Sí, fui socio y ya tengo la camiseta (5€)</span>
                                </label>
                            </div>
                        </div>

                        {/* PREGUNTA: Talla */}
                        <div className={`insc-field ${!needsTalla ? 'insc-field-disabled' : ''}`}>
                            <label className="insc-label">
                                <span className="insc-label-text">Talla de camiseta (si no la tienes)</span>
                                {needsTalla && <span className="insc-required">*</span>}
                            </label>
                            <select
                                className="insc-select"
                                value={form.talla}
                                onChange={onChange('talla')}
                                disabled={!needsTalla}
                            >
                                <option value="">Selecciona una talla...</option>
                                <option value="S">S</option>
                                <option value="M">M</option>
                                <option value="L">L</option>
                                <option value="XL">XL</option>
                            </select>
                        </div>

                        {/* PREGUNTA: Teléfono */}
                        <div className="insc-field">
                            <label className="insc-label">
                                <span className="insc-label-text">Número de teléfono (para WhatsApp de socios):</span>
                                <span className="insc-required">*</span>
                            </label>
                            <input
                                className="insc-input"
                                type="tel"
                                value={form.telefono}
                                onChange={onChange('telefono')}
                                placeholder="600 000 000"
                            />
                        </div>

                        {/* PREGUNTA: Correo */}
                        <div className="insc-field">
                            <label className="insc-label">
                                <span className="insc-label-text">Correo electrónico (URV o personal):</span>
                                <span className="insc-required">*</span>
                            </label>
                            <input
                                className="insc-input"
                                type="email"
                                value={form.correo}
                                onChange={onChange('correo')}
                                placeholder="nom.cognom@estudiants.urv.cat"
                            />
                        </div>

                        {/* BOTONES */}
                        <div className="insc-actions">
                            <button className="win95-btn primary" type="submit" disabled={status === 'sending'}>
                                {status === 'sending' ? '⏳ Enviando...' : '✉️ Enviar Inscripción'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}

export default Inscripciones;