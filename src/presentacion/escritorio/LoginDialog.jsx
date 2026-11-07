import { useState } from 'react';
import './LoginDialog.css';
import logoURV from '../assets/code_urv_logo_nobg.png';
import { NOMBRE_INVITADO, interpretarInicioSesion } from '../../dominio/sesion';

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

        <div className="login-cuerpo">
          <img src={logoURV} alt="" className="login-icono" />

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
