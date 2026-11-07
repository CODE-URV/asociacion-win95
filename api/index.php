<?php

declare(strict_types=1);

// Punto de entrada único de la API: /api/* llega aquí por el .htaccess.

// En Hostinger: /home/uXXXX/domains/codeurv.com/public_html/api/index.php
//          -> /home/uXXXX/domains/codeurv.com/   (fuera de la web: config.php y el log)
$carpetaPrivada = dirname(__DIR__, 2);

// Los errores nunca se muestran al visitante: van a api-errores.log, fuera de public_html
date_default_timezone_set('Europe/Madrid'); // las actividades se guardan en hora local
ini_set('display_errors', '0');
ini_set('log_errors', '1');
if (getenv('CODEURV_CONFIG') === false && is_writable($carpetaPrivada)) {
    ini_set('error_log', $carpetaPrivada . '/api-errores.log');
}

// Si PHP muere con un error fatal, al menos responder JSON en vez de un 500 vacío
register_shutdown_function(static function (): void {
    $error = error_get_last();
    if ($error !== null && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR], true)) {
        if (!headers_sent()) {
            http_response_code(500);
            header('Content-Type: application/json; charset=utf-8');
            header('Cache-Control: no-store');
        }
        echo '{"error":"Error interno del servidor."}';
    }
});

require_once __DIR__ . '/src/autoload.php';

use CodeUrv\Contenedor;
use CodeUrv\Infraestructura\Config;
use CodeUrv\Infraestructura\Sesion\SesionPhp;
use CodeUrv\Presentacion\Http\Peticion;
use CodeUrv\Presentacion\Http\Respuesta;

try {
    $https = ($_SERVER['HTTPS'] ?? '') === 'on'
        || strtolower($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https';

    $config = Config::cargar($carpetaPrivada . '/config.php');

    $base = rtrim(dirname($_SERVER['SCRIPT_NAME'] ?? '/api/index.php'), '/');

    (new Contenedor($config, new SesionPhp($https, $base === '' ? '/' : $base)))
        ->api()
        ->atender(Peticion::desdeGlobales($base))
        ->enviar();
} catch (\Throwable $e) {
    // Errores fuera de la aplicación (p. ej. config.php con un error de sintaxis)
    error_log('[codeurv-api] ' . get_class($e) . ': ' . $e->getMessage() . ' en ' . $e->getFile() . ':' . $e->getLine());
    Respuesta::error(500, 'Error interno del servidor.')->enviar();
}
