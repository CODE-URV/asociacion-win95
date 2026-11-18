import { useCallback, useEffect, useState } from 'react';
import * as api from '../infraestructura/olimpiadasApi';

/** Administración de las CodeOlimpiadas: equipos, pruebas, notas, imágenes y partidas. */
export function useGestorOlimpiadas() {
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState(null);

  const recargar = useCallback(
    () =>
      api.obtenerOlimpiadasAdmin().then(
        (respuesta) => {
          setDatos(respuesta);
          setError(null);
        },
        (e) => setError(e.message),
      ),
    [],
  );

  useEffect(() => {
    recargar();
  }, [recargar]);

  // Cada operación recarga todo: así el ranking y las clasificaciones siempre cuadran
  const yRecargar = (operacion) => async (...argumentos) => {
    const resultado = await operacion(...argumentos);
    await recargar();
    return resultado;
  };

  return {
    datos,
    cargando: datos === null && error === null,
    error,
    recargar,
    crearEquipo: yRecargar(api.crearEquipo),
    actualizarEquipo: yRecargar(api.actualizarEquipo),
    eliminarEquipo: yRecargar(api.eliminarEquipo),
    crearPrueba: yRecargar(api.crearPrueba),
    actualizarPrueba: yRecargar(api.actualizarPrueba),
    eliminarPrueba: yRecargar(api.eliminarPrueba),
    puntuar: yRecargar(api.puntuar),
    subirImagen: yRecargar(api.subirImagen),
    eliminarImagen: yRecargar(api.eliminarImagen),
    reiniciarPartida: yRecargar(api.reiniciarPartida),
    cambiarVisibilidad: yRecargar(api.cambiarVisibilidad),
    urlImagen: api.urlImagenAdmin,
  };
}
