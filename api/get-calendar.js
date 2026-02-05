export default async function handler(req, res) {
  // CORS básico (ajusta ALLOWED_ORIGIN en Vercel si quieres limitar)
  const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-proxy-secret');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // Protección opcional por header
  const EXPECTED_SECRET = process.env.PROXY_SECRET;
  const providedSecret = req.headers['x-proxy-secret'];
  if (EXPECTED_SECRET && providedSecret !== EXPECTED_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const API_KEY = process.env.GOOGLE_CALENDAR_API_KEY;
  const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID;
  if (!API_KEY || !CALENDAR_ID) {
    return res.status(500).json({ error: 'Server misconfigured: missing API key or calendar id' });
  }

  const { timeMin, timeMax } = req.query;

  try {
    const url = new URL(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDAR_ID)}/events`);
    url.searchParams.set('key', API_KEY);
    url.searchParams.set('singleEvents', 'true');
    url.searchParams.set('orderBy', 'startTime');
    if (timeMin) url.searchParams.set('timeMin', timeMin);
    if (timeMax) url.searchParams.set('timeMax', timeMax);

    const r = await fetch(url.toString());
    const data = await r.json();

    if (!r.ok) {
      return res.status(r.status).json({ error: data?.error?.message || 'Google API error' });
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error('Proxy error (get-calendar):', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}