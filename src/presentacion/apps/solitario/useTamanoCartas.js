import { useEffect, useRef, useState } from 'react';

const COLUMNAS = 7;
const SEPARACION = 12; // igual que el gap de .solitario-tableaus
const PADDING_HORIZONTAL = 32; // padding izquierdo + derecho de .solitario-container
const ANCHO_MIN = 48;
const ANCHO_MAX = 110;
const PROPORCION = 130 / 90; // alto / ancho

/**
 * Calcula el tamaño de carta según el ancho del tablero y lo expone como
 * variables CSS (--card-width, ...) y como valores para los desplazamientos en JS.
 */
export default function useTamanoCartas() {
  const contenedorRef = useRef(null);
  const [tamano, setTamano] = useState({ width: 90, height: 130 });

  useEffect(() => {
    const contenedor = contenedorRef.current;
    if (!contenedor) return undefined;

    const actualizar = () => {
      const disponible = Math.max(0, contenedor.clientWidth - PADDING_HORIZONTAL - (COLUMNAS - 1) * SEPARACION);
      const ancho = Math.max(ANCHO_MIN, Math.min(ANCHO_MAX, Math.floor(disponible / COLUMNAS)));
      const alto = Math.round(ancho * PROPORCION);

      contenedor.style.setProperty('--card-width', `${ancho}px`);
      contenedor.style.setProperty('--card-height', `${alto}px`);
      contenedor.style.setProperty('--waste-width', `${Math.round(ancho * 2.4)}px`);
      contenedor.style.setProperty('--card-logo-max', `${Math.round(ancho * 0.72)}px`);
      setTamano({ width: ancho, height: alto });
    };

    actualizar();
    const observador = new ResizeObserver(actualizar);
    observador.observe(contenedor);
    return () => observador.disconnect();
  }, []);

  return { contenedorRef, tamano };
}
