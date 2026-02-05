import React, { useMemo, useState } from 'react';
import './Inscripciones.css';
import logoURV from '../../assets/code_urv_logo_nobg.png';

// Nota:
// - Ya no hay URL directa del Apps Script aquí.
// - La función serverless en https://asociacion-win95.vercel.app/api/send-inscripcion (en Vercel) se encargará
//   de reenviar al Apps Script usando la variable de entorno WEB_APP_URL
// - Si defines VITE_PROXY_SECRET en tu .env local, se enviará como header
//   'x-proxy-secret' (NO recomendable en producción porque lo expondrías al cliente).

const CLIENT_PROXY_SECRET = import.meta.env.VITE_PROXY_SECRET || '';

function Inscripciones() {
    const [status, setStatus] = useState('idle'); // idle | sending | sent | error

    const [form, setForm] = useState({
        socioAnterior: 'NO vaig ser soci i NO tinc la samarreta (10€)',
        talla: '',
        nombre: '',
        correo: '',
        telefono: '',
        consentimiento: false,
    });

    const cuotaTexto = useMemo(() => {
        if (form.socioAnterior.startsWith('Vaig ser soci')) return '7€';
        return '10€';
    }, [form.socioAnterior]);

    const cuotaDescripcion = useMemo(() => {
        if (form.socioAnterior.startsWith('Vaig ser soci')) return 'Socios de cursos anteriores';
        return 'Nuevos socios';
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
        if (!form.correo.trim()) return 'El correo es obligatorio.';
        if (!form.telefono.trim()) return 'El teléfono es obligatorio.';
        if (needsTalla && !form.talla) return 'Selecciona una talla de camiseta.';
        if (!form.consentimiento) return 'Debes aceptar el uso de tus datos para continuar.';
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
            const headers = { 'Content-Type': 'application/json' };
            // Opcional: si realmente necesitas enviar un proxy secret desde el cliente
            // (no recomendado), define VITE_PROXY_SECRET en .env.local.
            if (CLIENT_PROXY_SECRET) {
                headers['x-proxy-secret'] = CLIENT_PROXY_SECRET;
            }

            const r = await fetch('https://asociacion-win95.vercel.app/api/send-inscripcion', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    socioAnterior: form.socioAnterior,
                    talla: needsTalla ? form.talla : '',
                    nombre: form.nombre,
                    correo: form.correo,
                    telefono: form.telefono,
                }),
            });

            if (!r.ok) {
                // intentar parsear JSON de error
                const body = await r.json().catch(() => null);
                throw new Error(body?.error || `Error ${r.status}`);
            }

            // Si la petición fue exitosa
            setStatus('sent');

        } catch (error) {
            console.error('Error enviando inscripción:', error);
            setStatus('error');
            alert('Error de conexión: ' + (error.message || error));
        }
    };

    const reset = () => {
        setForm({
            socioAnterior: 'NO vaig ser soci i NO tinc la samarreta (10€)',
            talla: '',
            nombre: '',
            correo: '',
            telefono: '',
            consentimiento: false,
        });
        setStatus('idle');
    };

    return (
        <div className="insc-root">
            {/* HEADER CON LOGO */}
            <div className="insc-header">
                <img src={logoURV} alt="CODE URV" className="insc-logo" />
                <div className="insc-header-text">
                    <h1>Hazte SOCIO de CODE URV</h1>
                    <p>Únete a la comunidad de estudiantes de informática de la URV</p>
                </div>
            </div>

            {/* VENTAJAS */}
            <div className="insc-benefits">
                <h2>🎉 Ventajas de ser SOCIO</h2>
                <div className="insc-benefits-grid">
                    <div className="insc-benefit-card">
                        <div className="insc-benefit-icon">👕</div>
                        <div className="insc-benefit-title">Camiseta Oficial</div>
                        <div className="insc-benefit-desc">Recibe la camiseta oficial de CODE URV</div>
                    </div>
                    <div className="insc-benefit-card">
                        <div className="insc-benefit-icon">📜</div>
                        <div className="insc-benefit-title">Certificados</div>
                        <div className="insc-benefit-desc">Certificados de asistencia a actividades</div>
                    </div>
                    <div className="insc-benefit-card">
                        <div className="insc-benefit-icon">🚌</div>
                        <div className="insc-benefit-title">Excursiones</div>
                        <div className="insc-benefit-desc">Acceso a excursiones exclusivas</div>
                    </div>
                    <div className="insc-benefit-card">
                        <div className="insc-benefit-icon">🎁</div>
                        <div className="insc-benefit-title">Más Ventajas</div>
                        <div className="insc-benefit-desc">Descuentos y actividades especiales</div>
                    </div>
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

            {/* NOTA IMPORTANTE */}
            <div className="insc-note-box">
                <div className="insc-note-icon">ℹ️</div>
                <div className="insc-note-text">
                    <strong>Importante:</strong> No es necesario ser socio para participar en hackathons, asistir a charlas
                    o participar en otros eventos. Ser socio demuestra tu compromiso y voluntad de colaborar con las
                    actividades que CODE URV organiza.
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
                        Hemos recibido tu inscripción. Si has proporcionado un correo válido, recibirás toda la información
                        y comunicaciones de CODE URV en esa dirección.
                    </p>
                    <p className="insc-success-next">
                        <strong>Próximos pasos:</strong> Realiza el pago de la cuota y te añadiremos al grupo de WhatsApp de socios.
                    </p>
                    <button className="win95-btn primary" onClick={reset}>
                        Enviar otra inscripción
                    </button>
                </div>
            ) : (
                <div className="insc-form-panel">
                    <form className="insc-form" onSubmit={onSubmit}>

                        {/* PREGUNTA 1: Socio anterior */}
                        <div className="insc-field">
                            <label className="insc-label">
                                <span className="insc-label-text">¿Fuiste socio el año pasado?</span>
                                <span className="insc-required">*</span>
                            </label>
                            <div className="insc-radio-group">
                                <label className="insc-radio-label">
                                    <input
                                        type="radio"
                                        value="NO vaig ser soci i NO tinc la samarreta (10€)"
                                        checked={form.socioAnterior.startsWith('NO vaig ser soci')}
                                        onChange={(e) => setForm((p) => ({ ...p, socioAnterior: e.target.value }))}
                                    />
                                    <span>No, no fui socio y NO tengo la camiseta (10€)</span>
                                </label>
                                <label className="insc-radio-label">
                                    <input
                                        type="radio"
                                        value="Vaig ser soci i ja tinc la samarreta (7€)"
                                        checked={form.socioAnterior.startsWith('Vaig ser soci')}
                                        onChange={(e) => setForm((p) => ({ ...p, socioAnterior: e.target.value, talla: '' }))}
                                    />
                                    <span>Sí, fui socio y ya tengo la camiseta (7€)</span>
                                </label>
                            </div>
                        </div>

                        {/* PREGUNTA 2: Talla */}
                        <div className={`insc-field ${!needsTalla ? 'insc-field-disabled' : ''}`}>
                            <label className="insc-label">
                                <span className="insc-label-text">Talla de camiseta</span>
                                {needsTalla && <span className="insc-required">*</span>}
                            </label>
                            <select
                                className="insc-select"
                                value={form.talla}
                                onChange={onChange('talla')}
                                disabled={!needsTalla}
                            >
                                <option value="">Selecciona una talla...</option>
                                <option value="S">S - Pequeña</option>
                                <option value="M">M - Mediana</option>
                                <option value="L">L - Grande</option>
                                <option value="XL">XL - Extra Grande</option>
                            </select>
                            {!needsTalla && (
                                <div className="insc-field-hint">No necesitas seleccionar talla si ya tienes la camiseta</div>
                            )}
                        </div>

                        {/* PREGUNTA 3: Nombre */}
                        <div className="insc-field">
                            <label className="insc-label">
                                <span className="insc-label-text">Nombre y apellidos</span>
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

                        {/* PREGUNTA 4: Correo */}
                        <div className="insc-field">
                            <label className="insc-label">
                                <span className="insc-label-text">Correo electrónico</span>
                                <span className="insc-required">*</span>
                            </label>
                            <input
                                className="insc-input"
                                type="email"
                                value={form.correo}
                                onChange={onChange('correo')}
                                placeholder="nombre.apellido@estudiants.urv.cat"
                            />
                            <div className="insc-field-hint">
                                Usa tu correo de la URV o el correo donde quieras recibir información y certificados
                            </div>
                        </div>

                        {/* PREGUNTA 5: Teléfono */}
                        <div className="insc-field">
                            <label className="insc-label">
                                <span className="insc-label-text">Número de teléfono</span>
                                <span className="insc-required">*</span>
                            </label>
                            <input
                                className="insc-input"
                                type="tel"
                                value={form.telefono}
                                onChange={onChange('telefono')}
                                placeholder="+34 600 000 000"
                            />
                            <div className="insc-field-hint">
                                Te añadiremos al grupo de WhatsApp de socios de CODE URV
                            </div>
                        </div>

                        {/* CONSENTIMIENTO */}
                        <div className="insc-field">
                            <label className="insc-checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={form.consentimiento}
                                    onChange={onChange('consentimiento')}
                                />
                                <span>
                                    Acepto que CODE URV use mis datos para gestionar mi inscripción y enviarme comunicaciones
                                    relacionadas con la asociación
                                </span>
                            </label>
                        </div>

                        {/* BOTONES */}
                        <div className="insc-actions">
                            <button className="win95-btn primary" type="submit" disabled={status === 'sending'}>
                                {status === 'sending' ? '⏳ Enviando...' : '✉️ Enviar Inscripción'}
                            </button>
                            <button
                                className="win95-btn secondary"
                                type="button"
                                onClick={reset}
                                disabled={status === 'sending'}
                            >
                                🔄 Limpiar Formulario
                            </button>
                        </div>

                        <div className="insc-footer-note">
                            Al enviar este formulario, tus datos se registrarán en Google Sheets y recibirás un correo de confirmación.
                        </div>
                    </form>
                </div>
            )}

            {/* FOOTER */}
            <div className="insc-footer">
                <p>¿Tienes dudas? Contáctanos en nuestras redes sociales o escríbenos un correo.</p>
                <p className="insc-footer-thanks">¡Gracias por tu interés y tu contribución! 💙</p>
            </div>
        </div>
    );
}

export default Inscripciones;