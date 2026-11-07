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

/** Lista de inscritos: asistencia manual, CSV y envío de certificados. */
export default function InscritosActividad({ actividad, alVolver }) {
  const { inscritos, cargando, error, recargar, marcarAsistencia, eliminar, enviarCertificados, reenviarCertificado, urlVistaPrevia } =
    useInscritos(actividad.id);
  const [aviso, setAviso] = useState(null);
  const [enviando, setEnviando] = useState(null); // null | { enviados, pendientes }

  const asistentes = inscritos.filter((i) => i.asistioEn).length;
  const pendientes = inscritos.filter((i) => i.asistioEn && !i.certificadoEnviadoEn).length;
  const empezada = new Date(actividad.inicio) <= new Date();

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

  const enviar = async () => {
    if (!window.confirm(`¿Enviar el certificado a ${pendientes} asistente(s)? Revisa antes la lista y la vista previa.`)) return;
    setAviso(null);
    setEnviando({ enviados: 0, pendientes });
    try {
      const { enviados, error: fallo } = await enviarCertificados(setEnviando);
      setAviso(fallo
        ? `⚠️ Enviados ${enviados}. Se ha parado por un error: ${fallo}`
        : `✅ Certificados enviados: ${enviados}.`);
    } catch (e) {
      setAviso(`❌ ${e.message}`);
    } finally {
      setEnviando(null);
    }
  };

  const reenviar = async (inscripcion) => {
    if (!window.confirm(`¿Reenviar el certificado a ${inscripcion.email}?`)) return;
    try {
      await reenviarCertificado(inscripcion.id);
      setAviso(`✅ Certificado reenviado a ${inscripcion.email}.`);
    } catch (e) {
      setAviso(`❌ ${e.message}`);
    }
  };

  const exportar = () => {
    const nombre = `inscritos-${actividad.titulo.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}.csv`;
    descargarCsv(nombre, csvInscritos(inscritos));
  };

  return (
    <div className="gp">
      <div className="gp-barra">
        <button className="win95-boton" onClick={alVolver} disabled={Boolean(enviando)}>◀ Actividades</button>
        <button className="win95-boton" onClick={recargar} disabled={Boolean(enviando)}>🔄</button>
        <button className="win95-boton" onClick={exportar} disabled={inscritos.length === 0}>💾 CSV</button>
        <button className="win95-boton" onClick={() => window.open(urlVistaPrevia(), '_blank')}>
          👁 Vista previa
        </button>
        <button
          className="win95-boton"
          onClick={enviar}
          disabled={!empezada || pendientes === 0 || Boolean(enviando)}
          title={!empezada ? 'Se pueden enviar cuando empiece la actividad' : ''}
        >
          📧 Enviar certificados ({pendientes})
        </button>
      </div>

      <div className="gp-aviso">
        <strong>{actividad.titulo}</strong> — {inscritos.length} inscrito(s), {asistentes} asistente(s),{' '}
        {asistentes - pendientes} certificado(s) enviado(s)
      </div>
      {enviando && (
        <div className="gp-aviso">
          ⏳ Enviando certificados... {enviando.enviados} enviado(s), quedan {enviando.pendientes}. No cierres esta ventana.
        </div>
      )}
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
                <th>Curso</th>
                <th title="Certificado">📧</th>
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
                      disabled={Boolean(enviando)}
                      aria-label={`Asistencia de ${i.nombre}`}
                    />
                  </td>
                  <td>{i.nombre} {i.apellidos}</td>
                  <td>{i.email}</td>
                  <td title={`${i.grado} · ${i.curso}`}>{i.curso}</td>
                  <td>
                    {i.certificadoEnviadoEn ? (
                      <button className="gp-boton-mini" title="Enviado. Pulsa para reenviar" onClick={() => reenviar(i)}>✅</button>
                    ) : i.asistioEn ? (
                      <button className="gp-boton-mini" title="Vista previa de su certificado" onClick={() => window.open(urlVistaPrevia(i.id), '_blank')}>👁</button>
                    ) : null}
                  </td>
                  <td>
                    <button className="gp-boton-mini" onClick={() => borrar(i)} title="Quitar de la lista" disabled={Boolean(enviando)}>✕</button>
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
