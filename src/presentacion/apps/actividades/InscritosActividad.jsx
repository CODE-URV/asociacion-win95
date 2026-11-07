import { useState } from 'react';
import { useInscritos } from '../../../aplicacion/useGestorActividades';
import { csvInscritos } from '../../../dominio/actividad';

function descargarCsv(nombre, contenido) {
  const url = URL.createObjectURL(new Blob([contenido], { type: 'text/csv;charset=utf-8' }));
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombre;
  enlace.click();
  URL.revokeObjectURL(url);
}

/** Lista de inscritos de una actividad, con asistencia manual y exportación a CSV. */
export default function InscritosActividad({ actividad, alVolver }) {
  const { inscritos, cargando, error, recargar, marcarAsistencia, eliminar } = useInscritos(actividad.id);
  const [aviso, setAviso] = useState(null);

  const asistentes = inscritos.filter((i) => i.asistioEn).length;

  const alternar = async (inscripcion) => {
    try {
      await marcarAsistencia(inscripcion.id, !inscripcion.asistioEn);
    } catch (e) {
      setAviso(`No se ha podido cambiar: ${e.message}`);
    }
  };

  const borrar = async (inscripcion) => {
    if (!window.confirm(`¿Quitar a ${inscripcion.nombre} ${inscripcion.apellidos} de la lista?`)) return;
    try {
      await eliminar(inscripcion.id);
    } catch (e) {
      setAviso(`No se ha podido quitar: ${e.message}`);
    }
  };

  const exportar = () => {
    const nombre = `inscritos-${actividad.titulo.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}.csv`;
    descargarCsv(nombre, csvInscritos(inscritos));
  };

  return (
    <div className="gp">
      <div className="gp-barra">
        <button className="win95-boton" onClick={alVolver}>◀ Actividades</button>
        <button className="win95-boton" onClick={recargar}>🔄 Actualizar</button>
        <button className="win95-boton" onClick={exportar} disabled={inscritos.length === 0}>💾 Exportar CSV</button>
      </div>

      <div className="gp-aviso">
        <strong>{actividad.titulo}</strong> — {inscritos.length} inscrito(s), {asistentes} asistente(s)
      </div>
      {aviso && <div className="gp-aviso">{aviso}</div>}

      <div className="gp-tabla-marco">
        {cargando && inscritos.length === 0 && <div className="gp-mensaje">⏳ Cargando...</div>}
        {error && <div className="gp-mensaje gp-error-general">❌ {error}</div>}
        {!cargando && !error && inscritos.length === 0 && <div className="gp-mensaje">Todavía no se ha apuntado nadie.</div>}
        {inscritos.length > 0 && (
          <table className="gp-tabla gp-tabla-inscritos">
            <thead>
              <tr>
                <th title="Asistió">✔</th>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Estudios</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {inscritos.map((i) => (
                <tr key={i.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={Boolean(i.asistioEn)}
                      onChange={() => alternar(i)}
                      aria-label={`Asistencia de ${i.nombre}`}
                    />
                  </td>
                  <td>{i.nombre} {i.apellidos}</td>
                  <td>{i.email}</td>
                  <td title={`${i.grado} · ${i.curso}`}>{i.curso}</td>
                  <td>
                    <button className="gp-boton-mini" onClick={() => borrar(i)} title="Quitar de la lista">✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
