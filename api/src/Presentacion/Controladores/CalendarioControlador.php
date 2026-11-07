<?php

declare(strict_types=1);

namespace CodeUrv\Presentacion\Controladores;

use CodeUrv\Aplicacion\CasosDeUso\Autenticacion;
use CodeUrv\Aplicacion\CasosDeUso\GestionarCalendario;
use CodeUrv\Dominio\Evento;
use CodeUrv\Presentacion\Http\Peticion;
use CodeUrv\Presentacion\Http\Respuesta;

/** Eventos del Google Calendar desde el Panel de control (solo admin). */
final class CalendarioControlador
{
    /**
     * @param \Closure(): GestionarCalendario $calendario
     * @param \Closure(): Autenticacion $autenticacion
     */
    public function __construct(
        private readonly \Closure $calendario,
        private readonly \Closure $autenticacion,
    ) {
    }

    /** GET /admin/eventos */
    public function listar(Peticion $peticion): Respuesta
    {
        $eventos = array_map(static fn (Evento $e) => $e->aArray(), $this->admin($peticion)->listar());
        return Respuesta::json(['eventos' => $eventos]);
    }

    /** POST /admin/eventos */
    public function crear(Peticion $peticion): Respuesta
    {
        return Respuesta::json(['evento' => $this->admin($peticion)->crear($peticion->json())->aArray()], 201);
    }

    /** PUT /admin/eventos/{evento} */
    public function actualizar(Peticion $peticion, array $p): Respuesta
    {
        return Respuesta::json(['evento' => $this->admin($peticion)->actualizar($p['evento'], $peticion->json())->aArray()]);
    }

    /** DELETE /admin/eventos/{evento} */
    public function eliminar(Peticion $peticion, array $p): Respuesta
    {
        $this->admin($peticion)->eliminar($p['evento']);
        return Respuesta::sinContenido();
    }

    private function admin(Peticion $peticion): GestionarCalendario
    {
        ($this->autenticacion)()->exigirAdmin($peticion->cabecera('x-csrf-token'), $peticion->modificaDatos());
        return ($this->calendario)();
    }
}
