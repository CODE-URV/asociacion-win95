<?php

declare(strict_types=1);

namespace CodeUrv\Aplicacion\CasosDeUso;

use CodeUrv\Aplicacion\Conflicto;
use CodeUrv\Aplicacion\Puertos\CalendarioEditable;
use CodeUrv\Aplicacion\ServicioNoDisponible;
use CodeUrv\Dominio\Evento;

/**
 * Eventos del Google Calendar de la asociación desde el Panel de control (solo admin).
 * El calendario sigue siendo uno: lo que se crea aquí se ve en la app del móvil y al revés.
 */
final class GestionarCalendario
{
    /** @param \Closure(): \DateTimeImmutable $reloj */
    public function __construct(
        private readonly CalendarioEditable $calendario,
        private readonly \Closure $reloj,
    ) {
    }

    /** Desde hace un mes hasta dentro de un año. @return list<Evento> */
    public function listar(): array
    {
        $hoy = ($this->reloj)()->setTime(0, 0);
        return $this->conGoogle(fn () => $this->calendario->entre($hoy->modify('-1 month'), $hoy->modify('+1 year')));
    }

    /** @param array<string, mixed> $datos */
    public function crear(array $datos): Evento
    {
        $evento = Evento::desdeDatos($datos);
        return $this->conGoogle(fn () => $this->calendario->crear($evento));
    }

    /** @param array<string, mixed> $datos */
    public function actualizar(string $id, array $datos): Evento
    {
        $evento = Evento::desdeDatos($datos, $id);
        return $this->conGoogle(fn () => $this->calendario->actualizar($evento));
    }

    public function eliminar(string $id): void
    {
        $this->conGoogle(fn () => $this->calendario->eliminar($id));
    }

    /** Los errores de Google se muestran tal cual al admin (configuración, permisos...). */
    private function conGoogle(callable $operacion): mixed
    {
        try {
            return $operacion();
        } catch (ServicioNoDisponible $e) {
            throw new Conflicto($e->getMessage());
        }
    }
}
