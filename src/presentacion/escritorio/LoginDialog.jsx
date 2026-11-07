import { useState } from 'react';
import './LoginDialog.css';
import logoURV from '../assets/code_urv_logo_nobg.png';
import { NOMBRE_INVITADO, interpretarInicioSesion } from '../../dominio/sesion';

/** Llave dorada estilo icono de Windows 95. */
function IconoLlave() {
  return (
    <svg className="login-icono" viewBox="0 0 32 32" aria-hidden="true" shapeRendering="crispEdges">
      <circle cx="10" cy="16" r="7" fill="#f7d33a" stroke="#000" strokeWidth="1.5" />
      <circle cx="8" cy="16" r="2.2" fill="#c0c0c0" stroke="#000" strokeWidth="1" />
      <rect x="16" y="14" width="14" height="4" fill="#f7d33a" stroke="#000" strokeWidth="1.5" />
      <rect x="22" y="18" width="3" height="4" fill="#f7d33a" stroke="#000" strokeWidth="1.5" />
      <rect x="27" y="18" width="3" height="6" fill="#f7d33a" stroke="#000" strokeWidth="1.5" />
      <rect x="6" y="12" width="3" height="1.5" fill="#fff8c0" />
    </svg>
  );
}

/**
 * Diálogo "Iniciar sesión" estilo Windows 95.
 * Con "Invitado" (o vacío) y Aceptar se entra como invitado; Cancelar también entra como invitado.
 */
function LoginDialog({ alEntrarComoInvitado, alIniciarSesion }) {
  const [usuario, setUsuario] = useState(NOMBRE_INVITADO);
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const alEnviar = async (e) => {
    e.preventDefault();
    const decision = interpretarInicioSesion(usuario, contrasena);

    if (decision.tipo === 'invitado') return alEntrarComoInvitado();
    if (decision.tipo === 'error') return setError(decision.mensaje);

    setEnviando(true);
    setError(null);
    try {
      await alIniciarSesion(decision.usuario, decision.contrasena);
    } catch (err) {
      setError(err.estado === 401 ? 'Usuario o contraseña incorrectos.' : err.message);
      setContrasena('');
      setEnviando(false);
    }
  };

  return (
    <div className="login-fondo">
      <form className="login-dialogo win95-dialogo" onSubmit={alEnviar} role="dialog" aria-labelledby="login-titulo">
        <div className="win95-dialogo-titulo">
          <span id="login-titulo">Iniciar sesión en CODE URV</span>
          <button type="button" className="login-cerrar" aria-label="Cerrar" onClick={alEntrarComoInvitado}>✕</button>
        </div>

        {/* Franja superior como la del inicio de sesión de Windows 95 */}
        <div className="login-banner">
          <img src={logoURV} alt="" className="login-banner-logo" />
          <div className="login-banner-texto">
            <span className="login-banner-sub">Asociación de Estudiantes de Informática</span>
            <span className="login-banner-marca">
              CODE URV<sup>95</sup>
            </span>
          </div>
        </div>
        <div className="login-franja" aria-hidden="true">
          <span /><span /><span /><span />
        </div>

        <div className="login-cuerpo">
          <IconoLlave />

          <div className="login-campos">
            <p className="login-texto">
              Escriba un nombre de usuario y una contraseña para iniciar sesión en CODE URV.
            </p>

            <label className="login-fila">
              <span className="login-etiqueta"><u>U</u>suario:</span>
              <input
                className="win95-input"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                onFocus={(e) => e.target.select()}
                autoComplete="username"
                accessKey="u"
              />
            </label>

            <label className="login-fila">
              <span className="login-etiqueta"><u>C</u>ontraseña:</span>
              <input
                className="win95-input"
                type="password"
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                autoComplete="current-password"
                accessKey="c"
              />
            </label>

            <p className="login-pista">Para entrar como invitado, pulse Aceptar.</p>
            {error && <p className="login-error" role="alert">{error}</p>}
          </div>

          <div className="login-botones">
            <button type="submit" className="win95-boton" disabled={enviando} autoFocus>
              {enviando ? '...' : 'Aceptar'}
            </button>
            <button type="button" className="win95-boton" disabled={enviando} onClick={alEntrarComoInvitado}>
              Cancelar
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default LoginDialog;
