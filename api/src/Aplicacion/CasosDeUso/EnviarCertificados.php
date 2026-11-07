<?php

declare(strict_types=1);

namespace CodeUrv\Aplicacion\CasosDeUso;

use CodeUrv\Aplicacion\Conflicto;
use CodeUrv\Aplicacion\Puertos\EnviadorCorreo;
use CodeUrv\Aplicacion\Puertos\GeneradorCertificados;
use CodeUrv\Aplicacion\Puertos\RepositorioActividades;
use CodeUrv\Aplicacion\Puertos\RepositorioInscripciones;
use CodeUrv\Aplicacion\ServicioNoDisponible;
use CodeUrv\Dominio\Actividad;
use CodeUrv\Dominio\Certificado;
use CodeUrv\Dominio\InscripcionActividad;
use CodeUrv\Dominio\NoEncontrado;

/**
 * Certificados de asistencia (solo admin): se envían cuando el admin lo decide,
 * a quien tiene la asistencia registrada y aún no lo ha recibido.
 * Se envían por lotes para que cada petición acabe rápido (límite de tiempo de PHP en Hostinger).
 */
final class EnviarCertificados
{
    public const LOTE = 8;

    /** @param \Closure(): \DateTimeImmutable $reloj */
    public function __construct(
        private readonly RepositorioActividades $actividades,
        private readonly RepositorioInscripciones $inscripciones,
        private readonly GeneradorCertificados $generador,
        private readonly EnviadorCorreo $correo,
        private readonly string $presidente,
        private readonly \Closure $reloj,
    ) {
    }

    /**
     * Envía el siguiente lote. Si un envío falla, para (normalmente el fallo es de configuración
     * o de credenciales y fallarían todos) y devuelve el motivo.
     *
     * @return array{enviados: int, pendientes: int, error: string|null}
     */
    public function enviarLote(int $actividadId): array
    {
        $actividad = $this->actividadEmpezada($actividadId);
        $pendientes = $this->pendientes($actividadId);

        $enviados = 0;
        foreach (array_slice($pendientes, 0, self::LOTE) as $inscripcion) {
            try {
                $this->enviarA($inscripcion, $actividad);
                $enviados++;
            } catch (ServicioNoDisponible $e) {
                return ['enviados' => $enviados, 'pendientes' => count($pendientes) - $enviados, 'error' => $e->getMessage()];
            }
        }
        return ['enviados' => $enviados, 'pendientes' => count($pendientes) - $enviados, 'error' => null];
    }

    /** Reenviar a una persona concreta (p. ej. no le llegó o cambió el nombre). */
    public function reenviar(int $actividadId, int $inscripcionId): InscripcionActividad
    {
        $actividad = $this->actividadEmpezada($actividadId);
        $inscripcion = $this->inscripcion($actividadId, $inscripcionId);
        if ($inscripcion->asistioEn === null) {
            throw new Conflicto('Esta persona no tiene la asistencia registrada.');
        }
        try {
            return $this->enviarA($inscripcion, $actividad);
        } catch (ServicioNoDisponible $e) {
            throw new Conflicto('No se ha podido enviar: ' . $e->getMessage());
        }
    }

    /** PDF de muestra para revisarlo antes de enviar (con un asistente o con un nombre de ejemplo). */
    public function vistaPrevia(int $actividadId, ?int $inscripcionId = null): array
    {
        $actividad = $this->actividades->buscar($actividadId) ?? throw new NoEncontrado('La actividad no existe.');
        $nombre = $inscripcionId === null
            ? 'Nom Cognom Cognom'
            : $this->inscripcion($actividadId, $inscripcionId)->nombreCompleto();

        $certificado = new Certificado($nombre, $actividad->titulo, $actividad->tipo, $actividad->inicio, $actividad->ponente, $this->presidente);
        return ['nombre' => $certificado->nombreArchivo(), 'pdf' => $this->generador->generar($certificado)];
    }

    /** @return list<InscripcionActividad> */
    private function pendientes(int $actividadId): array
    {
        return array_values(array_filter(
            $this->inscripciones->deActividad($actividadId),
            static fn (InscripcionActividad $i) => $i->asistioEn !== null && $i->certificadoEnviadoEn === null,
        ));
    }

    private function enviarA(InscripcionActividad $inscripcion, Actividad $actividad): InscripcionActividad
    {
        $certificado = Certificado::para($inscripcion, $actividad, $this->presidente);
        $this->correo->enviar(
            $inscripcion->email,
            $certificado->asuntoCorreo(),
            $certificado->textoCorreo($inscripcion->nombre),
            ['nombre' => $certificado->nombreArchivo(), 'tipo' => 'application/pdf', 'contenido' => $this->generador->generar($certificado)],
        );
        return $this->inscripciones->guardar($inscripcion->conCertificadoEnviado(($this->reloj)()));
    }

    private function actividadEmpezada(int $actividadId): Actividad
    {
        $actividad = $this->actividades->buscar($actividadId) ?? throw new NoEncontrado('La actividad no existe.');
        if (($this->reloj)() < $actividad->inicio) {
            throw new Conflicto('La actividad todavía no ha empezado.');
        }
        return $actividad;
    }

    private function inscripcion(int $actividadId, int $inscripcionId): InscripcionActividad
    {
        $inscripcion = $this->inscripciones->buscar($inscripcionId);
        if ($inscripcion === null || $inscripcion->actividadId !== $actividadId) {
            throw new NoEncontrado('La inscripción no existe.');
        }
        return $inscripcion;
    }
}
