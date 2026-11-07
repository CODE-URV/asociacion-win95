import { useState } from 'react';
import './Actividades.css';
import useAsistencia from '../../../aplicacion/useAsistencia';
import { personaVacia, validarPersona } from '../../../dominio/actividad';
import CamposPersona from './CamposPersona';

/** Ventana que se abre al escanear el QR de la sala. */
export default function Asistencia({ actividadId, codigo, cerrarVentana }) {
  const asistencia = useAsistencia(actividadId, codigo);
  const [persona, setPersona] = useState(personaVacia);
  const [errores, setErrores] = useState({});

  const cambiar = (campo, valor) => setPersona((p) => ({ ...p, [campo]: valor }));

  const alEnviarCorreo = (e) => {
    e.preventDefault();
    const { email } = validarPersona(persona);
    setErrores(email ? { email } : {});
    if (!email) asistencia.enviarCorreo(persona.email);
  };

  const alEnviarDatos = (e) => {
    e.preventDefault();
    const locales = validarPersona(persona);
    setErrores(locales);
    if (Object.keys(locales).length === 0) asistencia.enviarDatos(persona);
  };

  const erroresVisibles = { ...errores, ...(asistencia.detalles ?? {}) };

  return (
    <div className="act act-asistencia">
      <div className="act-cabecera">✅ REGISTRAR ASISTENCIA</div>

      <div className="act-asistencia-cuerpo">
        {asistencia.paso === 'validando' && <div className="act-mensaje">⏳ Comprobando el código QR...</div>}

        {asistencia.paso === 'error' && (
          <div className="act-resultado">
            <div className="act-exito-icono">⚠️</div>
            <p>{asistencia.error}</p>
            <button className="win95-boton" onClick={cerrarVentana}>Cerrar</button>
          </div>
        )}

        {asistencia.paso === 'correo' && (
          <form className="act-formulario" onSubmit={alEnviarCorreo} noValidate>
            <p>Escribe el correo con el que te apuntaste. Te enviaremos ahí el certificado de asistencia.</p>
            <CamposCorreo persona={persona} cambiar={cambiar} error={erroresVisibles.email} />
            {asistencia.error && <div className="act-error-general">❌ {asistencia.error}</div>}
            <div className="act-botones">
              <button type="submit" className="win95-boton act-boton-principal" disabled={asistencia.enviando}>
                {asistencia.enviando ? 'Registrando...' : 'Registrar mi asistencia'}
              </button>
            </div>
          </form>
        )}

        {asistencia.paso === 'datos' && (
          <form className="act-formulario" onSubmit={alEnviarDatos} noValidate>
            <p>
              No encontramos ninguna inscripción con <strong>{persona.email.trim()}</strong>. Si no te
              apuntaste, rellena tus datos y quedarás registrado ahora.
            </p>
            <CamposPersona persona={persona} cambiar={cambiar} errores={erroresVisibles} />
            {asistencia.error && <div className="act-error-general">❌ {asistencia.error}</div>}
            <div className="act-botones">
              <button type="submit" className="win95-boton act-boton-principal" disabled={asistencia.enviando}>
                {asistencia.enviando ? 'Registrando...' : 'Registrar mi asistencia'}
              </button>
            </div>
          </form>
        )}

        {asistencia.paso === 'hecho' && (
          <div className="act-resultado">
            <div className="act-exito-icono">🎉</div>
            <h3>
              {asistencia.resultado.yaRegistrada
                ? `Ya tenías la asistencia registrada, ${asistencia.resultado.nombre}.`
                : `¡Asistencia registrada, ${asistencia.resultado.nombre}!`}
            </h3>
            <p>Cuando termine la actividad te enviaremos el certificado por correo.</p>
            <button className="win95-boton" onClick={cerrarVentana}>Cerrar</button>
          </div>
        )}
      </div>
    </div>
  );
}

function CamposCorreo({ persona, cambiar, error }) {
  return (
    <label className="act-campo">
      <span className="act-etiqueta">Correo electrónico</span>
      <input
        className="act-input"
        type="email"
        autoComplete="email"
        autoFocus
        value={persona.email}
        onChange={(e) => cambiar('email', e.target.value)}
        placeholder="nom.cognom@estudiants.urv.cat"
      />
      {error && <span className="act-error">{error}</span>}
    </label>
  );
}
