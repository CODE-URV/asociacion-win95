<?php

declare(strict_types=1);

namespace CodeUrv\Aplicacion\CasosDeUso;

use CodeUrv\Aplicacion\Puertos\Ajustes;

/** Secreto con el que se firman los QR de asistencia. Se genera solo la primera vez. */
final class SecretoAsistencia
{
    public static function obtener(Ajustes $ajustes): string
    {
        return $ajustes->obtenerOCrear('secreto_asistencia', static fn () => bin2hex(random_bytes(32)));
    }
}
