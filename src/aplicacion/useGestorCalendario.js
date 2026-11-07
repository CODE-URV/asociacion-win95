import { useCallback, useEffect, useState } from 'react';
import * as api from '../infraestructura/eventosApi';

/** Eventos del Google Calendar para administrarlos desde el Panel de control. */
export default function useGestorCalendario() {
  const [eventos, setEventos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const recargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      setEventos(await api.listarEventosAdmin());
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    recargar();
  }, [recargar]);

  const crear = async (datos) => {
    const nuevo = await api.crearEvento(datos);
    await recargar();
    return nuevo;
  };

  const actualizar = async (id, datos) => {
    const actualizado = await api.actualizarEvento(id, datos);
    await recargar();
    return actualizado;
  };

  const eliminar = async (id) => {
    await api.eliminarEvento(id);
    setEventos((lista) => lista.filter((e) => e.id !== id));
  };

  return { eventos, cargando, error, recargar, crear, actualizar, eliminar };
}
