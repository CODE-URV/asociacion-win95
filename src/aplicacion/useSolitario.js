import { useEffect, useRef, useState } from 'react';
import * as reglas from '../dominio/solitario';

/** Partida de Solitario: estado, cronómetro, fin de partida y acciones del jugador. */
export default function useSolitario() {
  const [partida, setPartida] = useState(() => reglas.crearPartida());
  const [segundos, setSegundos] = useState(0);
  const [rendido, setRendido] = useState(false);
  const arrastre = useRef(null); // origen de la carta que se está arrastrando

  const ganada = reglas.haGanado(partida);
  const sinMovimientos = !ganada && !reglas.hayMovimientos(partida);
  const terminada = ganada || sinMovimientos || rendido;

  useEffect(() => {
    if (terminada) return undefined;
    const temporizador = setInterval(() => setSegundos((s) => s + 1), 1000);
    return () => clearInterval(temporizador);
  }, [terminada]);

  // Aplica un movimiento solo si es válido
  const aplicar = (calcular) =>
    setPartida((actual) => calcular(actual) ?? actual);

  const nuevaPartida = () => {
    setPartida(reglas.crearPartida());
    setSegundos(0);
    setRendido(false);
    arrastre.current = null;
  };

  return {
    partida,
    tiempo: reglas.formatearTiempo(segundos),
    resultado: ganada ? 'ganada' : terminada ? 'perdida' : null,
    nuevaPartida,
    rendirse: () => setRendido(true),
    robar: () => aplicar(reglas.robar),
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
  };
}
