<?php

declare(strict_types=1);

namespace CodeUrv\Dominio\Olimpiadas;

/**
 * Partida de un equipo en una Wiki Race. La ruta empieza en el artículo de salida;
 * cada paso es un clic en un enlace (no se puede volver atrás). Los tiempos son milisegundos.
 */
final class PartidaWikiRace
{
    public const MAX_CLICS = 500;

    /** @param list<string> $ruta */
    private function __construct(
        public readonly int $pruebaId,
        public readonly int $equipoId,
        public readonly int $inicioMs,
        public readonly ?int $finMs,
        public readonly array $ruta,
    ) {
    }

    public static function empezar(int $pruebaId, int $equipoId, string $origen, int $ahoraMs): self
    {
        return new self($pruebaId, $equipoId, $ahoraMs, null, [$origen]);
    }

    /** @param list<string> $ruta */
    public static function reconstruir(int $pruebaId, int $equipoId, int $inicioMs, ?int $finMs, array $ruta): self
    {
        if ($ruta === [] || !array_is_list($ruta)) {
            throw new \InvalidArgumentException('La ruta de la partida está vacía.');
        }
        return new self($pruebaId, $equipoId, $inicioMs, $finMs, array_map('strval', $ruta));
    }

    public function actual(): string
    {
        return $this->ruta[count($this->ruta) - 1];
    }

    public function clics(): int
    {
        return count($this->ruta) - 1;
    }

    public function terminada(): bool
    {
        return $this->finMs !== null;
    }

    public function tiempoMs(): ?int
    {
        return $this->finMs === null ? null : $this->finMs - $this->inicioMs;
    }

    public function puedeSeguir(): bool
    {
        return !$this->terminada() && $this->clics() < self::MAX_CLICS;
    }

    public function avanzar(string $articulo, bool $esDestino, int $ahoraMs): self
    {
        if (!$this->puedeSeguir()) {
            throw new \LogicException('La partida no admite más pasos.');
        }
        return new self($this->pruebaId, $this->equipoId, $this->inicioMs, $esDestino ? $ahoraMs : null, [...$this->ruta, $articulo]);
    }

    /** Mejor = antes en llegar; a igual tiempo, menos clics. */
    public static function comparar(self $a, self $b): int
    {
        return [$a->tiempoMs(), $a->clics()] <=> [$b->tiempoMs(), $b->clics()];
    }

    /** @return array<string, mixed> */
    public function aArray(): array
    {
        return [
            'equipoId' => $this->equipoId,
            'actual' => $this->actual(),
            'clics' => $this->clics(),
            'ruta' => $this->ruta,
            'terminada' => $this->terminada(),
            'tiempoMs' => $this->tiempoMs(),
        ];
    }
}
