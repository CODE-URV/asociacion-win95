<?php

declare(strict_types=1);

namespace CodeUrv\Aplicacion\CasosDeUso;

use CodeUrv\Aplicacion\CredencialesIncorrectas;
use CodeUrv\Aplicacion\DemasiadosIntentos;
use CodeUrv\Aplicacion\NoAutorizado;
use CodeUrv\Aplicacion\Puertos\RegistroIntentos;
use CodeUrv\Aplicacion\Puertos\RepositorioUsuarios;
use CodeUrv\Aplicacion\Puertos\Sesion;

/** Iniciar y cerrar sesión de administrador, con límite de intentos fallidos. */
final class Autenticacion
{
    public const MAX_FALLOS = 5;
    public const VENTANA_SEGUNDOS = 900; // 15 minutos


    /** @param \Closure(): int $reloj */
    public function __construct(
        private readonly RepositorioUsuarios $usuarios,
        private readonly RegistroIntentos $intentos,
        private readonly Sesion $sesion,
        private readonly \Closure $reloj,
    ) {
    }

    /**
     * @return array{usuario: array{nombre: string}, csrf: string}
     */
    public function iniciarSesion(string $nombre, string $contrasena, string $ip): array
    {
        $nombre = trim($nombre);
        $claves = ['ip:' . $ip, 'usuario:' . mb_strtolower($nombre)];
        $ahora = ($this->reloj)();

        foreach ($claves as $clave) {
            if ($this->intentos->fallosDesde($clave, $ahora - self::VENTANA_SEGUNDOS) >= self::MAX_FALLOS) {
                throw new DemasiadosIntentos('Demasiados intentos. Espera 15 minutos.');
            }
        }

        $usuario = $nombre === '' ? null : $this->usuarios->buscarPorNombre($nombre);
        if ($usuario === null) {
            // Se comprueba igualmente un hash para que la respuesta tarde lo mismo
            // y no revele qué nombres de usuario existen.
            password_verify($contrasena, self::hashFicticio());
            $correcta = false;
        } else {
            $correcta = $usuario->contrasenaCorrecta($contrasena);
        }

        if (!$correcta) {
            foreach ($claves as $clave) {
                $this->intentos->registrarFallo($clave, $ahora);
            }
            throw new CredencialesIncorrectas('Usuario o contraseña incorrectos.');
        }

        foreach ($claves as $clave) {
            $this->intentos->limpiar($clave);
        }

        $csrf = $this->sesion->iniciar($usuario->nombre);
        return ['usuario' => ['nombre' => $usuario->nombre], 'csrf' => $csrf];
    }

    private static function hashFicticio(): string
    {
        static $hash = null;
        return $hash ??= password_hash(bin2hex(random_bytes(16)), PASSWORD_DEFAULT);
    }

    public function cerrarSesion(): void
    {
        $this->sesion->cerrar();
    }

    /** @return array{usuario: array{nombre: string}|null, csrf: string|null} */
    public function sesionActual(): array
    {
        $nombre = $this->sesion->usuarioActual();
        return [
            'usuario' => $nombre === null ? null : ['nombre' => $nombre],
            'csrf' => $nombre === null ? null : $this->sesion->tokenCsrf(),
        ];
    }

    /** Comprueba que hay un administrador y que el token CSRF es el de su sesión. */
    public function exigirAdmin(?string $tokenCsrf, bool $modificaDatos): string
    {
        $nombre = $this->sesion->usuarioActual();
        if ($nombre === null) {
            throw new NoAutorizado('Tienes que iniciar sesión como administrador.');
        }
        if ($modificaDatos) {
            $esperado = $this->sesion->tokenCsrf();
            if ($esperado === null || $tokenCsrf === null || !hash_equals($esperado, $tokenCsrf)) {
                throw new NoAutorizado('La sesión no es válida. Vuelve a iniciar sesión.');
            }
        }
        return $nombre;
    }
}
