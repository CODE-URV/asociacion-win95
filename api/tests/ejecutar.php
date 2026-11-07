<?php

declare(strict_types=1);

// Ejecutor de tests mínimo, sin dependencias: php api/tests/ejecutar.php
// Cada archivo *Test.php devuelve un array ['descripción' => function () { ... }].

require __DIR__ . '/../src/autoload.php';
require __DIR__ . '/soporte.php';

$archivos = glob(__DIR__ . '/*Test.php') ?: [];
$total = 0;
$fallos = [];

foreach ($archivos as $archivo) {
    $tests = require $archivo;
    $grupo = basename($archivo, '.php');
    foreach ($tests as $nombre => $test) {
        $total++;
        try {
            $test();
            echo '.';
        } catch (\Throwable $e) {
            echo 'F';
            $fallos[] = "{$grupo} › {$nombre}\n    " . get_class($e) . ': ' . $e->getMessage()
                . "\n    en " . basename($e->getFile()) . ':' . $e->getLine();
        }
    }
}

echo "\n\n";
foreach ($fallos as $fallo) {
    echo "✗ {$fallo}\n\n";
}
$ok = $total - count($fallos);
echo "{$ok}/{$total} tests correctos\n";
exit($fallos === [] ? 0 : 1);
