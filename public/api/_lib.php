<?php
// Funciones comunes de la API. No se puede abrir directamente (ver .htaccess).

if (basename($_SERVER['SCRIPT_FILENAME'] ?? '') === basename(__FILE__)) {
    http_response_code(404);
    exit;
}

/**
 * Lee la configuración con las claves.
 * Busca config.php FUERA de public_html (en la carpeta del dominio) para que
 * nunca se pueda descargar desde la web:
 *   /home/uXXXX/domains/tudominio.com/config.php
 *   /home/uXXXX/domains/tudominio.com/public_html/api/_lib.php  <- este archivo
 */
function api_config(string $key): ?string
{
    static $config = null;

    if ($config === null) {
        $config = [];
        $path = dirname(__DIR__, 2) . '/config.php';
        if (is_file($path)) {
            $loaded = require $path;
            if (is_array($loaded)) {
                $config = $loaded;
            }
        }
    }

    $value = $config[$key] ?? getenv($key);
    return ($value === false || $value === '') ? null : (string) $value;
}

function api_json(int $status, $data): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function api_require_method(string $method): void
{
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== $method) {
        header('Allow: ' . $method);
        api_json(405, ['error' => 'Method Not Allowed']);
    }
}

/**
 * Hace una petición HTTP con cURL y devuelve [código de estado, cuerpo].
 * Sigue redirecciones (Google Sheets y Apps Script redirigen siempre).
 */
function api_fetch(string $url, string $method = 'GET', ?string $body = null, array $headers = []): array
{
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_MAXREDIRS => 5,
        CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_TIMEOUT => 25,
        CURLOPT_HTTPHEADER => $headers,
    ]);

    if ($method === 'POST') {
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $body ?? '');
    }

    $response = curl_exec($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    $error = curl_error($ch);
    curl_close($ch);

    if ($response === false) {
        throw new RuntimeException('cURL: ' . $error);
    }

    return [$status, $response];
}
