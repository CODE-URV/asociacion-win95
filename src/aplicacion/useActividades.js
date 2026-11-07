import { useCallback, useEffect, useState } from 'react';
import * as api from '../infraestructura/actividadesApi';
import { personaASolicitud } from '../dominio/actividad';

/** Lista pública de actividades y caso de uso "apuntarse". */
export default function useActividades() {
  const [actividades, setActividades] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const recargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      setActividades(await api.listarActividades());
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    recargar();
  }, [recargar]);

  /** Devuelve { ok } o { ok: false, error, detalles }. */
  const inscribirse = async (actividadId, persona) => {
    try {
      await api.inscribirse(actividadId, personaASolicitud(persona));
      recargar(); // actualiza las plazas libres
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e.message, detalles: e.detalles };
    }
  };

  return { actividades, cargando, error, recargar, inscribirse };
}
