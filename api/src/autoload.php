<?php

declare(strict_types=1);

// Autocarga PSR-4 mínima: CodeUrv\Dominio\Proyecto -> src/Dominio/Proyecto.php
spl_autoload_register(static function (string $clase): void {
    $prefijo = 'CodeUrv\\';
    if (strncmp($clase, $prefijo, strlen($prefijo)) !== 0) {
        return;
    }
    $ruta = __DIR__ . '/' . str_replace('\\', '/', substr($clase, strlen($prefijo))) . '.php';
    if (is_file($ruta)) {
        require $ruta;
    }
});
