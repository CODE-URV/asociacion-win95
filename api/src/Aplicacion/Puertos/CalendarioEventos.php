<?php

declare(strict_types=1);

namespace CodeUrv\Aplicacion\Puertos;

use CodeUrv\Dominio\Evento;

interface CalendarioEventos
{
    /** @return list<Evento> */
    public function entre(\DateTimeImmutable $desde, \DateTimeImmutable $hasta): array;
}
