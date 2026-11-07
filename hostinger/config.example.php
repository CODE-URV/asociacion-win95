<?php
// Copia este archivo como config.php en la carpeta del dominio en Hostinger,
// FUERA de public_html, y rellena los valores (los mismos que había en Vercel →
// Settings → Environment Variables):
//
//   /home/uXXXX/domains/tudominio.com/config.php      <- aquí
//   /home/uXXXX/domains/tudominio.com/public_html/    <- la web
//
// NUNCA subas config.php al repositorio.
//
// Versión de PHP: usa PHP 8.5 en Hostinger (hPanel → Avanzado → Configuración
// de PHP → Versión de PHP). Es la versión con la que se ha probado la API.
//
// Para probar en local, copia este archivo como config.php en la raíz del repo
// (también está en .gitignore) y ejecuta `npm run preview:php`.

return [
    'GOOGLE_CALENDAR_API_KEY' => '',
    'GOOGLE_CALENDAR_ID'      => '',
    'PROYECTOS_SHEET_URL'     => '',
    'WEB_APP_URL'             => '',
];
