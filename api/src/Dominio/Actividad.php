<?php

declare(strict_types=1);

namespace CodeUrv\Dominio;

/**
 * Charla, taller u otra actividad a la que la gente se apunta y de la que recibe certificado.
 * Las fechas son hora local (Europe/Madrid).
 */
final class Actividad
{
    public const LIMITES = [
        'titulo' => 150,
        'descripcion' => 5000,
        'informacionExtra' => 5000,
        'lugar' => 150,
        'ponente' => 120,
    ];
    public const MAX_PLAZAS = 2000;

    /** Se puede registrar la asistencia desde 30 min antes hasta 1 h después. */
    private const MARGEN_ANTES = 'PT30M';
    private const MARGEN_DESPUES = 'PT1H';

    private function __construct(
        public readonly ?int $id,
        public readonly string $titulo,
        public readonly TipoActividad $tipo,
        public readonly string $descripcion,
        public readonly string $informacionExtra,
        public readonly string $lugar,
        public readonly \DateTimeImmutable $inicio,
        public readonly \DateTimeImmutable $fin,
        public readonly string $ponente,
        public readonly ?int $plazas,
        public readonly bool $publicada,
        public readonly bool $inscripcionesAbiertas,
    ) {
    }

    /** @param array<string, mixed> $datos */
    public static function desdeDatos(array $datos, ?int $id = null): self
    {
        $errores = [];

        $texto = static function (string $campo, bool $obligatorio = false) use ($datos, &$errores): string {
            $valor = $datos[$campo] ?? '';
            if (!is_string($valor)) {
                $errores[$campo] = 'Debe ser texto.';
                return '';
            }
            $valor = trim($valor);
            if ($obligatorio && $valor === '') {
                $errores[$campo] = 'Es obligatorio.';
            } elseif (mb_strlen($valor) > self::LIMITES[$campo]) {
                $errores[$campo] = 'Máximo ' . self::LIMITES[$campo] . ' caracteres.';
            }
            return $valor;
        };

        $fecha = static function (string $campo) use ($datos, &$errores): ?\DateTimeImmutable {
            $valor = $datos[$campo] ?? '';
            $fecha = is_string($valor) ? self::leerFecha($valor) : null;
            if ($fecha === null) {
                $errores[$campo] = 'Fecha y hora no válidas.';
            }
            return $fecha;
        };

        $titulo = $texto('titulo', true);
        $descripcion = $texto('descripcion');
        $informacionExtra = $texto('informacionExtra');
        $lugar = $texto('lugar', true);
        $ponente = $texto('ponente');
        $inicio = $fecha('inicio');
        $fin = $fecha('fin');

        if ($inicio !== null && $fin !== null && $fin <= $inicio) {
            $errores['fin'] = 'Tiene que acabar después de empezar.';
        }

        $tipo = is_string($datos['tipo'] ?? null) ? TipoActividad::tryFrom($datos['tipo']) : null;
        if ($tipo === null) {
            $errores['tipo'] = 'Tipo no válido.';
        }

        $plazas = $datos['plazas'] ?? null;
        if ($plazas !== null && (!is_int($plazas) || $plazas < 1 || $plazas > self::MAX_PLAZAS)) {
            $errores['plazas'] = 'Las plazas son un número entre 1 y ' . self::MAX_PLAZAS . ', o vacío si no hay límite.';
        }

        foreach (['publicada', 'inscripcionesAbiertas'] as $campo) {
            if (!is_bool($datos[$campo] ?? false)) {
                $errores[$campo] = 'Debe ser sí o no.';
            }
        }

        if ($errores !== []) {
            throw new ErrorDeValidacion($errores);
        }

        return new self(
            $id,
            $titulo,
            $tipo,
            $descripcion,
            $informacionExtra,
            $lugar,
            $inicio,
            $fin,
            $ponente,
            $plazas,
            (bool) ($datos['publicada'] ?? false),
            (bool) ($datos['inscripcionesAbiertas'] ?? false),
        );
    }

    /** Acepta '2026-11-19T16:00', '2026-11-19 16:00' o con segundos. */
    public static function leerFecha(string $valor): ?\DateTimeImmutable
    {
        foreach (['Y-m-d\TH:i', 'Y-m-d H:i', 'Y-m-d\TH:i:s', 'Y-m-d H:i:s'] as $formato) {
            $fecha = \DateTimeImmutable::createFromFormat('!' . $formato, $valor);
            if ($fecha !== false && $fecha->format($formato) === $valor) {
                return $fecha;
            }
        }
        return null;
    }

    public function conId(int $id): self
    {
        return self::desdeDatos($this->aArray(), $id);
    }

    /** null si se puede apuntar; si no, el motivo. */
    public function motivoInscripcionCerrada(\DateTimeImmutable $ahora, int $inscritos): ?string
    {
        if (!$this->publicada) {
            return 'Esta actividad no está publicada.';
        }
        if ($ahora >= $this->fin) {
            return 'Esta actividad ya ha terminado.';
        }
        if (!$this->inscripcionesAbiertas) {
            return 'Las inscripciones están cerradas.';
        }
        if ($this->plazas !== null && $inscritos >= $this->plazas) {
            return 'No quedan plazas.';
        }
        return null;
    }

    /** Se puede registrar asistencia por QR durante la actividad (con un margen). */
    public function admiteAsistencia(\DateTimeImmutable $ahora): bool
    {
        return $ahora >= $this->inicio->sub(new \DateInterval(self::MARGEN_ANTES))
            && $ahora <= $this->fin->add(new \DateInterval(self::MARGEN_DESPUES));
    }

    /** @return array<string, mixed> */
    public function aArray(): array
    {
        return [
            'id' => $this->id,
            'titulo' => $this->titulo,
            'tipo' => $this->tipo->value,
            'descripcion' => $this->descripcion,
            'informacionExtra' => $this->informacionExtra,
            'lugar' => $this->lugar,
            'inicio' => $this->inicio->format('Y-m-d\TH:i'),
            'fin' => $this->fin->format('Y-m-d\TH:i'),
            'ponente' => $this->ponente,
            'plazas' => $this->plazas,
            'publicada' => $this->publicada,
            'inscripcionesAbiertas' => $this->inscripcionesAbiertas,
        ];
    }
}
