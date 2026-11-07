<?php
// Plantilla de config.php. En Hostinger, config.php va en la carpeta del dominio,
// FUERA de public_html, para que nunca se pueda descargar desde la web:
//
//   /home/uXXXX/domains/codeurv.com/config.php      <- aquí
//   /home/uXXXX/domains/codeurv.com/public_html/    <- la web
//
// NUNCA subas config.php al repositorio. Versión de PHP en Hostinger: 8.5.

return [
    // Google Calendar (eventos)
    'GOOGLE_CALENDAR_API_KEY' => '',
    'GOOGLE_CALENDAR_ID'      => '',

    // Google Apps Script que guarda las inscripciones de socios (termina en /exec)
    'WEB_APP_URL'             => '',

    // Base de datos MySQL (hPanel → Bases de datos → Administración)
    'DB_DSN'                  => 'mysql:host=localhost;dbname=u000000000_codeurv;charset=utf8mb4',
    'DB_USUARIO'              => 'u000000000_codeurv',
    'DB_CONTRASENA'           => '',
];
