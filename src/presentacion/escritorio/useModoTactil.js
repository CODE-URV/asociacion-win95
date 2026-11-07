import { useSyncExternalStore } from 'react';

// Pantalla pequeña o en horizontal con poca altura: las ventanas ocupan toda la pantalla.
// Debe coincidir con las @media de los CSS: (max-width: 768px), (max-height: 500px)
const PANTALLA_PEQUENA = '(max-width: 768px), (max-height: 500px)';

// Además, en cualquier pantalla táctil (tablets incluidas) se abre con un solo toque.
const CONSULTA_TACTIL = `${PANTALLA_PEQUENA}, (hover: none) and (pointer: coarse)`;

function suscribir(consulta) {
  return (avisar) => {
    const lista = window.matchMedia(consulta);
    lista.addEventListener('change', avisar);
    return () => lista.removeEventListener('change', avisar);
  };
}

const suscribirTactil = suscribir(CONSULTA_TACTIL);
const esTactil = () => window.matchMedia(CONSULTA_TACTIL).matches;

/** true si hay que usar interacción táctil: un toque en vez de doble clic, tocar en vez de arrastrar. */
export default function useModoTactil() {
  return useSyncExternalStore(suscribirTactil, esTactil, () => false);
}
