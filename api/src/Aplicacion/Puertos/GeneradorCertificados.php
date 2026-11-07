<?php

declare(strict_types=1);

namespace CodeUrv\Aplicacion\Puertos;

use CodeUrv\Dominio\Certificado;

interface GeneradorCertificados
{
    /** Devuelve el PDF (bytes). */
    public function generar(Certificado $certificado): string;
}