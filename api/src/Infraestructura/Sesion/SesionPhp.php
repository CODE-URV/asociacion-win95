<?php

declare(strict_types=1);

namespace CodeUrv\Infraestructura\Sesion;

use CodeUrv\Aplicacion\Puertos\Sesion;

/**
 * Sesión con las sesiones nativas de PHP. La cookie es httpOnly, SameSite=Strict,
 * Secure en HTTPS y solo se envía a /api. A los invitados no se les crea cookie.
 */
final class SesionPhp implements Sesion
{
    private const NOMBRE_COOKIE = 'codeurv_sesion';
    private const DURACION_MAXIMA = 8 * 3600;

    public function __construct(private readonly bool $https, private readonly string $rutaCookie = '/api')
    {
    }

    public function usuarioActual(): ?string
    {
        if (!$this->reanudar()) {
            return null;
        }
        $usuario = $_SESSION['usuario'] ?? null;
        $inicio = $_SESSION['inicio'] ?? 0;
        if (!is_string($usuario) || time() - (int) $inicio > self::DURACION_MAXIMA) {
            $this->cerrar();
            return null;
        }
        return $usuario;
    }

    public function iniciar(string $nombreUsuario): string
    {
        $this->arrancar();
        session_regenerate_id(true); // evita fijación de sesión
        $_SESSION = [
            'usuario' => $nombreUsuario,
            'inicio' => time(),
            'csrf' => bin2hex(random_bytes(32)),
        ];
        return $_SESSION['csrf'];
    }

    public function cerrar(): void
    {
        if (!$this->reanudar()) {
            return;
        }
        $_SESSION = [];
        session_destroy();
        setcookie(self::NOMBRE_COOKIE, '', $this->opcionesCookie(time() - 3600));
    }

    public function tokenCsrf(): ?string
    {
        if (!$this->reanudar()) {
            return null;
        }
        $token = $_SESSION['csrf'] ?? null;
        return is_string($token) ? $token : null;
    }

    /** Reanuda la sesión solo si el navegador ya trae la cookie. */
    private function reanudar(): bool
    {
        if (session_status() === PHP_SESSION_ACTIVE) {
            return true;
        }
        if (!isset($_COOKIE[self::NOMBRE_COOKIE])) {
            return false;
        }
        $this->arrancar();
        return true;
    }

    private function arrancar(): void
    {
        if (session_status() === PHP_SESSION_ACTIVE) {
            return;
        }
        session_name(self::NOMBRE_COOKIE);
        session_set_cookie_params($this->opcionesCookie(0));
        session_start([
            'use_strict_mode' => true,
            'use_only_cookies' => true,
            'cookie_httponly' => true,
        ]);
    }

    /** @return array<string, mixed> */
    private function opcionesCookie(int $expira): array
    {
        $opciones = [
            'path' => $this->rutaCookie,
            'secure' => $this->https,
            'httponly' => true,
            'samesite' => 'Strict',
        ];
        // session_set_cookie_params usa "lifetime"; setcookie usa "expires"
        return $expira === 0 ? ['lifetime' => 0] + $opciones : ['expires' => $expira] + $opciones;
    }
}
