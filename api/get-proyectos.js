// api/get-proyectos.js
export default async function handler(req, res) {
  const allowedOrigins = [
    process.env.ALLOWED_ORIGIN,
    'https://code-urv.github.io',
  ].filter(Boolean);

  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-proxy-secret');

  if (req.method === 'OPTIONS') return res.status(204).end();

  // Optional proxy secret protection
  const EXPECTED_SECRET = process.env.PROXY_SECRET;
  const providedSecret = req.headers['x-proxy-secret'];
  if (EXPECTED_SECRET && providedSecret !== EXPECTED_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const SHEET_URL = process.env.PROYECTOS_SHEET_URL;
  if (!SHEET_URL) return res.status(500).json({ error: 'Server misconfigured: missing SHEET URL' });

  try {
    const r = await fetch(SHEET_URL);
    if (!r.ok) {
      const txt = await r.text();
      return res.status(r.status).send(txt);
    }
    const csv = await r.text();
    return res.status(200).send(csv);
  } catch (err) {
    console.error('Proxy error (get-proyectos):', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}