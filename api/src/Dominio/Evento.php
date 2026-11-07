<?php

declare(strict_types=1);

namespace CodeUrv\Dominio;

/**
 * Evento del calendario de la asociación (Google Calendar).
 * Fechas en hora local: 'AAAA-MM-DD' si dura todo el día o 'AAAA-MM-DDTHH:MM'.
 * En los eventos de todo el día, `fin` es el último día (incluido).
 */
final class Evento
{
    public const LIMITES = ['titulo' => 200, 'descripcion' => 5000, 'lugar' => 200];

    public function __construct(
        public readonly string $id,
        public readonly string $titulo,
        public readonly string $descripcion,
        public readonly string $lugar,
        public readonly string $inicio,
        public readonly bool $todoElDia,
        public readonly string $fin = '',
    ) {
    }

    /** Evento nuevo o editado desde el Panel de control. @param array<string, mixed> $datos */
    public static function desdeDatos(array $datos, string $id = ''): self
    {
        $errores = [];
        $texto = static function (string $campo, bool $obligatorio = false) use ($datos, &$errores): string {
            $valor = is_string($datos[$campo] ?? null) ? trim($datos[$campo]) : '';
            if ($obligatorio && $valor === '') {
                $errores[$campo] = 'Es obligatorio.';
            } elseif (mb_strlen($valor) > self::LIMITES[$campo]) {
                $errores[$campo] = 'Máximo ' . self::LIMITES[$campo] . ' caracteres.';
            }
            return $valor;
        };

        $titulo = $texto('titulo', true);
        $descripcion = $texto('descripcion');
        $lugar = $texto('lugar');
        $todoElDia = ($datos['todoElDia'] ?? false) === true;

        $formato = $todoElDia ? 'Y-m-d' : 'Y-m-d\TH:i';
        $leer = static function (string $campo) use ($datos, $formato, &$errores): ?\DateTimeImmutable {
            $valor = is_string($datos[$campo] ?? null) ? $datos[$campo] : '';
            $fecha = \DateTimeImmutable::createFromFormat('!' . $formato, $valor);
            if ($fecha === false || $fecha->format($formato) !== $valor) {
                $errores[$campo] = 'Fecha no válida.';
                return null;
            }
            return $fecha;
        };
        $inicio = $leer('inicio');
        $fin = $leer('fin');

        if ($inicio && $fin && ($todoElDia ? $fin < $inicio : $fin <= $inicio)) {
            $errores['fin'] = 'Tiene que acabar después de empezar.';
        }

        if ($errores !== []) {
            throw new ErrorDeValidacion($errores);
        }

        return new self($id, $titulo, $descripcion, $lugar, $inicio->format($formato), $todoElDia, $fin->format($formato));
    }

    public function conId(string $id): self
    {
        return new self($id, $this->titulo, $this->descripcion, $this->lugar, $this->inicio, $this->todoElDia, $this->fin);
    }

    /** @return array<string, mixed> */
    public function aArray(): array
    {
        return [
            'id' => $this->id,
            'titulo' => $this->titulo,
            'descripcion' => $this->descripcion,
            'lugar' => $this->lugar,
            'inicio' => $this->inicio,
            'fin' => $this->fin,
            'todoElDia' => $this->todoElDia,
        ];
    }
}
