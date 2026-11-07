import { useEffect, useState } from 'react';
import * as api from '../infraestructura/actividadesApi';
import { personaASolicitud } from '../dominio/actividad';

/**
 * Registrar la asistencia tras escanear el QR de la sala.
 *
 *   validando → correo → (datos, si no estaba inscrito) → hecho
 *                 ↘ error (QR caducado, fuera de horario...)
 */
export default function useAsistencia(actividadId, codigo) {
  const [paso, setPaso] = useState('validando');
  const [pase, setPase] = useState(null);
  const [error, setError] = useState(null);
  const [detalles, setDetalles] = useState(null);
  const [resultado, setResultado] = useState(null);
  const [enviando, setEnviando] = useState(false);

  // Nada más abrir: cambiar el código del QR (caduca enseguida) por un pase de 15 min
  useEffect(() => {
    let cancelado = false;
    api.obtenerPase(actividadId, codigo)
      .then((nuevoPase) => {
        if (cancelado) return;
        setPase(nuevoPase);
        setPaso('correo');
      })
      .catch((e) => {
        if (cancelado) return;
        setError(e.message);
        setPaso('error');
      });
    return () => {
      cancelado = true;
    };
  }, [actividadId, codigo]);

  const enviar = async (cuerpo) => {
    setEnviando(true);
    setError(null);
    setDetalles(null);
    try {
      const respuesta = await api.registrarAsistencia(actividadId, { pase, ...cuerpo });
      if (respuesta.requiereDatos) {
        setPaso('datos');
      } else {
        setResultado(respuesta);
        setPaso('hecho');
      }
    } catch (e) {
      setError(e.message);
      setDetalles(e.detalles);
      if (e.estado === 403) setPaso('error'); // pase caducado o fuera de horario
    } finally {
      setEnviando(false);
    }
  };

  return {
    paso,
    error,
    detalles,
    resultado,
    enviando,
    enviarCorreo: (email) => enviar({ email: email.trim() }),
    enviarDatos: (persona) => enviar(personaASolicitud(persona)),
  };
}
