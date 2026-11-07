<?php

declare(strict_types=1);

namespace CodeUrv\Aplicacion\Puertos;

/** Sesión del administrador en el navegador. */
interface Sesion
{
    /** Nombre del administrador con sesión iniciada, o null. */
    public function usuarioActual(): ?string;

    /** Inicia la sesión y devuelve el token CSRF. */
    public function iniciar(string $nombreUsuario): string;

    public function cerrar(): void;

    /** Token CSRF de la sesión actual, o null si no hay sesión. */
    public function tokenCsrf(): ?string;
}
