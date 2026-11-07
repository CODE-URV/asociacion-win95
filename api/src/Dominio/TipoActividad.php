<?php

declare(strict_types=1);

namespace CodeUrv\Dominio;

enum TipoActividad: string
{
    case Charla = 'Charla';
    case Taller = 'Taller';
    case Otro = 'Otro';
}
