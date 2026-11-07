<?php

declare(strict_types=1);

namespace CodeUrv\Aplicacion\CasosDeUso;

use CodeUrv\Aplicacion\Puertos\Ajustes;
use CodeUrv\Aplicacion\Puertos\CalendarioEditable;
use CodeUrv\Aplicacion\ServicioNoDisponible;
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
        private readonly ?CalendarioEditable $calendario = null,
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

    /**
     * La actividad se guarda siempre; si falla el calendario se devuelve un aviso.
     * @param array<string, mixed> $datos
     * @return array{actividad: Actividad, aviso: string|null}
     */
    public function crear(array $datos): array
    {
        return $this->sincronizarCalendario($this->actividades->guardar(Actividad::desdeDatos($datos)));
    }

    /**
     * @param array<string, mixed> $datos
     * @return array{actividad: Actividad, aviso: string|null}
     */
    public function actualizar(int $id, array $datos): array
    {
        $anterior = $this->obtener($id);
        $actividad = Actividad::desdeDatos($datos, $id, $anterior->eventoCalendarioId);
        return $this->sincronizarCalendario($this->actividades->guardar($actividad));
    }

    /** @return string|null aviso si no se ha podido quitar del calendario */
    public function eliminar(int $id): ?string
    {
        $actividad = $this->obtener($id);
        $aviso = null;
        if ($actividad->eventoCalendarioId !== null && $this->calendario !== null) {
            try {
                $this->calendario->eliminar($actividad->eventoCalendarioId);
            } catch (ServicioNoDisponible $e) {
                $aviso = 'La actividad se ha eliminado, pero no se ha podido quitar del calendario: ' . $e->getMessage();
            }
        }
        $this->actividades->eliminar($id);
        return $aviso;
    }

    /**
     * Pone, actualiza o quita el evento de Google Calendar según la actividad
     * (solo si está publicada y marcada "en el calendario").
     * @return array{actividad: Actividad, aviso: string|null}
     */
    private function sincronizarCalendario(Actividad $actividad): array
    {
        $debeEstar = $actividad->debeEstarEnCalendario();
        $esta = $actividad->eventoCalendarioId !== null;
        if (!$debeEstar && !$esta) {
            return ['actividad' => $actividad, 'aviso' => null];
        }
        if ($this->calendario === null) {
            return ['actividad' => $actividad, 'aviso' => 'El calendario no está configurado.'];
        }

        try {
            if ($debeEstar && $esta) {
                $this->calendario->actualizar($actividad->aEvento());
                return ['actividad' => $actividad, 'aviso' => null];
            }
            if ($debeEstar) {
                $evento = $this->calendario->crear($actividad->aEvento());
                return ['actividad' => $this->actividades->guardar($actividad->conEventoCalendario($evento->id)), 'aviso' => null];
            }
            $this->calendario->eliminar((string) $actividad->eventoCalendarioId);
            return ['actividad' => $this->actividades->guardar($actividad->conEventoCalendario(null)), 'aviso' => null];
        } catch (ServicioNoDisponible $e) {
            return [
                'actividad' => $actividad,
                'aviso' => 'La actividad se ha guardado, pero el calendario no se ha podido actualizar: ' . $e->getMessage(),
            ];
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
