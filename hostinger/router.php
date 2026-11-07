<?php
// Router para probar la web compilada con el servidor integrado de PHP,
// imitando lo que hace public/api/.htaccess en Hostinger (Apache):
//
//   npm run build
//   php -S localhost:8000 -t dist hostinger/router.php
//
// Las claves se leen de config.php en la raíz del repo (está en .gitignore),
// igual que en Hostinger se leen de la carpeta que contiene public_html.

$root = $_SERVER['DOCUMENT_ROOT'];
$path = rawurldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?? '/');

// Bloquea _lib.php como hace el .htaccess
if (preg_match('#^/api/_lib\.php$#', $path)) {
    http_response_code(403);
    echo 'Forbidden';
    return true;
}

// /api/get-calendar -> /api/get-calendar.php
if (preg_match('#^/api/([A-Za-z0-9_-]+)$#', $path, $m) && is_file("$root/api/{$m[1]}.php")) {
    $_SERVER['SCRIPT_FILENAME'] = "$root/api/{$m[1]}.php";
    $_SERVER['SCRIPT_NAME'] = "/api/{$m[1]}.php";
    require $_SERVER['SCRIPT_FILENAME'];
    return true;
}

// Cualquier otro archivo existente se sirve tal cual
return false;
