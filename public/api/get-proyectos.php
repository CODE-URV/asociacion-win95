<?php
// GET /api/get-proyectos
// Devuelve el CSV publicado del Google Sheet de proyectos.

require __DIR__ . '/_lib.php';

api_require_method('GET');

$sheetUrl = api_config('PROYECTOS_SHEET_URL');
if (!$sheetUrl) {
    api_json(500, ['error' => 'Server misconfigured: missing SHEET URL']);
}

try {
    [$status, $body] = api_fetch($sheetUrl);
} catch (Throwable $e) {
    error_log('Proxy error (get-proyectos): ' . $e->getMessage());
    api_json(500, ['error' => 'Internal Server Error']);
}

http_response_code($status ?: 502);
header('Content-Type: text/csv; charset=utf-8');
echo $body;
