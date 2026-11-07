import { useCallback, useEffect, useState } from 'react';
import * as api from '../infraestructura/proyectosApi';

/**
 * Lista de proyectos con las operaciones de administración.
 * La ventana pública solo usa `proyectos`; el Panel de control usa también crear/actualizar/eliminar.
 */
export default function useProyectos() {
  const [proyectos, setProyectos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const recargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      setProyectos(await api.listarProyectos());
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    recargar();
  }, [recargar]);

  const crear = async (datos) => {
    const nuevo = await api.crearProyecto(datos);
    setProyectos((lista) => [...lista, nuevo]);
    return nuevo;
  };

  const actualizar = async (id, datos) => {
    const actualizado = await api.actualizarProyecto(id, datos);
    setProyectos((lista) => lista.map((p) => (p.id === id ? actualizado : p)));
    return actualizado;
  };

  const eliminar = async (id) => {
    await api.eliminarProyecto(id);
    setProyectos((lista) => lista.filter((p) => p.id !== id));
  };

  return { proyectos, cargando, error, recargar, crear, actualizar, eliminar };
}
