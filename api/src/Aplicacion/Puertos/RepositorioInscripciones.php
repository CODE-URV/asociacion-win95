<?php

declare(strict_types=1);

namespace CodeUrv\Aplicacion\Puertos;

use CodeUrv\Dominio\InscripcionActividad;

interface RepositorioInscripciones
{
    /** @return list<InscripcionActividad> */
    public function deActividad(int $actividadId): array;

    /** @return array<int, array{inscritos: int, asistentes: int}> por id de actividad */
    public function recuento(): array;

    public function buscar(int $id): ?InscripcionActividad;

    public function buscarPorEmail(int $actividadId, string $email): ?InscripcionActividad;

    public function buscarPorCodigo(string $codigo): ?InscripcionActividad;

    public function guardar(InscripcionActividad $inscripcion): InscripcionActividad;

    public function eliminar(int $id): bool;
}