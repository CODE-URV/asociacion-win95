<?php

declare(strict_types=1);

// Configuración y base de datos de DESARROLLO (SQLite). Devuelve el PDO listo para usar.
// Crea config.dev.php en la raíz del repo si no existe (está en .gitignore).

$raiz = dirname(__DIR__, 2);
$rutaConfig = $raiz . '/config.dev.php';

if (!is_file($rutaConfig)) {
    $sqlite = str_replace('\\', '/', $raiz . '/api/dev.sqlite');
    file_put_contents($rutaConfig, <<<PHP
    <?php
    // Configuración de desarrollo (no se sube al repositorio).
    // Para probar eventos e inscripciones reales, rellena las claves de Google.
    return [
        'DB_DSN' => 'sqlite:{$sqlite}',
        'GOOGLE_CALENDAR_API_KEY' => '',
        'GOOGLE_CALENDAR_ID' => '',
        'WEB_APP_URL' => '',
    ];

    PHP);
}

putenv('CODEURV_CONFIG=' . $rutaConfig);

$config = \CodeUrv\Infraestructura\Config::cargar($rutaConfig);
$pdo = \CodeUrv\Infraestructura\BaseDeDatos\ConexionPdo::desdeConfig($config);

if (str_starts_with($config->texto('DB_DSN'), 'sqlite:')) {
    $pdo->exec((string) file_get_contents(__DIR__ . '/../sql/sqlite.sql'));
}

return $pdo;
