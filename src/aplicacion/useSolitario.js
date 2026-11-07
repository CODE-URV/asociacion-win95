import { useEffect, useRef, useState } from 'react';
import * as reglas from '../dominio/solitario';

/** Partida de Solitario: estado, cronómetro, fin de partida y acciones del jugador. */
export default function useSolitario() {
  const [partida, setPartida] = useState(() => reglas.crearPartida());
  const [segundos, setSegundos] = useState(0);
  const [rendido, setRendido] = useState(false);
  const [seleccion, setSeleccion] = useState(null); // origen elegido con un toque (modo táctil)
  const arrastre = useRef(null); // origen de la carta que se está arrastrando (ratón)

  const ganada = reglas.haGanado(partida);
  const sinMovimientos = !ganada && !reglas.hayMovimientos(partida);
  const terminada = ganada || sinMovimientos || rendido;

  useEffect(() => {
    if (terminada) return undefined;
    const temporizador = setInterval(() => setSegundos((s) => s + 1), 1000);
    return () => clearInterval(temporizador);
  }, [terminada]);

  // Aplica un movimiento solo si es válido
  const aplicar = (calcular) => setPartida((actual) => calcular(actual) ?? actual);

  /** Intenta un movimiento; devuelve true si se ha hecho. */
  const intentar = (calcular) => {
    const nueva = calcular(partida);
    if (nueva) setPartida(nueva);
    return Boolean(nueva);
  };

  const puedeSeleccionarse = (origen) => reglas.cartasDelOrigen(partida, origen).length > 0;

  const nuevaPartida = () => {
    setPartida(reglas.crearPartida());
    setSegundos(0);
    setRendido(false);
    setSeleccion(null);
    arrastre.current = null;
  };

  return {
    partida,
    seleccion,
    tiempo: reglas.formatearTiempo(segundos),
    resultado: ganada ? 'ganada' : terminada ? 'perdida' : null,
    nuevaPartida,
    rendirse: () => setRendido(true),
    robar: () => {
      setSeleccion(null);
      aplicar(reglas.robar);
    },

    // --- Ratón: arrastrar y soltar, doble clic ---
    empezarArrastre: (origen) => {
      arrastre.current = origen;
    },
    soltarEnFundacion: (indice) => {
      const origen = arrastre.current;
      arrastre.current = null;
      if (origen) aplicar((p) => reglas.moverAFundacion(p, origen, indice));
    },
    soltarEnColumna: (indice) => {
      const origen = arrastre.current;
      arrastre.current = null;
      if (origen) aplicar((p) => reglas.moverAColumna(p, origen, indice));
    },
    moverAutomatico: (origen) => aplicar((p) => reglas.moverAutomatico(p, origen)),

    // --- Táctil: tocar una carta para elegirla y tocar el destino ---
    tocarCarta: (origen) => {
      if (!seleccion) {
        if (puedeSeleccionarse(origen)) setSeleccion(origen);
        return;
      }
      if (reglas.mismoOrigen(seleccion, origen)) {
        // Segundo toque en la misma carta: a su fundación si se puede
        intentar((p) => reglas.moverAutomatico(p, origen));
        setSeleccion(null);
        return;
      }
      // Tocar una carta de otra columna es tocar esa columna como destino
      if (origen.tipo === 'columna' && intentar((p) => reglas.mover(p, seleccion, reglas.aColumna(origen.indice)))) {
        setSeleccion(null);
        return;
      }
      setSeleccion(puedeSeleccionarse(origen) ? origen : null);
    },
    tocarDestino: (destino) => {
      if (!seleccion) return;
      intentar((p) => reglas.mover(p, seleccion, destino));
      setSeleccion(null);
    },
    cancelarSeleccion: () => setSeleccion(null),
  };
}
