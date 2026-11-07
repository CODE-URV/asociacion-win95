<?php

declare(strict_types=1);

// Punto de entrada único de la API: /api/* llega aquí por el .htaccess.

require_once __DIR__ . '/src/autoload.php';

use CodeUrv\Contenedor;
use CodeUrv\Infraestructura\Config;
use CodeUrv\Infraestructura\Sesion\SesionPhp;
use CodeUrv\Presentacion\Http\Peticion;

ini_set('display_errors', '0'); // los errores van al log, nunca a la respuesta

$https = ($_SERVER['HTTPS'] ?? '') === 'on'
    || strtolower($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https';

// En Hostinger: /home/uXXXX/domains/codeurv.com/public_html/api/index.php
//          -> /home/uXXXX/domains/codeurv.com/config.php (fuera de la web)
$config = Config::cargar(dirname(__DIR__, 2) . '/config.php');

$base = rtrim(dirname($_SERVER['SCRIPT_NAME'] ?? '/api/index.php'), '/');

(new Contenedor($config, new SesionPhp($https, $base === '' ? '/' : $base)))
    ->api()
    ->atender(Peticion::desdeGlobales($base))
    ->enviar();
