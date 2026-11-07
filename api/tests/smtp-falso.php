<?php

declare(strict_types=1);

// Servidor SMTP falso para los tests: acepta UNA conexión, contesta como Gmail y
// guarda en un archivo la conversación y el mensaje recibido.
//   php smtp-falso.php <puerto> <archivo-salida> [contraseña-válida]

[, $puerto, $salida] = $argv;
$contrasenaValida = $argv[3] ?? 'secreta';

$servidor = stream_socket_server("tcp://127.0.0.1:{$puerto}", $codigo, $error);
if ($servidor === false) {
    fwrite(STDERR, $error);
    exit(1);
}
echo "listo\n";
fflush(STDOUT);

$cliente = stream_socket_accept($servidor, 15);
if ($cliente === false) {
    exit(1);
}

$log = [];
$enviar = static function (string $linea) use ($cliente) {
    fwrite($cliente, $linea . "\r\n");
};

$enviar('220 smtp.falso ESMTP');
$esperando = null;
$datos = '';
while (($linea = fgets($cliente)) !== false) {
    if ($esperando === 'datos') {
        if (rtrim($linea, "\r\n") === '.') {
            $esperando = null;
            $enviar('250 2.0.0 OK');
            continue;
        }
        $datos .= $linea;
        continue;
    }

    $linea = rtrim($linea, "\r\n");
    $log[] = $linea;

    if ($esperando === 'usuario') {
        $esperando = 'contrasena';
        $enviar('334 UGFzc3dvcmQ6');
    } elseif ($esperando === 'contrasena') {
        $esperando = null;
        $enviar(base64_decode($linea) === $contrasenaValida ? '235 2.7.0 Accepted' : '535 5.7.8 Username and Password not accepted');
    } elseif (str_starts_with($linea, 'EHLO')) {
        $enviar('250-smtp.falso');
        $enviar('250 AUTH LOGIN');
    } elseif ($linea === 'AUTH LOGIN') {
        $esperando = 'usuario';
        $enviar('334 VXNlcm5hbWU6');
    } elseif (str_starts_with($linea, 'MAIL FROM') || str_starts_with($linea, 'RCPT TO')) {
        $enviar('250 OK');
    } elseif ($linea === 'DATA') {
        $esperando = 'datos';
        $enviar('354 Go ahead');
    } elseif ($linea === 'QUIT') {
        $enviar('221 Bye');
        break;
    } else {
        $enviar('500 ?');
    }
}

file_put_contents($salida, json_encode(['comandos' => $log, 'mensaje' => $datos]));
