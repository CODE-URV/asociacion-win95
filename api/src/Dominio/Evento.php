<?php

declare(strict_types=1);

namespace CodeUrv\Dominio;

/** Evento del calendario de la asociación. */
final class Evento
{
    public function __construct(
        public readonly string $id,
        public readonly string $titulo,
        public readonly string $descripcion,
        public readonly string $lugar,
        /** 'AAAA-MM-DD' si dura todo el día, o fecha y hora ISO 8601 */
        public readonly string $inicio,
        public readonly bool $todoElDia,
    ) {
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
            'todoElDia' => $this->todoElDia,
        ];
    }
}
