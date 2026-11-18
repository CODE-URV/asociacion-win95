<?php

declare(strict_types=1);

namespace CodeUrv\Dominio\Olimpiadas;

use CodeUrv\Dominio\ErrorDeValidacion;

/** Imagen hecha con IA de un equipo y las notas del jurado (0 a 10 en cada criterio). */
final class PuntuacionImagen
{
    public const CRITERIOS = [
        'originalidad' => 'Originalidad',
        'adecuacion' => 'Adecuación a lo pedido',
        'calidad' => 'Calidad de la propuesta',
    ];
    public const NOTA_MAXIMA = 10;

    /** @param array<string, int|null> $notas */
    private function __construct(
        public readonly int $pruebaId,
        public readonly int $equipoId,
        public readonly array $notas,
        public readonly bool $tieneImagen,
    ) {
    }

    public static function vacia(int $pruebaId, int $equipoId): self
    {
        return new self($pruebaId, $equipoId, array_fill_keys(array_keys(self::CRITERIOS), null), false);
    }

    /** @param array<string, int|null> $notas */
    public static function reconstruir(int $pruebaId, int $equipoId, array $notas, bool $tieneImagen): self
    {
        return (new self($pruebaId, $equipoId, [], $tieneImagen))->conNotas($notas);
    }

    /** @param array<string, mixed> $datos una nota vacía (null) es "sin puntuar" */
    public function conNotas(array $datos): self
    {
        $notas = [];
        $errores = [];
        foreach (array_keys(self::CRITERIOS) as $criterio) {
            $nota = $datos[$criterio] ?? null;
            if ($nota !== null && (!is_int($nota) || $nota < 0 || $nota > self::NOTA_MAXIMA)) {
                $errores[$criterio] = 'Nota entera de 0 a ' . self::NOTA_MAXIMA . '.';
            }
            $notas[$criterio] = $nota;
        }
        if ($errores !== []) {
            throw new ErrorDeValidacion($errores);
        }
        return new self($this->pruebaId, $this->equipoId, $notas, $this->tieneImagen);
    }

    public function conImagen(bool $tieneImagen): self
    {
        return new self($this->pruebaId, $this->equipoId, $this->notas, $tieneImagen);
    }

    /** Cuenta para la clasificación: hay imagen y las tres notas puestas. */
    public function completa(): bool
    {
        return $this->tieneImagen && !in_array(null, $this->notas, true);
    }

    public function total(): int
    {
        return (int) array_sum($this->notas);
    }

    /** @return array<string, mixed> */
    public function aArray(): array
    {
        return $this->notas + [
            'equipoId' => $this->equipoId,
            'total' => $this->total(),
            'tieneImagen' => $this->tieneImagen,
            'completa' => $this->completa(),
        ];
    }
}
