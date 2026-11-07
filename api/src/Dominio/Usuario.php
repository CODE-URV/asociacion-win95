<?php

declare(strict_types=1);

namespace CodeUrv\Dominio;

/** Administrador de la web. La contraseña solo se guarda como hash. */
final class Usuario
{
    public function __construct(
        public readonly int $id,
        public readonly string $nombre,
        private readonly string $hashContrasena,
    ) {
    }

    public function contrasenaCorrecta(string $contrasena): bool
    {
        return password_verify($contrasena, $this->hashContrasena);
    }
}
