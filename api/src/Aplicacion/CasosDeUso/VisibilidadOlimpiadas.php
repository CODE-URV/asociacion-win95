<?php

declare(strict_types=1);

namespace CodeUrv\Aplicacion\CasosDeUso;

use CodeUrv\Aplicacion\Puertos\Ajustes;
use CodeUrv\Dominio\NoEncontrado;

/**
 * Las CodeOlimpiadas están ocultas al público hasta que un admin las activa.
 * Los admins las ven siempre.
 */
final class VisibilidadOlimpiadas
{
    private const CLAVE = 'olimpiadas_visibles';

    public function __construct(private readonly Ajustes $ajustes)
    {
    }

    public function visibles(): bool
    {
        return $this->ajustes->obtenerOCrear(self::CLAVE, static fn () => '0') === '1';
    }

    public function cambiar(bool $visibles): void
    {
        $this->ajustes->guardar(self::CLAVE, $visibles ? '1' : '0');
    }

    public function exigir(bool $esAdmin): void
    {
        if (!$esAdmin && !$this->visibles()) {
            throw new NoEncontrado('Las CodeOlimpiadas no están abiertas.');
        }
    }
}
