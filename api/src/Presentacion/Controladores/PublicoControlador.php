<?php

declare(strict_types=1);

namespace CodeUrv\Presentacion\Controladores;

use CodeUrv\Aplicacion\CasosDeUso\ConsultarEventos;
use CodeUrv\Aplicacion\CasosDeUso\EnviarInscripcion;
use CodeUrv\Dominio\Evento;
use CodeUrv\Presentacion\Http\Peticion;
use CodeUrv\Presentacion\Http\Respuesta;

/** Endpoints públicos que no usan la base de datos: eventos e inscripciones. */
final class PublicoControlador
{
    /**
     * @param \Closure(): ConsultarEventos $eventos
     * @param \Closure(): EnviarInscripcion $inscripciones
     */
    public function __construct(
        private readonly \Closure $eventos,
        private readonly \Closure $inscripciones,
    ) {
    }

    /** GET /eventos?desde=ISO&hasta=ISO */
    public function eventos(Peticion $peticion): Respuesta
    {
        $eventos = ($this->eventos)()->entre($peticion->consulta('desde'), $peticion->consulta('hasta'));
        return Respuesta::json(['eventos' => array_map(static fn (Evento $e) => $e->aArray(), $eventos)]);
    }

    /** POST /inscripciones */
    public function inscribir(Peticion $peticion): Respuesta
    {
        ($this->inscripciones)()->ejecutar($peticion->json());
        return Respuesta::json(['ok' => true], 201);
    }
}
