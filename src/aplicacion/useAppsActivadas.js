import { useEffect, useState } from 'react';
import { obtenerVisibilidad } from '../infraestructura/olimpiadasApi';

/**
 * Ids de las apps "que hay que activar" (requiereActivacion) que los admins han activado.
 * Ahora mismo solo CodeOlimpiadas. Si la API falla, se quedan ocultas.
 */
export default function useAppsActivadas(sesion) {
  const [activadas, setActivadas] = useState([]);

  useEffect(() => {
    if (!sesion) return undefined;
    let vigente = true;
    obtenerVisibilidad().then(
      ({ visibles }) => vigente && setActivadas(visibles ? ['olimpiadas'] : []),
      () => vigente && setActivadas([]),
    );
    return () => {
      vigente = false;
    };
  }, [sesion]);

  return activadas;
}
