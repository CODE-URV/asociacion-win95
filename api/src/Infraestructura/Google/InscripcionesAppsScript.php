<?php

declare(strict_types=1);

namespace CodeUrv\Infraestructura\Google;

use CodeUrv\Aplicacion\Puertos\ReceptorInscripciones;
use CodeUrv\Aplicacion\ServicioNoDisponible;
use CodeUrv\Dominio\SolicitudInscripcion;
use CodeUrv\Infraestructura\Http\ClienteHttp;

/** Envía las inscripciones a la Google Apps Script que las guarda en la hoja de socios. */
final class InscripcionesAppsScript implements ReceptorInscripciones
{
    public function __construct(
        private readonly ClienteHttp $http,
        private readonly string $urlAppsScript,
    ) {
    }

    public function enviar(SolicitudInscripcion $solicitud): void
    {
        [$estado, $cuerpo] = $this->http->postJson(
            $this->urlAppsScript,
            json_encode($solicitud->aArray(), JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR),
        );

        if ($estado < 200 || $estado >= 300) {
            throw new ServicioNoDisponible("Apps Script respondió {$estado}: " . mb_substr($cuerpo, 0, 200));
        }

        // La Apps Script puede responder { "result": "error", ... } con estado 200
        $datos = json_decode($cuerpo, true);
        if (is_array($datos) && (($datos['result'] ?? null) === 'error' || ($datos['status'] ?? null) === 'error')) {
            throw new ServicioNoDisponible('Apps Script devolvió un error: ' . mb_substr($cuerpo, 0, 200));
        }
    }
}
