import { useState } from 'react';
import './Eventos.css';
import { DIAS_SEMANA, MESES, celdasDelMes, claveDeFecha, horaDelEvento } from '../../../dominio/calendario';
import useEventosDelMes from '../../../aplicacion/useEventosDelMes';

function Eventos() {
  const hoy = new Date();
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [mes, setMes] = useState(hoy.getMonth());
  const [diaSeleccionado, setDiaSeleccionado] = useState(null);
  const [eventoAbierto, setEventoAbierto] = useState(null);

  const { cargando, error, eventosPorDia } = useEventosDelMes(anio, mes);
  const claveHoy = claveDeFecha(hoy);

  const irA = (nuevoAnio, nuevoMes) => {
    setAnio(nuevoAnio);
    setMes(nuevoMes);
    setDiaSeleccionado(null);
    setEventoAbierto(null);
  };

  if (cargando) {
    return (
      <div className="eventos-win95">
        <div className="date-picker-header">Calendario de Eventos</div>
        <div className="eventos-msg">⏳ Cargando calendario...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="eventos-win95">
        <div className="date-picker-header">Calendario de Eventos</div>
        <div className="eventos-msg error-msg">❌ {error}</div>
      </div>
    );
  }

  const eventosDelDia = diaSeleccionado ? eventosPorDia[diaSeleccionado] : null;

  return (
    <div className="eventos-win95">
      <div className="date-picker-header">Calendario de Eventos</div>

      <div className="date-picker-controls">
        <div className="control-group">
          <select
            className="win95-select"
            value={mes}
            onChange={(e) => irA(anio, Number(e.target.value))}
          >
            {MESES.map((nombre, i) => (
              <option key={nombre} value={i}>{nombre}</option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <input type="text" className="win95-input" value={anio} readOnly />
          <div className="year-spinner">
            <button className="spinner-btn" onClick={() => irA(anio + 1, mes)}>▲</button>
            <button className="spinner-btn" onClick={() => irA(anio - 1, mes)}>▼</button>
          </div>
        </div>
      </div>

      <div className="calendar-container">
        <div className="calendar-weekdays">
          {DIAS_SEMANA.map((d) => (
            <div key={d} className="weekday-header">{d}</div>
          ))}
        </div>

        <div className="calendar-grid-win95">
          {celdasDelMes(anio, mes).map((celda, i) => {
            if (!celda) return <div key={`hueco-${i}`} className="calendar-day empty" />;

            const tieneEventos = Boolean(eventosPorDia[celda.clave]?.length);
            const seleccionado = diaSeleccionado === celda.clave;
            const clases = [
              'calendar-day',
              tieneEventos && 'has-events',
              seleccionado && 'selected',
              celda.clave === claveHoy && 'today',
            ].filter(Boolean).join(' ');

            return (
              <div
                key={celda.clave}
                className={clases}
                onClick={() => {
                  setDiaSeleccionado(seleccionado ? null : celda.clave);
                  setEventoAbierto(null);
                }}
              >
                {celda.dia}
              </div>
            );
          })}
        </div>
      </div>

      {eventosDelDia && (
        <div className="events-panel">
          <div className="events-panel-header">
            📅 {new Date(`${diaSeleccionado}T00:00:00`).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
          </div>
          <div className="events-list-panel">
            {eventosDelDia.map((evento) => (
              <div key={evento.id} className="event-card-wrapper">
                <div className="event-card">
                  <div className="event-card-time">{horaDelEvento(evento) ?? '⏰'}</div>
                  <div className="event-card-content">
                    <div className="event-card-title">{evento.titulo}</div>
                    {evento.lugar && <div className="event-card-location">📍 {evento.lugar}</div>}
                  </div>
                  <button
                    className="event-card-btn"
                    onClick={() => setEventoAbierto(eventoAbierto === evento.id ? null : evento.id)}
                  >
                    {eventoAbierto === evento.id ? 'Ocultar' : 'Ver'}
                  </button>
                </div>

                {eventoAbierto === evento.id && (
                  <div className="event-description-expanded">
                    <div className="event-description-content">
                      {evento.descripcion ? (
                        <>
                          <strong>📝 Descripción:</strong>
                          <p>{evento.descripcion}</p>
                        </>
                      ) : (
                        <em>No hay descripción disponible para este evento.</em>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Eventos;
