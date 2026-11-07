<?php
// POST /api/send-inscripcion  (cuerpo JSON con los datos del formulario)
// Reenvía la inscripción a la Google Apps Script sin exponer su URL.

require __DIR__ . '/_lib.php';

api_require_method('POST');

$webAppUrl = api_config('WEB_APP_URL');
if (!$webAppUrl) {
    api_json(500, ['error' => 'Server misconfigured: missing WEB_APP_URL']);
}

$raw = file_get_contents('php://input', false, null, 0, 20000);
$payload = json_decode($raw ?: '', true);
if (!is_array($payload)) {
    api_json(400, ['error' => 'Invalid JSON body']);
}

try {
    [$status, $body] = api_fetch(
        $webAppUrl,
        'POST',
        json_encode($payload, JSON_UNESCAPED_UNICODE),
        ['Content-Type: application/json']
    );
} catch (Throwable $e) {
    error_log('Proxy error (send-inscripcion): ' . $e->getMessage());
    api_json(500, ['error' => 'Internal Server Error']);
}

$status = $status ?: 502;
$json = json_decode($body, true);

if (json_last_error() === JSON_ERROR_NONE) {
    api_json($status, $json);
}

// Si la respuesta no es JSON, se devuelve tal cual
http_response_code($status);
header('Content-Type: text/plain; charset=utf-8');
echo $body;
