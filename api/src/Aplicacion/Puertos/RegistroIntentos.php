<?php

declare(strict_types=1);

namespace CodeUrv\Aplicacion\Puertos;

/** Cuenta intentos fallidos de inicio de sesión para frenar ataques de fuerza bruta. */
interface RegistroIntentos
{
    public function fallosDesde(string $clave, int $desdeTimestamp): int;

    public function registrarFallo(string $clave, int $timestamp): void;

    public function limpiar(string $clave): void;
}
