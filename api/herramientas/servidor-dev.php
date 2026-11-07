<?php

declare(strict_types=1);

// Router para el servidor integrado de PHP en DESARROLLO. Imita el .htaccess de Hostinger:
// todo /api/* va a api/index.php y el resto se sirve como archivo estático.
//
//   npm run api            → solo la API en http://localhost:8000 (con `npm run dev` delante)
//   npm run preview:php    → la web compilada (dist/) + la API en http://localhost:8000

$ruta = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';

if ($ruta === '/api' || str_starts_with($ruta, '/api/')) {
    require __DIR__ . '/../src/autoload.php';
    require __DIR__ . '/base-dev.php'; // crea config.dev.php y la base SQLite si faltan

    $_SERVER['SCRIPT_NAME'] = '/api/index.php';
    require __DIR__ . '/../index.php';
    return true;
}

return false; // archivo estático (dist/) o 404
