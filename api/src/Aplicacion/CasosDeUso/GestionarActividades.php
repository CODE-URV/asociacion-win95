<?php

declare(strict_types=1);

namespace CodeUrv\Aplicacion\CasosDeUso;

use CodeUrv\Aplicacion\Puertos\Ajustes;
use CodeUrv\Aplicacion\Puertos\RepositorioActividades;
use CodeUrv\Aplicacion\Puertos\RepositorioInscripciones;
use CodeUrv\Dominio\Actividad;
use CodeUrv\Dominio\CodigoAsistencia;
use CodeUrv\Dominio\InscripcionActividad;
use CodeUrv\Dominio\NoEncontrado;

/** Casos de uso de administración de actividades (solo admin). */
final class GestionarActividades
{
    /** @param \Closure(): \DateTimeImmutable $reloj */
    public function __construct(
        private readonly RepositorioActividades $actividades,
        private readonly RepositorioInscripciones $inscripciones,
        private readonly Ajustes $ajustes,
        private readonly \Closure $reloj,
    ) {
    }

    /** @return list<array{actividad: Actividad, inscritos: int, asistentes: int}> */
    public function listar(): array
    {
        $recuento = $this->inscripciones->recuento();
        return array_map(static fn (Actividad $a) => [
            'actividad' => $a,
            'inscritos' => $recuento[$a->id]['inscritos'] ?? 0,
            'asistentes' => $recuento[$a->id]['asistentes'] ?? 0,
        ], $this->actividades->todas());
    }

    /** @param array<string, mixed> $datos */
    public function crear(array $datos): Actividad
    {
        return $this->actividades->guardar(Actividad::desdeDatos($datos));
    }

    /** @param array<string, mixed> $datos */
    public function actualizar(int $id, array $datos): Actividad
    {
        $this->obtener($id);
        return $this->actividades->guardar(Actividad::desdeDatos($datos, $id));
    }

    public function eliminar(int $id): void
    {
        if (!$this->actividades->eliminar($id)) {
            throw new NoEncontrado('La actividad no existe.');
        }
    }

    /** @return list<InscripcionActividad> */
    public function inscritos(int $actividadId): array
    {
        $this->obtener($actividadId);
        return $this->inscripciones->deActividad($actividadId);
    }

    /** Marcar o desmarcar a mano la asistencia (p. ej. alguien sin móvil). */
    public function marcarAsistencia(int $actividadId, int $inscripcionId, bool $asistio): InscripcionActividad
    {
        $inscripcion = $this->inscripciones->buscar($inscripcionId);
        if ($inscripcion === null || $inscripcion->actividadId !== $actividadId) {
            throw new NoEncontrado('La inscripción no existe.');
        }
        $momento = $asistio ? ($inscripcion->asistioEn ?? ($this->reloj)()) : null;
        return $this->inscripciones->guardar($inscripcion->conAsistencia($momento));
    }

    public function eliminarInscripcion(int $actividadId, int $inscripcionId): void
    {
        $inscripcion = $this->inscripciones->buscar($inscripcionId);
        if ($inscripcion === null || $inscripcion->actividadId !== $actividadId) {
            throw new NoEncontrado('La inscripción no existe.');
        }
        $this->inscripciones->eliminar($inscripcionId);
    }

    /**
     * Código que se muestra en el QR del proyector.
     * @return array{codigo: string, cambiaEn: int, ahora: int}
     */
    public function codigoQr(int $actividadId): array
    {
        $this->obtener($actividadId);
        $ahora = ($this->reloj)()->getTimestamp();
        return [
            'codigo' => CodigoAsistencia::generar(SecretoAsistencia::obtener($this->ajustes), $actividadId, $ahora),
            'cambiaEn' => CodigoAsistencia::cambiaEn($ahora),
            'ahora' => $ahora,
        ];
    }

    private function obtener(int $id): Actividad
    {
        return $this->actividades->buscar($id) ?? throw new NoEncontrado('La actividad no existe.');
    }
}
