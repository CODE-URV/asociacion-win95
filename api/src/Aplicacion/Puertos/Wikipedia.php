<?php

declare(strict_types=1);

namespace CodeUrv\Aplicacion\Puertos;

/** Lo que la Wiki Race necesita de Wikipedia en español. */
interface Wikipedia
{
    /** Título real del artículo (siguiendo redirecciones), o null si no existe. */
    public function articulo(string $titulo): ?string;

    /**
     * Si el artículo $desde tiene un enlace a $enlace, devuelve el título real del artículo
     * al que lleva (siguiendo redirecciones); si no, null.
     */
    public function seguirEnlace(string $desde, string $enlace): ?string;
}
