// src/lib/api.js
// Único punto que habla con el backend. Los componentes llaman a estas
// funciones y reciben datos ya listos; no conocen URLs ni hacen fetch.

import { API_BASE } from './config';

// --- Eventos (Google Calendar) ---
export async function getEventos(timeMin, timeMax) {
  const url = `${API_BASE}/api/get-calendar?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}`;

  const response = await fetch(url);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.message || `Error ${response.status}`);
  }

  return data.items || [];
}

// --- Proyectos (Google Sheets en CSV) ---
export async function getProyectos() {
  const response = await fetch(`${API_BASE}/api/get-proyectos`);

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err?.error || `Error ${response.status}`);
  }

  const text = await response.text();
  return parseProyectosCSV(text);
}

// El parser de CSV que estaba dentro de Proyectos.jsx, movido aquí.
function parseProyectosCSV(text) {
  const rows = text.split(/\r?\n/).filter((row) => row.trim() !== '').slice(1);

  return rows
    .map((row) => {
      const cols = parseCSVLine(row);
      const clean = (val) => val?.replace(/^"|"$/g, '').trim();

      return {
        id: clean(cols[0]),
        nombre: clean(cols[1]),
        descripcion: clean(cols[2]),
        responsable: clean(cols[3]),
        email: clean(cols[4]),
        estado: clean(cols[5]),
        progreso: clean(cols[6]),
        tecnologias: clean(cols[7])?.split('|').map((t) => t.trim()).filter(Boolean) || [],
        repositorio: clean(cols[8]),
        colaboradores: clean(cols[9])?.split('|').map((c) => c.trim()).filter(Boolean) || [],
      };
    })
    .filter((p) => p.nombre);
}

function parseCSVLine(line) {
  const result = [];
  let cur = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(cur.trim());
      cur = '';
    } else {
      cur += char;
    }
  }
  result.push(cur.trim());
  return result;
}