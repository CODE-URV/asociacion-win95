import { useEffect, useState } from 'react';
import Desktop from './Desktop';
import WindowManager from './WindowManager';
import Taskbar from './Taskbar';
import LoginDialog from './LoginDialog';
import { useSesion } from '../../aplicacion/sesionContexto';
import useGestorVentanas from '../../aplicacion/useGestorVentanas';
import useAppsActivadas from '../../aplicacion/useAppsActivadas';
import { puedeUsarApp } from '../../dominio/sesion';
import { leerUrlAsistencia } from '../../dominio/actividad';
import { APPS, appPorId, appsSoloAdmin } from '../apps/registro';

/** El "sistema operativo": inicio de sesión, escritorio, ventanas y barra de tareas. */
function Shell() {
  const { cargando, sesion, mostrarLogin, entrarComoInvitado, iniciarSesion, cerrarSesion } = useSesion();

  // Al escanear el QR de una actividad se llega con ?asistencia=ID&codigo=XXX:
  // se abre directamente la ventana para registrar la asistencia.
  const [qr] = useState(() => leerUrlAsistencia(window.location.search));
  const { ventanas, ...acciones } = useGestorVentanas(qr ? { app: appPorId('asistencia'), parametros: qr } : null);
  const activadas = useAppsActivadas(sesion);

  useEffect(() => {
    // Quitar los parámetros para que al recargar no se repita
    if (qr) window.history.replaceState(null, '', window.location.pathname);
  }, [qr]);

  if (cargando) return <div className="login-fondo" />;

  if (mostrarLogin || !sesion) {
    return <LoginDialog alEntrarComoInvitado={entrarComoInvitado} alIniciarSesion={iniciarSesion} />;
  }

  const apps = APPS.filter((app) => puedeUsarApp(sesion, app, activadas));

  const alCerrarSesion = async () => {
    // Al salir se cierran las ventanas que el invitado no puede ver
    acciones.cerrarApps([...appsSoloAdmin, ...APPS.filter((a) => !puedeUsarApp(null, a, activadas)).map((a) => a.id)]);
    await cerrarSesion();
  };

  // Orden de capas: escritorio < ventanas < barra de tareas y menú Inicio
  return (
    <div className="app-container">
      <Desktop apps={apps} acciones={acciones} />
      <WindowManager ventanas={ventanas} acciones={acciones} />
      <Taskbar apps={apps} ventanas={ventanas} acciones={acciones} sesion={sesion} alCerrarSesion={alCerrarSesion} />
    </div>
  );
}

export default Shell;
