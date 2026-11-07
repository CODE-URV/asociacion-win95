import { useMemo, useReducer } from 'react';
import * as ventanas from '../dominio/ventanas';

const pantallaActual = () => ({ ancho: window.innerWidth, alto: window.innerHeight });

function reductor(estado, accion) {
  switch (accion.tipo) {
    case 'abrir':
      return {
        secuencia: estado.secuencia + 1,
        lista: ventanas.abrirVentana(estado.lista, accion.app, accion.pantalla, estado.secuencia),
      };
    case 'cerrar':
      return { ...estado, lista: ventanas.cerrarVentana(estado.lista, accion.id) };
    case 'cerrarApps':
      return { ...estado, lista: ventanas.cerrarApps(estado.lista, accion.appIds) };
    case 'minimizar':
      return { ...estado, lista: ventanas.minimizarVentana(estado.lista, accion.id) };
    case 'enfocar':
      return { ...estado, lista: ventanas.traerAlFrente(estado.lista, accion.id) };
    case 'restaurar':
      return { ...estado, lista: ventanas.traerAlFrente(estado.lista, accion.id, { restaurar: true }) };
    case 'maximizar':
      return { ...estado, lista: ventanas.alternarMaximizada(estado.lista, accion.id) };
    case 'mover':
      return { ...estado, lista: ventanas.moverVentana(estado.lista, accion.id, accion.posicion) };
    case 'redimensionar':
      return { ...estado, lista: ventanas.redimensionarVentana(estado.lista, accion.id, accion.tamano) };
    default:
      return estado;
  }
}

/** Estado y acciones de las ventanas abiertas en el escritorio. */
export default function useGestorVentanas() {
  const [estado, despachar] = useReducer(reductor, { secuencia: 0, lista: [] });

  const acciones = useMemo(
    () => ({
      abrir: (app) => despachar({ tipo: 'abrir', app, pantalla: pantallaActual() }),
      cerrar: (id) => despachar({ tipo: 'cerrar', id }),
      cerrarApps: (appIds) => despachar({ tipo: 'cerrarApps', appIds }),
      minimizar: (id) => despachar({ tipo: 'minimizar', id }),
      enfocar: (id) => despachar({ tipo: 'enfocar', id }),
      restaurar: (id) => despachar({ tipo: 'restaurar', id }),
      maximizar: (id) => despachar({ tipo: 'maximizar', id }),
      mover: (id, posicion) => despachar({ tipo: 'mover', id, posicion }),
      redimensionar: (id, tamano) => despachar({ tipo: 'redimensionar', id, tamano }),
    }),
    []
  );

  return { ventanas: estado.lista, ...acciones };
}
