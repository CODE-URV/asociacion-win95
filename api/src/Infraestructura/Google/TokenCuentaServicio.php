<?php

declare(strict_types=1);

namespace CodeUrv\Infraestructura\Google;

use CodeUrv\Aplicacion\ServicioNoDisponible;
use CodeUrv\Infraestructura\Http\ClienteHttp;

/**
 * Token de acceso de Google con una cuenta de servicio (OAuth 2.0 "JWT bearer"), sin librerías:
 * se firma un JWT con la clave privada del JSON de la cuenta y se cambia por un token de 1 hora.
 */
final class TokenCuentaServicio
{
    public const PERMISO_CALENDARIO = 'https://www.googleapis.com/auth/calendar.events';

    private ?string $token = null;
    private int $caduca = 0;

    /** @param \Closure(): int $reloj */
    public function __construct(
        private readonly ClienteHttp $http,
        private readonly string $rutaJson,
        private readonly string $permiso = self::PERMISO_CALENDARIO,
        private readonly ?\Closure $reloj = null,
    ) {
    }

    public function obtener(): string
    {
        $ahora = $this->reloj ? ($this->reloj)() : time();
        if ($this->token !== null && $ahora < $this->caduca - 60) {
            return $this->token;
        }

        $cuenta = $this->leerCuenta();
        $jwt = self::crearJwt($cuenta, $this->permiso, $ahora);

        [$estado, $cuerpo] = $this->http->peticion(
            'POST',
            $cuenta['token_uri'],
            ['Content-Type: application/x-www-form-urlencoded'],
            http_build_query(['grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer', 'assertion' => $jwt]),
        );
        $datos = json_decode($cuerpo, true);
        if ($estado !== 200 || !is_string($datos['access_token'] ?? null)) {
            $detalle = is_array($datos) ? ($datos['error_description'] ?? $datos['error'] ?? '') : '';
            throw new ServicioNoDisponible("Google no ha aceptado la cuenta de servicio ({$estado}). {$detalle}");
        }

        $this->token = $datos['access_token'];
        $this->caduca = $ahora + (int) ($datos['expires_in'] ?? 3600);
        return $this->token;
    }

    /** @param array{client_email: string, private_key: string, token_uri: string} $cuenta */
    public static function crearJwt(array $cuenta, string $permiso, int $ahora): string
    {
        $base64url = static fn (string $d) => rtrim(strtr(base64_encode($d), '+/', '-_'), '=');
        $cabecera = $base64url(json_encode(['alg' => 'RS256', 'typ' => 'JWT']));
        $reclamaciones = $base64url(json_encode([
            'iss' => $cuenta['client_email'],
            'scope' => $permiso,
            'aud' => $cuenta['token_uri'],
            'iat' => $ahora,
            'exp' => $ahora + 3600,
        ]));

        if (!openssl_sign("{$cabecera}.{$reclamaciones}", $firma, $cuenta['private_key'], OPENSSL_ALGO_SHA256)) {
            throw new ServicioNoDisponible('La clave privada de la cuenta de servicio de Google no es válida.');
        }
        return "{$cabecera}.{$reclamaciones}." . $base64url($firma);
    }

    /** @return array{client_email: string, private_key: string, token_uri: string} */
    private function leerCuenta(): array
    {
        if ($this->rutaJson === '' || !is_file($this->rutaJson)) {
            throw new ServicioNoDisponible('Falta configurar la cuenta de servicio de Google (GOOGLE_CUENTA_SERVICIO en config.php).');
        }
        $cuenta = json_decode((string) file_get_contents($this->rutaJson), true);
        if (!is_array($cuenta) || !is_string($cuenta['client_email'] ?? null) || !is_string($cuenta['private_key'] ?? null)) {
            throw new ServicioNoDisponible('El archivo de la cuenta de servicio de Google no es válido.');
        }
        return [
            'client_email' => $cuenta['client_email'],
            'private_key' => $cuenta['private_key'],
            'token_uri' => is_string($cuenta['token_uri'] ?? null) ? $cuenta['token_uri'] : 'https://oauth2.googleapis.com/token',
        ];
    }
}
