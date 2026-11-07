import { useState } from 'react';
import '../proyectos/GestorProyectos.css';
import useGestorCalendario from '../../../aplicacion/useGestorCalendario';
import { eventoVacio, textoFechaEvento } from '../../../dominio/calendario';
import FormularioEvento from './FormularioEvento';

/**
 * Panel de control → Calendario: los eventos del Google Calendar de la asociación.
 * Es el mismo calendario que se edita desde el móvil: lo de aquí se ve allí y al revés.
 */
export default function GestorCalendario() {
  const { eventos, cargando, error, recargar, crear, actualizar, eliminar } = useGestorCalendario();
  const [seleccionadoId, setSeleccionadoId] = useState(null);
  const [edicion, setEdicion] = useState(null); // null | { modo: 'nuevo' } | { modo: 'editar', evento }
  const [aviso, setAviso] = useState(null);

  const seleccionado = eventos.find((e) => e.id === seleccionadoId) ?? null;

  const guardar = async (datos) => {
    if (edicion.modo === 'nuevo') {
      const nuevo = await crear(datos);
      setSeleccionadoId(nuevo.id);
      setAviso(`Evento "${nuevo.titulo}" creado. Ya aparece en el calendario de la web y en Google Calendar.`);
    } else {
      const actualizado = await actualizar(edicion.evento.id, datos);
      setAviso(`Evento "${actualizado.titulo}" guardado.`);
    }
    setEdicion(null);
  };

  const borrar = async () => {
    if (!seleccionado) return;
    if (!window.confirm(`¿Eliminar "${seleccionado.titulo}" del calendario? También desaparecerá del móvil.`)) return;
    try {
      await eliminar(seleccionado.id);
      setAviso(`Evento "${seleccionado.titulo}" eliminado.`);
      setSeleccionadoId(null);
    } catch (e) {
      setAviso(`No se ha podido eliminar: ${e.message}`);
    }
  };

  if (edicion) {
    return (
      <FormularioEvento
        inicial={edicion.modo === 'nuevo' ? eventoVacio() : edicion.evento}
        titulo={edicion.modo === 'nuevo' ? 'Nuevo evento' : `Editar: ${edicion.evento.titulo}`}
        alGuardar={guardar}
        alCancelar={() => setEdicion(null)}
      />
    );
  }

  return (
    <div className="gp">
      <div className="gp-barra">
        <button className="win95-boton" onClick={() => { setAviso(null); setEdicion({ modo: 'nuevo' }); }}>➕ Nuevo</button>
        <button className="win95-boton" disabled={!seleccionado} onClick={() => { setAviso(null); setEdicion({ modo: 'editar', evento: seleccionado }); }}>
          ✏️ Editar
        </button>
        <button className="win95-boton" disabled={!seleccionado} onClick={borrar}>🗑️ Eliminar</button>
        <button className="win95-boton" onClick={recargar}>🔄</button>
      </div>

      {aviso && <div className="gp-aviso">{aviso}</div>}

      <div className="gp-tabla-marco">
        {cargando && eventos.length === 0 && <div className="gp-mensaje">⏳ Cargando el calendario...</div>}
        {error && <div className="gp-mensaje gp-error-general">❌ {error}</div>}
        {!cargando && !error && eventos.length === 0 && (
          <div className="gp-mensaje">No hay eventos entre el mes pasado y el año que viene.</div>
        )}
        {eventos.length > 0 && (
          <table className="gp-tabla">
            <thead>
              <tr>
                <th>Cuándo</th>
                <th>Evento</th>
                <th>Lugar</th>
              </tr>
            </thead>
            <tbody>
              {eventos.map((e) => (
                <tr
                  key={e.id}
                  className={e.id === seleccionadoId ? 'gp-fila-seleccionada' : ''}
                  onClick={() => setSeleccionadoId(e.id)}
                  onDoubleClick={() => setEdicion({ modo: 'editar', evento: e })}
                >
                  <td>{textoFechaEvento(e)}</td>
                  <td>{e.titulo}</td>
                  <td>{e.lugar}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="gp-estado">
        {eventos.length} evento(s) — es el mismo Google Calendar que usáis en el móvil
      </div>
    </div>
  );
}
