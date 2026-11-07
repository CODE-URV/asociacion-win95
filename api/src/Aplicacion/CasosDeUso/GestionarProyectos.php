<?php

declare(strict_types=1);

namespace CodeUrv\Aplicacion\CasosDeUso;

use CodeUrv\Aplicacion\Puertos\RepositorioProyectos;
use CodeUrv\Dominio\NoEncontrado;
use CodeUrv\Dominio\Proyecto;

/** Casos de uso de proyectos: listar (público) y crear/actualizar/eliminar (admin). */
final class GestionarProyectos
{
    public function __construct(private readonly RepositorioProyectos $repositorio)
    {
    }

    /** @return list<Proyecto> */
    public function listar(): array
    {
        return $this->repositorio->todos();
    }

    /** @param array<string, mixed> $datos */
    public function crear(array $datos): Proyecto
    {
        return $this->repositorio->guardar(Proyecto::desdeDatos($datos));
    }

    /** @param array<string, mixed> $datos */
    public function actualizar(int $id, array $datos): Proyecto
    {
        if ($this->repositorio->buscar($id) === null) {
            throw new NoEncontrado('El proyecto no existe.');
        }
        return $this->repositorio->guardar(Proyecto::desdeDatos($datos, $id));
    }

    public function eliminar(int $id): void
    {
        if (!$this->repositorio->eliminar($id)) {
            throw new NoEncontrado('El proyecto no existe.');
        }
    }
}
