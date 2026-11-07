<?php

declare(strict_types=1);

namespace CodeUrv\Aplicacion\CasosDeUso;

use CodeUrv\Aplicacion\AccesoDenegado;
use CodeUrv\Aplicacion\Conflicto;
use CodeUrv\Aplicacion\Puertos\Ajustes;
use CodeUrv\Aplicacion\Puertos\RepositorioActividades;
use CodeUrv\Aplicacion\Puertos\RepositorioInscripciones;
use CodeUrv\Dominio\Actividad;
use CodeUrv\Dominio\CodigoAsistencia;
use CodeUrv\Dominio\InscripcionActividad;
use CodeUrv\Dominio\NoEncontrado;

/** Casos de uso públicos: ver actividades, apuntarse y registrar la asistencia con el QR. */
final class ParticiparEnActividades
{
    /** Las actividades terminadas se siguen mostrando unos días. */
    private const DIAS_VISIBLE_TRAS_TERMINAR = 30;

    /**
     * @param \Closure(): \DateTimeImmutable $reloj
     * @param \Closure(): string $generarCodigo  código público del certificado
     */
    public function __construct(
        private readonly RepositorioActividades $actividades,
        private readonly RepositorioInscripciones $inscripciones,
        private readonly Ajustes $ajustes,
        private readonly \Closure $reloj,
        private readonly \Closure $generarCodigo,
    ) {
    }

    /** @return list<array{actividad: Actividad, plazasLibres: int|null, motivoCerrada: string|null, terminada: bool}> */
    public function listarPublicas(): array
    {
        $ahora = ($this->reloj)();
        $limite = $ahora->modify('-' . self::DIAS_VISIBLE_TRAS_TERMINAR . ' days');
        $recuento = $this->inscripciones->recuento();

        $visibles = array_filter(
            $this->actividades->todas(),
            static fn (Actividad $a) => $a->publicada && $a->fin >= $limite,
        );

        return array_values(array_map(static function (Actividad $a) use ($ahora, $recuento) {
            $inscritos = $recuento[$a->id]['inscritos'] ?? 0;
            return [
                'actividad' => $a,
                'plazasLibres' => $a->plazas === null ? null : max(0, $a->plazas - $inscritos),
                'motivoCerrada' => $a->motivoInscripcionCerrada($ahora, $inscritos),
                'terminada' => $ahora >= $a->fin,
            ];
        }, $visibles));
    }

    /** @param array<string, mixed> $datos */
    public function inscribirse(int $actividadId, array $datos): InscripcionActividad
    {
        $actividad = $this->publicada($actividadId);
        $ahora = ($this->reloj)();

        $motivo = $actividad->motivoInscripcionCerrada($ahora, count($this->inscripciones->deActividad($actividadId)));
        if ($motivo !== null) {
            throw new Conflicto($motivo);
        }

        $nueva = InscripcionActividad::nueva($actividadId, $datos, ($this->generarCodigo)(), $ahora);
        if ($this->inscripciones->buscarPorEmail($actividadId, $nueva->email) !== null) {
            throw new Conflicto('Ya estás inscrito en esta actividad con este correo.');
        }
        return $this->inscripciones->guardar($nueva);
    }

    /** Paso 1 al escanear el QR: cambia el código (válido ~1 min) por un pase de 15 min. */
    public function obtenerPase(int $actividadId, string $codigo): string
    {
        $actividad = $this->publicada($actividadId);
        $ahora = ($this->reloj)();

        if (!$actividad->admiteAsistencia($ahora)) {
            throw new AccesoDenegado('Ahora no se puede registrar la asistencia a esta actividad.');
        }
        $secreto = SecretoAsistencia::obtener($this->ajustes);
        if (!CodigoAsistencia::esValido($secreto, $actividadId, $codigo, $ahora->getTimestamp())) {
            throw new AccesoDenegado('El código QR ha caducado. Vuelve a escanearlo.');
        }
        return CodigoAsistencia::crearPase($secreto, $actividadId, $ahora->getTimestamp());
    }

    /**
     * Paso 2: registrar la asistencia con el correo. Si no estaba inscrito y manda sus datos,
     * se le inscribe en el momento.
     * @param array<string, mixed> $datos  email (+ nombre, apellidos, grado, curso... si no estaba inscrito)
     * @return array{inscripcion: InscripcionActividad|null, yaRegistrada: bool, requiereDatos: bool}
     */
    public function registrarAsistencia(int $actividadId, string $pase, array $datos): array
    {
        $actividad = $this->publicada($actividadId);
        $ahora = ($this->reloj)();

        if (!CodigoAsistencia::paseValido(SecretoAsistencia::obtener($this->ajustes), $actividadId, $pase, $ahora->getTimestamp())) {
            throw new AccesoDenegado('Ha pasado demasiado tiempo. Vuelve a escanear el QR.');
        }
        if (!$actividad->admiteAsistencia($ahora)) {
            throw new AccesoDenegado('Ahora no se puede registrar la asistencia a esta actividad.');
        }

        $email = InscripcionActividad::normalizarEmail(is_string($datos['email'] ?? null) ? $datos['email'] : '');
        $inscripcion = $this->inscripciones->buscarPorEmail($actividadId, $email);

        if ($inscripcion === null) {
            if (!isset($datos['nombre'])) {
                // No estaba inscrito: el formulario pedirá el resto de datos
                return ['inscripcion' => null, 'yaRegistrada' => false, 'requiereDatos' => true];
            }
            // Se apunta en la puerta (sin límite de plazas: ya está en la sala)
            $inscripcion = $this->inscripciones->guardar(
                InscripcionActividad::nueva($actividadId, ['email' => $email] + $datos, ($this->generarCodigo)(), $ahora)
            );
        }

        if ($inscripcion->asistioEn !== null) {
            return ['inscripcion' => $inscripcion, 'yaRegistrada' => true, 'requiereDatos' => false];
        }
        return [
            'inscripcion' => $this->inscripciones->guardar($inscripcion->conAsistencia($ahora)),
            'yaRegistrada' => false,
            'requiereDatos' => false,
        ];
    }

    private function publicada(int $id): Actividad
    {
        $actividad = $this->actividades->buscar($id);
        if ($actividad === null || !$actividad->publicada) {
            throw new NoEncontrado('La actividad no existe.');
        }
        return $actividad;
    }
}
