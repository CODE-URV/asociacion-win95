// Dominio del Solitario: reglas del juego como funciones puras.
// El estado es inmutable: cada movimiento devuelve un estado nuevo, o null si no es válido.
//
// Reglas de esta versión:
// - Cuatro "palos" que son lenguajes; cada fundación acepta un lenguaje del A al K.
// - En las columnas se apilan cartas en orden descendente alternando lenguaje; solo un K en columna vacía.
// - Del mazo se roban 3 cartas.

export const LENGUAJES = ['Java', 'Python', 'JavaScript', 'C++'];
export const RANGOS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
export const CARTAS_POR_ROBO = 3;
const TOTAL_CARTAS = LENGUAJES.length * RANGOS.length;

// Orígenes de un movimiento
export const desdeDescarte = () => ({ tipo: 'descarte' });
export const desdeColumna = (indice, posicion) => ({ tipo: 'columna', indice, posicion });

function barajar(cartas, aleatorio) {
  const copia = [...cartas];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(aleatorio() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

export function crearPartida(aleatorio = Math.random) {
  const baraja = barajar(
    LENGUAJES.flatMap((lenguaje) =>
      RANGOS.map((rango, i) => ({ id: `${lenguaje}-${rango}`, lenguaje, rango, valor: i + 1, bocaArriba: false }))
    ),
    aleatorio
  );

  const columnas = Array.from({ length: 7 }, () => []);
  let siguiente = 0;
  for (let fila = 0; fila < 7; fila++) {
    for (let col = fila; col < 7; col++) {
      columnas[col].push({ ...baraja[siguiente++], bocaArriba: fila === col });
    }
  }

  return {
    mazo: baraja.slice(siguiente),
    descarte: [],
    fundaciones: LENGUAJES.map(() => []),
    columnas,
    movimientos: 0,
  };
}

const ultima = (pila) => pila[pila.length - 1];

export function robar(estado) {
  if (estado.mazo.length === 0) {
    if (estado.descarte.length === 0) return estado;
    return {
      ...estado,
      mazo: estado.descarte.map((c) => ({ ...c, bocaArriba: false })).reverse(),
      descarte: [],
      movimientos: estado.movimientos + 1,
    };
  }

  const cuantas = Math.min(CARTAS_POR_ROBO, estado.mazo.length);
  const robadas = estado.mazo.slice(-cuantas).reverse().map((c) => ({ ...c, bocaArriba: true }));
  return {
    ...estado,
    mazo: estado.mazo.slice(0, -cuantas),
    descarte: [...estado.descarte, ...robadas],
    movimientos: estado.movimientos + 1,
  };
}

export function puedeIrAFundacion(carta, fundacion, indiceFundacion) {
  if (carta.lenguaje !== LENGUAJES[indiceFundacion]) return false;
  if (fundacion.length === 0) return carta.rango === 'A';
  return carta.valor === ultima(fundacion).valor + 1;
}

export function puedeIrAColumna(carta, columna) {
  if (columna.length === 0) return carta.rango === 'K';
  const arriba = ultima(columna);
  if (!arriba.bocaArriba) return false;
  return carta.lenguaje !== arriba.lenguaje && carta.valor === arriba.valor - 1;
}

/** Cartas que se moverían desde un origen (en columna, la carta y las que tiene encima). */
export function cartasDelOrigen(estado, origen) {
  if (origen.tipo === 'descarte') {
    const carta = ultima(estado.descarte);
    return carta ? [carta] : [];
  }
  const columna = estado.columnas[origen.indice];
  const cartas = columna.slice(origen.posicion);
  return cartas.length > 0 && cartas[0].bocaArriba ? cartas : [];
}

/** Quita las cartas del origen y da la vuelta a la carta que queda descubierta. */
function quitarDelOrigen(estado, origen) {
  if (origen.tipo === 'descarte') {
    return { ...estado, descarte: estado.descarte.slice(0, -1) };
  }
  const columnas = estado.columnas.map((columna, i) => {
    if (i !== origen.indice) return columna;
    const restante = columna.slice(0, origen.posicion);
    const descubierta = ultima(restante);
    if (descubierta && !descubierta.bocaArriba) {
      return [...restante.slice(0, -1), { ...descubierta, bocaArriba: true }];
    }
    return restante;
  });
  return { ...estado, columnas };
}

export function moverAFundacion(estado, origen, indiceFundacion) {
  const cartas = cartasDelOrigen(estado, origen);
  if (cartas.length !== 1) return null; // a la fundación solo va la carta de arriba
  const [carta] = cartas;
  if (!puedeIrAFundacion(carta, estado.fundaciones[indiceFundacion], indiceFundacion)) return null;

  const sinCarta = quitarDelOrigen(estado, origen);
  return {
    ...sinCarta,
    fundaciones: sinCarta.fundaciones.map((f, i) => (i === indiceFundacion ? [...f, carta] : f)),
    movimientos: estado.movimientos + 1,
  };
}

export function moverAColumna(estado, origen, indiceDestino) {
  if (origen.tipo === 'columna' && origen.indice === indiceDestino) return null;
  const cartas = cartasDelOrigen(estado, origen);
  if (cartas.length === 0) return null;
  if (!puedeIrAColumna(cartas[0], estado.columnas[indiceDestino])) return null;

  const sinCartas = quitarDelOrigen(estado, origen);
  return {
    ...sinCartas,
    columnas: sinCartas.columnas.map((c, i) => (i === indiceDestino ? [...c, ...cartas] : c)),
    movimientos: estado.movimientos + 1,
  };
}

// Destinos de un movimiento
export const aFundacion = (indice) => ({ tipo: 'fundacion', indice });
export const aColumna = (indice) => ({ tipo: 'columna', indice });

/** Mueve desde un origen a un destino (fundación o columna). null si no es válido. */
export function mover(estado, origen, destino) {
  return destino.tipo === 'fundacion'
    ? moverAFundacion(estado, origen, destino.indice)
    : moverAColumna(estado, origen, destino.indice);
}

export function mismoOrigen(a, b) {
  return Boolean(a && b) && a.tipo === b.tipo && a.indice === b.indice && a.posicion === b.posicion;
}

/** Doble clic: manda la carta a su fundación si se puede. */
export function moverAutomatico(estado, origen) {
  const cartas = cartasDelOrigen(estado, origen);
  if (cartas.length !== 1) return null;
  return moverAFundacion(estado, origen, LENGUAJES.indexOf(cartas[0].lenguaje));
}

export function haGanado(estado) {
  return estado.fundaciones.reduce((total, f) => total + f.length, 0) === TOTAL_CARTAS;
}

/** Mientras quede mazo o descarte se puede seguir robando; si no, se busca algún movimiento. */
export function hayMovimientos(estado) {
  if (estado.mazo.length > 0 || estado.descarte.length > 0) return true;

  return estado.columnas.some((columna, i) =>
    columna.some((carta, posicion) => {
      if (!carta.bocaArriba) return false;
      const origen = desdeColumna(i, posicion);
      const esLaDeArriba = posicion === columna.length - 1;
      if (esLaDeArriba && moverAutomatico(estado, origen)) return true;
      return estado.columnas.some((_, destino) => moverAColumna(estado, origen, destino) !== null);
    })
  );
}

export function formatearTiempo(segundos) {
  const minutos = Math.floor(segundos / 60);
  return `${minutos}:${String(segundos % 60).padStart(2, '0')}`;
}
