import { useEffect, useRef, useState } from 'react';

const COLUMNAS = 7;
const ANCHO_MIN = 30;
const ANCHO_MAX = 110;
const PROPORCION = 130 / 90; // alto / ancho
export const SOLAPE = 0.22; // parte visible de cada carta tapada en una columna (respecto a su alto)

/**
 * Calcula el tamaño de carta según el ancho del tablero y lo expone como
 * variables CSS (--card-width, ...) y como valores para los desplazamientos en JS.
 * Los márgenes y separaciones se leen del propio CSS, que cambia en móvil.
 */
export default function useTamanoCartas() {
  const contenedorRef = useRef(null);
  const [tamano, setTamano] = useState({ width: 90, height: 130 });

  useEffect(() => {
    const contenedor = contenedorRef.current;
    if (!contenedor) return undefined;

    const actualizar = () => {
      const estilo = getComputedStyle(contenedor);
      const padding = parseFloat(estilo.paddingLeft) + parseFloat(estilo.paddingRight);
      const columnas = contenedor.querySelector('.solitario-tableaus');
      const separacion = columnas ? parseFloat(getComputedStyle(columnas).columnGap) || 0 : 12;

      // Límite por ancho: que quepan las 7 columnas
      const disponible = Math.max(0, contenedor.clientWidth - padding - (COLUMNAS - 1) * separacion);
      const anchoPorAncho = Math.floor(disponible / COLUMNAS);

      // Límite por alto: zona superior (1 o 2 filas de cartas) + una columna con ~6 cartas solapadas
      const cabecera = contenedor.querySelector('.solitario-header');
      const altoCabecera = cabecera ? cabecera.offsetHeight + parseFloat(getComputedStyle(cabecera).marginBottom) : 0;
      const superior = contenedor.querySelector('.solitario-top');
      const filasSuperiores = superior && getComputedStyle(superior).flexDirection === 'row' ? 1 : 2;
      const altoDisponible = contenedor.clientHeight - parseFloat(estilo.paddingTop) - parseFloat(estilo.paddingBottom)
        - altoCabecera - 3 * separacion;
      const anchoPorAlto = Math.floor(altoDisponible / (filasSuperiores + 1 + 6 * SOLAPE) / PROPORCION);

      const ancho = Math.max(ANCHO_MIN, Math.min(ANCHO_MAX, anchoPorAncho, anchoPorAlto));
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
