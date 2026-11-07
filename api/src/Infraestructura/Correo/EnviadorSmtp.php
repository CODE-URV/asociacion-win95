<?php

declare(strict_types=1);

namespace CodeUrv\Infraestructura\Correo;

use CodeUrv\Aplicacion\Puertos\EnviadorCorreo;
use CodeUrv\Aplicacion\ServicioNoDisponible;

/**
 * Envío por SMTP sin librerías. Pensado para la cuenta de Google de la asociación:
 *   SMTP_HOST=smtp.gmail.com, SMTP_PUERTO=465 (SSL) o 587 (STARTTLS),
 *   SMTP_USUARIO=la dirección, SMTP_CONTRASENA=una "contraseña de aplicación" de Google.
 */
final class EnviadorSmtp implements EnviadorCorreo
{
    private const TIEMPO_ESPERA = 20;

    public function __construct(
        private readonly string $servidor,
        private readonly int $puerto,
        private readonly string $usuario,
        private readonly string $contrasena,
        private readonly string $nombreRemitente,
        /** Solo false en tests, contra un servidor SMTP falso local sin TLS */
        private readonly bool $cifrado = true,
    ) {
    }

    public function enviar(string $para, string $asunto, string $texto, ?array $adjunto = null): void
    {
        if ($this->usuario === '' || $this->contrasena === '') {
            throw new ServicioNoDisponible('Falta configurar el correo: SMTP_USUARIO y SMTP_CONTRASENA en config.php.');
        }
        if (filter_var($para, FILTER_VALIDATE_EMAIL) === false || preg_match('/[\r\n<>]/', $para)) {
            throw new ServicioNoDisponible("Dirección de correo no válida: {$para}");
        }

        $mensaje = MensajeMime::construir($this->usuario, $this->nombreRemitente, $para, $asunto, $texto, $adjunto);
        $conexion = $this->conectar();
        try {
            $this->esperar($conexion, 220);
            $this->comando($conexion, 'EHLO codeurv.com', 250);
            if ($this->cifrado && $this->puerto !== 465) {
                $this->comando($conexion, 'STARTTLS', 220);
                if (!stream_socket_enable_crypto($conexion, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
                    throw new ServicioNoDisponible('No se ha podido cifrar la conexión con el servidor de correo.');
                }
                $this->comando($conexion, 'EHLO codeurv.com', 250);
            }
            $this->comando($conexion, 'AUTH LOGIN', 334);
            $this->comando($conexion, base64_encode($this->usuario), 334);
            $this->comando($conexion, base64_encode($this->contrasena), 235, 'El servidor de correo ha rechazado el usuario o la contraseña de aplicación.');
            $this->comando($conexion, "MAIL FROM:<{$this->usuario}>", 250);
            $this->comando($conexion, "RCPT TO:<{$para}>", [250, 251]);
            $this->comando($conexion, 'DATA', 354);
            // Una línea que empieza por "." se duplica (RFC 5321)
            $cuerpo = preg_replace('/^\./m', '..', str_replace(["\r\n", "\n"], ["\n", "\r\n"], $mensaje));
            $this->comando($conexion, $cuerpo . "\r\n.", 250);
            $this->comando($conexion, 'QUIT', 221);
        } finally {
            fclose($conexion);
        }
    }

    /** @return resource */
    private function conectar()
    {
        $direccion = ($this->cifrado && $this->puerto === 465 ? 'ssl://' : 'tcp://') . "{$this->servidor}:{$this->puerto}";
        $conexion = @stream_socket_client($direccion, $codigo, $error, self::TIEMPO_ESPERA);
        if ($conexion === false) {
            throw new ServicioNoDisponible("No se puede conectar con {$this->servidor}:{$this->puerto} ({$error}).");
        }
        stream_set_timeout($conexion, self::TIEMPO_ESPERA);
        return $conexion;
    }

    /**
     * @param resource $conexion
     * @param int|list<int> $esperado
     */
    private function comando($conexion, string $linea, int|array $esperado, ?string $mensajeError = null): void
    {
        fwrite($conexion, $linea . "\r\n");
        $this->esperar($conexion, $esperado, $mensajeError);
    }

    /**
     * @param resource $conexion
     * @param int|list<int> $esperado
     */
    private function esperar($conexion, int|array $esperado, ?string $mensajeError = null): void
    {
        $respuesta = '';
        while (($linea = fgets($conexion, 1024)) !== false) {
            $respuesta .= $linea;
            if (strlen($linea) < 4 || $linea[3] === ' ') {
                break; // última línea de la respuesta ("250 OK" y no "250-...")
            }
        }
        $codigo = (int) substr($respuesta, 0, 3);
        if (!in_array($codigo, (array) $esperado, true)) {
            throw new ServicioNoDisponible($mensajeError ?? ('El servidor de correo respondió: ' . trim($respuesta ?: 'nada (tiempo agotado)')));
        }
    }
}
