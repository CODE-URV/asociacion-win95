import { useEffect, useState } from 'react';
import { agruparPorDia, rangoDelMes } from '../dominio/calendario';
import { obtenerEventos } from '../infraestructura/eventosApi';

/** Carga los eventos del mes indicado y los agrupa por día. */
export default function useEventosDelMes(anio, mes) {
  const clave = `${anio}-${mes}`;
  // Resultado de la última carga terminada; mientras su clave no sea la del mes pedido, está cargando
  const [resultado, setResultado] = useState({ clave: null, error: null, eventosPorDia: {} });

  useEffect(() => {
    let cancelado = false;
    const { desde, hasta } = rangoDelMes(anio, mes);

    obtenerEventos(desde, hasta)
      .then((eventos) => {
        if (!cancelado) setResultado({ clave, error: null, eventosPorDia: agruparPorDia(eventos) });
      })
      .catch((error) => {
        if (!cancelado) setResultado({ clave, error: error.message, eventosPorDia: {} });
      });

    return () => {
      cancelado = true;
    };
  }, [anio, mes, clave]);

  const cargando = resultado.clave !== clave;
  return {
    cargando,
    error: cargando ? null : resultado.error,
    eventosPorDia: cargando ? {} : resultado.eventosPorDia,
  };
}
