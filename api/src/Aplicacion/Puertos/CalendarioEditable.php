<?php

declare(strict_types=1);

namespace CodeUrv\Aplicacion\Puertos;

use CodeUrv\Dominio\Evento;

/** Calendario de la asociación con permiso de escritura (Panel de control). */
interface CalendarioEditable
{
    /** @return list<Evento> con su id */
    public function entre(\DateTimeImmutable $desde, \DateTimeImmutable $hasta): array;

    /** Devuelve el evento con el id asignado por el calendario. */
    public function crear(Evento $evento): Evento;

    public function actualizar(Evento $evento): Evento;

    /** No falla si el evento ya no existía. */
    public function eliminar(string $id): void;
}
