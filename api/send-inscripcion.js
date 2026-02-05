export default async function handler(req, res) {
  const allowedOrigins = [
    process.env.ALLOWED_ORIGIN,
    'https://code-urv.github.io',
  ].filter(Boolean);

  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-proxy-secret');

  if (req.method === 'OPTIONS') return res.status(204).end();

  // Protección opcional
  const EXPECTED_SECRET = process.env.PROXY_SECRET;
  const providedSecret = req.headers['x-proxy-secret'];
  if (EXPECTED_SECRET && providedSecret !== EXPECTED_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const WEB_APP_URL = process.env.WEB_APP_URL;
  if (!WEB_APP_URL) return res.status(500).json({ error: 'Server misconfigured: missing WEB_APP_URL' });

  try {
    const r = await fetch(WEB_APP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });

    // Intenta parsear JSON si viene
    const text = await r.text();
    try {
      const json = JSON.parse(text);
      return res.status(r.status).json(json);
    } catch {
      // Si no es JSON, devolvemos texto crudo
      return res.status(r.status).send(text);
    }
  } catch (err) {
    console.error('Proxy error (send-inscripcion):', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}