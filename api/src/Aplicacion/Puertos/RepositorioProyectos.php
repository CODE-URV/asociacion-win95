<?php

declare(strict_types=1);

namespace CodeUrv\Aplicacion\Puertos;

use CodeUrv\Dominio\Proyecto;

interface RepositorioProyectos
{
    /** @return list<Proyecto> */
    public function todos(): array;

    public function buscar(int $id): ?Proyecto;

    /** Inserta (si no tiene id) o actualiza. Devuelve el proyecto con su id. */
    public function guardar(Proyecto $proyecto): Proyecto;

    /** Devuelve false si no existía. */
    public function eliminar(int $id): bool;
}
