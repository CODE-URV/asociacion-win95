<?php

declare(strict_types=1);

namespace CodeUrv\Dominio\Olimpiadas;

enum EstadoPrueba: string
{
    /** Solo la ve el admin. */
    case Preparacion = 'preparacion';
    /** Se está jugando: la Wiki Race se puede jugar; los resultados aún no son públicos. */
    case EnCurso = 'en_curso';
    /** Resultados públicos y puntos en el ranking general. */
    case Finalizada = 'finalizada';
}
