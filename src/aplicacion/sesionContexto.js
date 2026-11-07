import { createContext, useContext } from 'react';

export const SesionContexto = createContext(null);

/**
 * {
 *   cargando, sesion: { nombre, esAdmin } | null, mostrarLogin,
 *   entrarComoInvitado(), iniciarSesion(usuario, contrasena), cerrarSesion()
 * }
 */
export function useSesion() {
  const valor = useContext(SesionContexto);
  if (!valor) throw new Error('useSesion debe usarse dentro de <SesionProvider>');
  return valor;
}
