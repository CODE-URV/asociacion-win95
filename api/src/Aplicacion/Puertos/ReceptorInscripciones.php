<?php

declare(strict_types=1);

namespace CodeUrv\Aplicacion\Puertos;

use CodeUrv\Dominio\SolicitudInscripcion;

interface ReceptorInscripciones
{
    /** Guarda la solicitud donde corresponda. Lanza ServicioNoDisponible si falla. */
    public function enviar(SolicitudInscripcion $solicitud): void;
}
