import { useState } from 'react';
import '../proyectos/GestorProyectos.css';
import './Actividades.css';
import { useGestorActividades } from '../../../aplicacion/useGestorActividades';
import { actividadVacia } from '../../../dominio/actividad';
import FormularioActividad from './FormularioActividad';
import InscritosActividad from './InscritosActividad';
import ProyectorQr from './ProyectorQr';

const fechaCorta = (texto) =>
  new Date(texto).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });

/** Panel de control → Actividades: crear charlas y talleres, ver inscritos y proyectar el QR. */
export default function GestorActividades() {
  const { actividades, cargando, error, recargar, crear, actualizar, eliminar } = useGestorActividades();
  const [seleccionadaId, setSeleccionadaId] = useState(null);
  const [vista, setVista] = useState(null); // null | { tipo: 'nueva' | 'editar' | 'inscritos' | 'qr', actividad? }
  const [aviso, setAviso] = useState(null);

  const seleccionada = actividades.find((a) => a.id === seleccionadaId) ?? null;
  const abrir = (tipo) => {
    setAviso(null);
    setVista({ tipo, actividad: seleccionada });
  };

  const guardar = async (datos) => {
    if (vista.tipo === 'nueva') {
      const { actividad: nueva, aviso: avisoCalendario } = await crear(datos);
      setSeleccionadaId(nueva.id);
      setAviso(avisoCalendario
        ? `⚠️ ${avisoCalendario}`
        : `Actividad "${nueva.titulo}" creada${nueva.publicada ? ' y publicada' : ' (sin publicar)'}${nueva.publicada && nueva.enCalendario ? ', y añadida al calendario' : ''}.`);
    } else {
      const { actividad: actualizada, aviso: avisoCalendario } = await actualizar(vista.actividad.id, datos);
      setAviso(avisoCalendario ? `⚠️ ${avisoCalendario}` : `Actividad "${actualizada.titulo}" guardada.`);
    }
    setVista(null);
  };

  const borrar = async () => {
    if (!seleccionada) return;
    const aviso = seleccionada.inscritos > 0
      ? ` También se borrarán sus ${seleccionada.inscritos} inscripción(es).`
      : '';
    if (!window.confirm(`¿Eliminar "${seleccionada.titulo}"?${aviso} No se puede deshacer.`)) return;
    try {
      const avisoCalendario = await eliminar(seleccionada.id);
      setAviso(avisoCalendario ? `⚠️ ${avisoCalendario}` : `Actividad "${seleccionada.titulo}" eliminada.`);
      setSeleccionadaId(null);
    } catch (e) {
      setAviso(`No se ha podido eliminar: ${e.message}`);
    }
  };

  if (vista?.tipo === 'nueva' || vista?.tipo === 'editar') {
    return (
      <FormularioActividad
        inicial={vista.tipo === 'nueva' ? actividadVacia() : vista.actividad}
        titulo={vista.tipo === 'nueva' ? 'Nueva actividad' : `Editar: ${vista.actividad.titulo}`}
        alGuardar={guardar}
        alCancelar={() => setVista(null)}
      />
    );
  }

  if (vista?.tipo === 'inscritos') {
    return <InscritosActividad actividad={vista.actividad} alVolver={() => { setVista(null); recargar(); }} />;
  }

  return (
    <div className="gp">
      <div className="gp-barra">
        <button className="win95-boton" onClick={() => abrir('nueva')}>➕ Nueva</button>
        <button className="win95-boton" disabled={!seleccionada} onClick={() => abrir('editar')}>✏️ Editar</button>
        <button className="win95-boton" disabled={!seleccionada} onClick={() => abrir('inscritos')}>👥 Inscritos</button>
        <button className="win95-boton" disabled={!seleccionada} onClick={() => abrir('qr')}>📱 QR</button>
        <button className="win95-boton" disabled={!seleccionada} onClick={borrar}>🗑️ Eliminar</button>
      </div>

      {aviso && <div className="gp-aviso">{aviso}</div>}

      <div className="gp-tabla-marco">
        {cargando && actividades.length === 0 && <div className="gp-mensaje">⏳ Cargando actividades...</div>}
        {error && <div className="gp-mensaje gp-error-general">❌ {error}</div>}
        {!cargando && !error && actividades.length === 0 && (
          <div className="gp-mensaje">No hay actividades. Pulsa "Nueva" para crear la primera.</div>
        )}
        {actividades.length > 0 && (
          <table className="gp-tabla">
            <thead>
              <tr>
                <th>Título</th>
                <th>Empieza</th>
                <th>Estado</th>
                <th title="Inscritos / asistentes">👥</th>
              </tr>
            </thead>
            <tbody>
              {actividades.map((a) => (
                <tr
                  key={a.id}
                  className={a.id === seleccionadaId ? 'gp-fila-seleccionada' : ''}
                  onClick={() => setSeleccionadaId(a.id)}
                  onDoubleClick={() => setVista({ tipo: 'editar', actividad: a })}
                >
                  <td>{a.titulo}</td>
                  <td>{fechaCorta(a.inicio)}</td>
                  <td>{a.publicada ? (a.inscripcionesAbiertas ? 'Publicada' : 'Cerrada') : 'Borrador'}</td>
                  <td>{a.inscritos}{a.plazas ? `/${a.plazas}` : ''} · {a.asistentes}✔</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="gp-estado">
        {actividades.length} actividad(es) — 📱 QR abre la pantalla para proyectar en la sala
        <button className="gp-boton-mini gp-actualizar" onClick={recargar} title="Actualizar">🔄</button>
      </div>

      {vista?.tipo === 'qr' && <ProyectorQr actividad={vista.actividad} alCerrar={() => { setVista(null); recargar(); }} />}
    </div>
  );
}
