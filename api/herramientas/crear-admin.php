<?php

declare(strict_types=1);

// Crea la cuenta de administrador.
//
//   php api/herramientas/crear-admin.php <usuario>          → imprime el SQL para phpMyAdmin (producción)
//   php api/herramientas/crear-admin.php <usuario> --dev    → la guarda en la base de datos local (dev.sqlite)
//
// Pide la contraseña por teclado; si la dejas vacía genera una aleatoria y la muestra UNA vez.

if (PHP_SAPI !== 'cli') {
    exit(1);
}

$usuario = $argv[1] ?? '';
$enDev = in_array('--dev', $argv, true);

if (!preg_match('/^[A-Za-z0-9._-]{3,60}$/', $usuario) || strcasecmp($usuario, 'invitado') === 0) {
    fwrite(STDERR, "Uso: php api/herramientas/crear-admin.php <usuario> [--dev]\n");
    fwrite(STDERR, "El usuario debe tener 3-60 caracteres (letras, números, . _ -) y no puede ser \"Invitado\".\n");
    exit(1);
}

fwrite(STDOUT, 'Contraseña (mínimo 12 caracteres; vacío = generar una): ');
// PowerShell en Windows puede anteponer un BOM UTF-8 al texto que se le pasa por tubería
$contrasena = trim(preg_replace('/^\xEF\xBB\xBF/', '', (string) fgets(STDIN)));
$generada = false;
if ($contrasena === '') {
    $alfabeto = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#%*-_';
    for ($i = 0; $i < 20; $i++) {
        $contrasena .= $alfabeto[random_int(0, strlen($alfabeto) - 1)];
    }
    $generada = true;
} elseif (strlen($contrasena) < 12) {
    fwrite(STDERR, "La contraseña debe tener al menos 12 caracteres.\n");
    exit(1);
}

$hash = password_hash($contrasena, PASSWORD_DEFAULT);

if ($enDev) {
    require __DIR__ . '/../src/autoload.php';
    $pdo = require __DIR__ . '/base-dev.php';
    $pdo->prepare('DELETE FROM usuarios WHERE nombre = ?')->execute([$usuario]);
    $pdo->prepare('INSERT INTO usuarios (nombre, hash_contrasena) VALUES (?, ?)')->execute([$usuario, $hash]);
    fwrite(STDOUT, "\nAdministrador \"{$usuario}\" guardado en la base de datos local.\n");
} else {
    fwrite(STDOUT, "\nEjecuta esto en phpMyAdmin (pestaña SQL) sobre la base de datos de la web:\n\n");
    fwrite(STDOUT, "DELETE FROM usuarios;\n");
    fwrite(STDOUT, "INSERT INTO usuarios (nombre, hash_contrasena) VALUES ('{$usuario}', '{$hash}');\n\n");
    fwrite(STDOUT, "(El DELETE borra la cuenta anterior: solo hay un administrador.)\n");
}

if ($generada) {
    fwrite(STDOUT, "\nContraseña generada (guárdala en un gestor de contraseñas, no se vuelve a mostrar):\n{$contrasena}\n");
}
