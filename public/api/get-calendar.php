<?php
// GET /api/get-calendar?timeMin=...&timeMax=...
// Devuelve los eventos del Google Calendar de la asociación sin exponer la API key.

require __DIR__ . '/_lib.php';

api_require_method('GET');

$apiKey = api_config('GOOGLE_CALENDAR_API_KEY');
$calendarId = api_config('GOOGLE_CALENDAR_ID');
if (!$apiKey || !$calendarId) {
    api_json(500, ['error' => 'Server misconfigured: missing API key or calendar id']);
}

$params = [
    'key' => $apiKey,
    'singleEvents' => 'true',
    'orderBy' => 'startTime',
];
foreach (['timeMin', 'timeMax'] as $name) {
    if (isset($_GET[$name]) && is_string($_GET[$name]) && $_GET[$name] !== '') {
        $params[$name] = $_GET[$name];
    }
}

$url = 'https://www.googleapis.com/calendar/v3/calendars/' . rawurlencode($calendarId)
    . '/events?' . http_build_query($params);

try {
    [$status, $body] = api_fetch($url);
} catch (Throwable $e) {
    error_log('Proxy error (get-calendar): ' . $e->getMessage());
    api_json(500, ['error' => 'Internal Server Error']);
}

$data = json_decode($body, true);

if ($status < 200 || $status >= 300) {
    api_json($status ?: 502, ['error' => $data['error']['message'] ?? 'Google API error']);
}

http_response_code(200);
header('Content-Type: application/json; charset=utf-8');
echo $body;
