<?php

declare(strict_types=1);

namespace CodeUrv\Aplicacion\CasosDeUso;

use CodeUrv\Aplicacion\Puertos\ReceptorInscripciones;
use CodeUrv\Dominio\SolicitudInscripcion;

final class EnviarInscripcion
{
    public function __construct(private readonly ReceptorInscripciones $receptor)
    {
    }

    /** @param array<string, mixed> $datos */
    public function ejecutar(array $datos): void
    {
        $this->receptor->enviar(SolicitudInscripcion::desdeDatos($datos));
    }
}
