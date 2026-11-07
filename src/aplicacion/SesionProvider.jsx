import { useCallback, useEffect, useMemo, useState } from 'react';
import { SesionContexto } from './sesionContexto';
import { SESION_INVITADO, crearSesionAdmin } from '../dominio/sesion';
import * as sesionApi from '../infraestructura/sesionApi';

export default function SesionProvider({ children }) {
  const [cargando, setCargando] = useState(true);
  const [sesion, setSesion] = useState(null);
  const [mostrarLogin, setMostrarLogin] = useState(false);

  // Al arrancar: si hay sesión de admin en el servidor se entra directamente;
  // si no, se pide inicio de sesión solo la primera vez en este navegador.
  useEffect(() => {
    let cancelado = false;
    sesionApi
      .obtenerSesion()
      .catch(() => ({ usuario: null })) // sin API (p. ej. caída) la web sigue funcionando como invitado
      .then(({ usuario }) => {
        if (cancelado) return;
        if (usuario) {
          setSesion(crearSesionAdmin(usuario.nombre));
        } else if (sesionApi.loginYaVisto()) {
          setSesion(SESION_INVITADO);
        } else {
          setMostrarLogin(true);
        }
        setCargando(false);
      });
    return () => {
      cancelado = true;
    };
  }, []);

  const entrarComoInvitado = useCallback(() => {
    sesionApi.marcarLoginVisto();
    setSesion(SESION_INVITADO);
    setMostrarLogin(false);
  }, []);

  const iniciarSesion = useCallback(async (usuario, contrasena) => {
    const { usuario: datos } = await sesionApi.iniciarSesion(usuario, contrasena);
    sesionApi.marcarLoginVisto();
    setSesion(crearSesionAdmin(datos.nombre));
    setMostrarLogin(false);
  }, []);

  // "Cerrar sesión...": se cierra la sesión de admin (si la hay) y se vuelve al diálogo.
  const cerrarSesion = useCallback(async () => {
    if (sesion?.esAdmin) {
      try {
        await sesionApi.cerrarSesion();
      } catch {
        // aunque falle la petición, en el navegador se sale igualmente
      }
    }
    setSesion(null);
    setMostrarLogin(true);
  }, [sesion]);

  const valor = useMemo(
    () => ({ cargando, sesion, mostrarLogin, entrarComoInvitado, iniciarSesion, cerrarSesion }),
    [cargando, sesion, mostrarLogin, entrarComoInvitado, iniciarSesion, cerrarSesion]
  );

  return <SesionContexto.Provider value={valor}>{children}</SesionContexto.Provider>;
}
