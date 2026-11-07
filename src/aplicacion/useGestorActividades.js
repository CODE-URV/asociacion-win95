import { useCallback, useEffect, useState } from 'react';
import * as api from '../infraestructura/actividadesApi';

/** Administración de actividades: lista con recuentos, alta, edición y borrado. */
export function useGestorActividades() {
  const [actividades, setActividades] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const recargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      setActividades(await api.listarActividadesAdmin());
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    recargar();
  }, [recargar]);

  /** Devuelven { actividad, aviso }: aviso si la actividad se guardó pero el calendario no se pudo actualizar. */
  const crear = async (datos) => {
    const resultado = await api.crearActividad(datos);
    await recargar();
    return resultado;
  };

  const actualizar = async (id, datos) => {
    const resultado = await api.actualizarActividad(id, datos);
    await recargar();
    return resultado;
  };

  /** Devuelve el aviso (o null) si no se pudo quitar del calendario. */
  const eliminar = async (id) => {
    const aviso = await api.eliminarActividad(id);
    setActividades((lista) => lista.filter((a) => a.id !== id));
    return aviso;
  };

  return { actividades, cargando, error, recargar, crear, actualizar, eliminar };
}

/** Inscritos de una actividad, con asistencia manual y borrado. */
export function useInscritos(actividadId) {
  const [inscritos, setInscritos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const recargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      setInscritos(await api.listarInscritos(actividadId));
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }, [actividadId]);

  useEffect(() => {
    recargar();
  }, [recargar]);

  const reemplazar = (actualizada) =>
    setInscritos((lista) => lista.map((i) => (i.id === actualizada.id ? actualizada : i)));

  return {
    inscritos,
    cargando,
    error,
    recargar,
    marcarAsistencia: async (inscripcionId, asistio) =>
      reemplazar(await api.marcarAsistencia(actividadId, inscripcionId, asistio)),
    eliminar: async (inscripcionId) => {
      await api.eliminarInscripcion(actividadId, inscripcionId);
      setInscritos((lista) => lista.filter((i) => i.id !== inscripcionId));
    },
    reenviarCertificado: async (inscripcionId) =>
      reemplazar(await api.reenviarCertificado(actividadId, inscripcionId)),
    urlVistaPrevia: (inscripcionId = null) => api.urlVistaPreviaCertificado(actividadId, inscripcionId),

    /**
     * Envía todos los certificados pendientes por lotes, avisando del progreso.
     * Devuelve { enviados, error }.
     */
    enviarCertificados: async (alProgresar) => {
      let total = 0;
      for (;;) {
        const lote = await api.enviarLoteCertificados(actividadId);
        total += lote.enviados;
        alProgresar?.({ enviados: total, pendientes: lote.pendientes });
        if (lote.error || lote.pendientes === 0 || lote.enviados === 0) {
          await recargar();
          return { enviados: total, error: lote.error };
        }
      }
    },
  };
}

/**
 * Código del QR del proyector: se renueva justo cuando cambia (cada 30 s) y
 * de paso actualiza cuántos asistentes llevan registrados.
 */
export function useCodigoQr(actividadId) {
  const [estado, setEstado] = useState({ codigo: null, caducaEn: null, asistentes: null, error: null });

  useEffect(() => {
    let cancelado = false;
    let temporizador;

    const pedir = async () => {
      try {
        const [qr, lista] = await Promise.all([api.obtenerCodigoQr(actividadId), api.listarActividadesAdmin()]);
        if (cancelado) return;
        const segundos = Math.max(1, qr.cambiaEn - qr.ahora);
        setEstado({
          codigo: qr.codigo,
          caducaEn: Date.now() + segundos * 1000,
          asistentes: lista.find((a) => a.id === actividadId)?.asistentes ?? null,
          error: null,
        });
        temporizador = setTimeout(pedir, segundos * 1000 + 300);
      } catch (e) {
        if (cancelado) return;
        setEstado((previo) => ({ ...previo, error: e.message }));
        temporizador = setTimeout(pedir, 5000);
      }
    };

    pedir();
    return () => {
      cancelado = true;
      clearTimeout(temporizador);
    };
  }, [actividadId]);

  return estado;
}
