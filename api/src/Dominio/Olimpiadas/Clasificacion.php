<?php

declare(strict_types=1);

namespace CodeUrv\Dominio\Olimpiadas;

/**
 * Puntos por posición: en cada prueba el 1º se lleva 10, el 2º 8, el 3º 6, y luego 5, 4, 3, 2, 1.
 * Los empatados comparten posición y puntos (1, 1, 3...). El ranking general suma los puntos.
 */
final class Clasificacion
{
    public const PUNTOS = [10, 8, 6, 5, 4, 3, 2, 1];

    /**
     * @template T
     * @param array<int, T> $resultados equipoId => resultado
     * @param callable(T, T): int $comparar negativo si el primero es mejor, 0 si empatan
     * @return list<array{equipoId: int, posicion: int, puntos: int}>
     */
    public static function calcular(array $resultados, callable $comparar): array
    {
        $ids = array_keys($resultados);
        usort($ids, static fn (int $a, int $b) => $comparar($resultados[$a], $resultados[$b]) ?: $a <=> $b);

        $filas = [];
        $posicion = 0;
        foreach ($ids as $i => $id) {
            if ($i === 0 || $comparar($resultados[$ids[$i - 1]], $resultados[$id]) !== 0) {
                $posicion = $i + 1;
            }
            $filas[] = ['equipoId' => $id, 'posicion' => $posicion, 'puntos' => self::PUNTOS[$posicion - 1] ?? 0];
        }
        return $filas;
    }

    /**
     * @param list<int> $equipoIds todos los equipos (los que no han puntuado salen con 0)
     * @param list<list<array{equipoId: int, puntos: int}>> $clasificaciones una por prueba finalizada
     * @return list<array{equipoId: int, posicion: int, puntos: int}>
     */
    public static function general(array $equipoIds, array $clasificaciones): array
    {
        $puntos = array_fill_keys($equipoIds, 0);
        foreach ($clasificaciones as $clasificacion) {
            foreach ($clasificacion as $fila) {
                if (isset($puntos[$fila['equipoId']])) {
                    $puntos[$fila['equipoId']] += $fila['puntos'];
                }
            }
        }
        return array_map(
            static fn (array $f) => ['equipoId' => $f['equipoId'], 'posicion' => $f['posicion'], 'puntos' => $puntos[$f['equipoId']]],
            self::calcular($puntos, static fn (int $a, int $b) => $b <=> $a),
        );
    }
}
