import { useCallback, useEffect, useRef, useState } from 'react';
import * as api from '../infraestructura/olimpiadasApi';
import { cargarArticulo } from '../infraestructura/wikipediaApi';

const CADA_CUANTO_MS = 30_000;

/** Ranking y pruebas públicas; se actualiza solo cada 30 s mientras la ventana está abierta. */
export function useOlimpiadas() {
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState(null);

  const recargar = useCallback(
    () =>
      api.obtenerOlimpiadas().then(
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
    const intervalo = setInterval(() => {
      if (!document.hidden) recargar();
    }, CADA_CUANTO_MS);
    return () => clearInterval(intervalo);
  }, [recargar]);

  return { datos, cargando: datos === null && error === null, error, recargar };
}

// El código del equipo se recuerda en este navegador para poder recargar sin perder la partida
const claveCodigo = (pruebaId) => `codeurv-wikirace-${pruebaId}`;
const leerCodigo = (pruebaId) => {
  try {
    return localStorage.getItem(claveCodigo(pruebaId)) || '';
  } catch {
    return '';
  }
};
const guardarCodigo = (pruebaId, codigo) => {
  try {
    if (codigo) localStorage.setItem(claveCodigo(pruebaId), codigo);
    else localStorage.removeItem(claveCodigo(pruebaId));
  } catch {
    // sin almacenamiento: habrá que volver a escribir el código al recargar
  }
};

/**
 * Partida de Wiki Race de un equipo. El servidor cronometra y valida cada clic;
 * aquí se carga el artículo de Wikipedia en el que está el equipo.
 */
export function useWikiRace(pruebaId) {
  const [codigo, setCodigo] = useState(() => leerCodigo(pruebaId));
  const [estado, setEstado] = useState(null); // respuesta del servidor
  const [recibidoEn, setRecibidoEn] = useState(0);
  const [articulo, setArticulo] = useState(null); // { titulo, html }
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState(null);
  const [aviso, setAviso] = useState(null);
  const articuloCargado = useRef(null);

  const aplicar = useCallback(async (respuesta) => {
    setEstado(respuesta);
    setRecibidoEn(Date.now());
    const actual = respuesta.partida.actual;
    if (articuloCargado.current !== actual && !respuesta.partida.terminada) {
      try {
        setArticulo(await cargarArticulo(actual));
        articuloCargado.current = actual;
      } catch (e) {
        setError(`No se ha podido cargar «${actual}»: ${e.message}`);
      }
    }
  }, []);

  const empezar = useCallback(async (codigoEquipo) => {
    const limpio = codigoEquipo.trim().toUpperCase();
    setOcupado(true);
    setError(null);
    try {
      const respuesta = await api.empezarWikiRace(pruebaId, limpio);
      guardarCodigo(pruebaId, limpio);
      setCodigo(limpio);
      await aplicar(respuesta);
    } catch (e) {
      setError(e.message);
      if (e.estado === 401) guardarCodigo(pruebaId, '');
    } finally {
      setOcupado(false);
    }
  }, [pruebaId, aplicar]);

  // Si ya había un código guardado, se recupera la partida al abrir
  const recuperado = useRef(false);
  useEffect(() => {
    if (recuperado.current) return;
    recuperado.current = true;
    if (codigo) empezar(codigo);
  }, [codigo, empezar]);

  const irA = useCallback(async (titulo) => {
    if (ocupado || !estado || estado.partida.terminada) return;
    setOcupado(true);
    setAviso(null);
    setError(null);
    try {
      await aplicar(await api.pasoWikiRace(pruebaId, codigo, titulo));
    } catch (e) {
      if (e.estado === 409) setAviso(e.message);
      else setError(e.message);
    } finally {
      setOcupado(false);
    }
  }, [ocupado, estado, aplicar, pruebaId, codigo]);

  const ruta = estado?.partida.ruta ?? [];
  const salir = () => {
    guardarCodigo(pruebaId, '');
    setCodigo('');
    setEstado(null);
    setArticulo(null);
    articuloCargado.current = null;
  };

  return {
    codigo,
    estado,
    recibidoEn,
    articulo,
    ocupado,
    error,
    aviso,
    setAviso,
    empezar,
    irA,
    anterior: ruta.length > 1 ? ruta[ruta.length - 2] : null,
    volver: () => ruta.length > 1 && irA(ruta[ruta.length - 2]),
    /** Vuelve a cargar el artículo actual (si Wikipedia ha fallado). */
    reintentar: () => {
      setError(null);
      if (estado) aplicar(estado);
    },
    salir,
  };
}
