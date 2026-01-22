import React, { useState, useEffect } from 'react';
import './Eventos.css';

const API_KEY = import.meta.env.VITE_GOOGLE_CALENDAR_API_KEY;
const CALENDAR_ID = import.meta.env.VITE_GOOGLE_CALENDAR_ID;

function Eventos() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [eventsByDay, setEventsByDay] = useState({});
  const [selectedDay, setSelectedDay] = useState(null);
  const [expandedEventId, setExpandedEventId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  useEffect(() => {
    fetchMonthEvents();
  }, [currentDate]);

  const fetchMonthEvents = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();

      const startOfMonth = new Date(year, month, 1).toISOString();
      const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

      const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
        CALENDAR_ID
      )}/events?key=${API_KEY}&timeMin=${startOfMonth}&timeMax=${endOfMonth}&singleEvents=true&orderBy=startTime`;

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error?.message || `Error ${response.status}`);
      }

      const map = {};
      (data.items || []).forEach(ev => {
        const dateStr = (ev.start.dateTime || ev.start.date).split('T')[0];
        if (!map[dateStr]) map[dateStr] = [];
        map[dateStr].push(ev);
      });

      setEventsByDay(map);
    } catch (err) {
      console.error('Error cargando eventos:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const changeMonth = (delta) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + delta);
    setCurrentDate(newDate);
    setSelectedDay(null);
    setExpandedEventId(null);
  };

  const changeYear = (delta) => {
    const newDate = new Date(currentDate);
    newDate.setFullYear(newDate.getFullYear() + delta);
    setCurrentDate(newDate);
    setSelectedDay(null);
    setExpandedEventId(null);
  };

  const getDaysInMonth = () => {
    return new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = () => {
    const day = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
    return day === 0 ? 6 : day - 1;
  };

  const isToday = (dateKey) => {
    const today = new Date();
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    return dateKey === todayKey;
  };

  const toggleEventDetails = (eventId) => {
    setExpandedEventId(expandedEventId === eventId ? null : eventId);
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth();
    const firstDay = getFirstDayOfMonth();
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const hasEvents = eventsByDay[dateKey] && eventsByDay[dateKey].length > 0;
      const isSelected = selectedDay === dateKey;
      const today = isToday(dateKey);

      days.push(
        <div
          key={day}
          className={`calendar-day ${hasEvents ? 'has-events' : ''} ${isSelected ? 'selected' : ''} ${today ? 'today' : ''}`}
          onClick={() => {
            setSelectedDay(isSelected ? null : dateKey);
            setExpandedEventId(null);
          }}
        >
          {day}
        </div>
      );
    }

    return days;
  };

  if (loading) {
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

  return (
    <div className="eventos-win95">
      {/* Header estilo Win95 */}
      <div className="date-picker-header">Calendario de Eventos</div>

      {/* Selectores de mes y año */}
      <div className="date-picker-controls">
        <div className="control-group">
          <select 
            className="win95-select"
            value={currentDate.getMonth()}
            onChange={(e) => {
              const newDate = new Date(currentDate);
              newDate.setMonth(parseInt(e.target.value));
              setCurrentDate(newDate);
              setSelectedDay(null);
              setExpandedEventId(null);
            }}
          >
            {months.map((m, i) => (
              <option key={i} value={i}>{m}</option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <input 
            type="text" 
            className="win95-input"
            value={currentDate.getFullYear()}
            readOnly
          />
          <div className="year-spinner">
            <button className="spinner-btn" onClick={() => changeYear(1)}>▲</button>
            <button className="spinner-btn" onClick={() => changeYear(-1)}>▼</button>
          </div>
        </div>
      </div>

      {/* Calendario */}
      <div className="calendar-container">
        <div className="calendar-weekdays">
          {['D', 'L', 'M', 'X', 'J', 'V', 'S'].map(d => (
            <div key={d} className="weekday-header">{d}</div>
          ))}
        </div>

        <div className="calendar-grid-win95">
          {renderCalendar()}
        </div>
      </div>

      {/* Panel de eventos expandido */}
      {selectedDay && eventsByDay[selectedDay] && (
        <div className="events-panel">
          <div className="events-panel-header">
            📅 {new Date(selectedDay + 'T00:00:00').toLocaleDateString('es', { 
              day: 'numeric', 
              month: 'long'
            })}
          </div>
          <div className="events-list-panel">
            {eventsByDay[selectedDay].map(ev => (
              <div key={ev.id} className="event-card-wrapper">
                <div className="event-card">
                  <div className="event-card-time">
                    {ev.start.dateTime 
                      ? new Date(ev.start.dateTime).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
                      : '⏰'}
                  </div>
                  <div className="event-card-content">
                    <div className="event-card-title">{ev.summary}</div>
                    {ev.location && <div className="event-card-location">📍 {ev.location}</div>}
                  </div>
                  <button 
                    className="event-card-btn" 
                    onClick={() => toggleEventDetails(ev.id)}
                  >
                    {expandedEventId === ev.id ? 'Ocultar' : 'Ver'}
                  </button>
                </div>
                
                {/* Descripción expandida */}
                {expandedEventId === ev.id && (
                  <div className="event-description-expanded">
                    {ev.description ? (
                      <div className="event-description-content">
                        <strong>📝 Descripción:</strong>
                        <p>{ev.description}</p>
                      </div>
                    ) : (
                      <div className="event-description-content">
                        <em>No hay descripción disponible para este evento.</em>
                      </div>
                    )}
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