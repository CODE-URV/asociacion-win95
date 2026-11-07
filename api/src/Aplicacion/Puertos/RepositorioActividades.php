<?php

declare(strict_types=1);

namespace CodeUrv\Aplicacion\Puertos;

use CodeUrv\Dominio\Actividad;

interface RepositorioActividades
{
    /** @return list<Actividad> ordenadas por fecha de inicio */
    public function todas(): array;

    public function buscar(int $id): ?Actividad;

    public function guardar(Actividad $actividad): Actividad;

    /** Borra la actividad y sus inscripciones. false si no existía. */
    public function eliminar(int $id): bool;
}