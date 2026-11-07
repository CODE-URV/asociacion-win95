import { useState } from 'react';
import './GestorProyectos.css';
import { colorDeEstado, proyectoVacio } from '../../../dominio/proyecto';
import useProyectos from '../../../aplicacion/useProyectos';
import FormularioProyecto from './FormularioProyecto';

/** Gestión de proyectos para administradores: lista + alta, edición y borrado. */
export default function GestorProyectos() {
  const { proyectos, cargando, error, recargar, crear, actualizar, eliminar } = useProyectos();
  const [seleccionadoId, setSeleccionadoId] = useState(null);
  const [edicion, setEdicion] = useState(null); // null | { modo: 'nuevo' } | { modo: 'editar', proyecto }
  const [aviso, setAviso] = useState(null);

  const seleccionado = proyectos.find((p) => p.id === seleccionadoId) ?? null;

  const guardar = async (datos) => {
    if (edicion.modo === 'nuevo') {
      const nuevo = await crear(datos);
      setSeleccionadoId(nuevo.id);
      setAviso(`Proyecto "${nuevo.nombre}" creado.`);
    } else {
      const actualizado = await actualizar(edicion.proyecto.id, datos);
      setAviso(`Proyecto "${actualizado.nombre}" guardado.`);
    }
    setEdicion(null);
  };

  const borrar = async () => {
    if (!seleccionado) return;
    if (!window.confirm(`¿Seguro que quieres eliminar "${seleccionado.nombre}"? No se puede deshacer.`)) return;
    try {
      await eliminar(seleccionado.id);
      setAviso(`Proyecto "${seleccionado.nombre}" eliminado.`);
      setSeleccionadoId(null);
    } catch (e) {
      setAviso(`No se ha podido eliminar: ${e.message}`);
    }
  };

  if (edicion) {
    return (
      <FormularioProyecto
        inicial={edicion.modo === 'nuevo' ? proyectoVacio() : edicion.proyecto}
        titulo={edicion.modo === 'nuevo' ? 'Nuevo proyecto' : `Editar: ${edicion.proyecto.nombre}`}
        alGuardar={guardar}
        alCancelar={() => setEdicion(null)}
      />
    );
  }

  return (
    <div className="gp">
      <div className="gp-barra">
        <button className="win95-boton" onClick={() => { setAviso(null); setEdicion({ modo: 'nuevo' }); }}>
          ➕ Nuevo
        </button>
        <button
          className="win95-boton"
          disabled={!seleccionado}
          onClick={() => { setAviso(null); setEdicion({ modo: 'editar', proyecto: seleccionado }); }}
        >
          ✏️ Editar
        </button>
        <button className="win95-boton" disabled={!seleccionado} onClick={borrar}>
          🗑️ Eliminar
        </button>
        <button className="win95-boton" onClick={recargar}>🔄 Actualizar</button>
      </div>

      {aviso && <div className="gp-aviso">{aviso}</div>}

      <div className="gp-tabla-marco">
        {cargando && <div className="gp-mensaje">⏳ Cargando proyectos...</div>}
        {error && <div className="gp-mensaje gp-error-general">❌ {error}</div>}
        {!cargando && !error && proyectos.length === 0 && (
          <div className="gp-mensaje">No hay proyectos. Pulsa "Nuevo" para crear el primero.</div>
        )}
        {!cargando && !error && proyectos.length > 0 && (
          <table className="gp-tabla">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Estado</th>
                <th>Progreso</th>
                <th>Responsable</th>
              </tr>
            </thead>
            <tbody>
              {proyectos.map((p) => (
                <tr
                  key={p.id}
                  className={p.id === seleccionadoId ? 'gp-fila-seleccionada' : ''}
                  onClick={() => setSeleccionadoId(p.id)}
                  onDoubleClick={() => setEdicion({ modo: 'editar', proyecto: p })}
                >
                  <td>{p.nombre}</td>
                  <td>
                    <span className="gp-punto" style={{ backgroundColor: colorDeEstado(p.estado) }} />
                    {p.estado}
                  </td>
                  <td>{p.progreso}%</td>
                  <td>{p.responsable}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="gp-estado">{proyectos.length} proyecto(s)</div>
    </div>
  );
}
