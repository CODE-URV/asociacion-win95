<?php

declare(strict_types=1);

namespace CodeUrv\Presentacion\Controladores;

use CodeUrv\Aplicacion\CasosDeUso\Autenticacion;
use CodeUrv\Aplicacion\CasosDeUso\GestionarProyectos;
use CodeUrv\Dominio\Proyecto;
use CodeUrv\Presentacion\Http\Peticion;
use CodeUrv\Presentacion\Http\Respuesta;

final class ProyectosControlador
{
    /**
     * @param \Closure(): GestionarProyectos $proyectos  se crea solo si hace falta (abre la base de datos)
     * @param \Closure(): Autenticacion $autenticacion
     */
    public function __construct(
        private readonly \Closure $proyectos,
        private readonly \Closure $autenticacion,
    ) {
    }

    public function listar(Peticion $peticion): Respuesta
    {
        $lista = array_map(static fn (Proyecto $p) => $p->aArray(), ($this->proyectos)()->listar());
        return Respuesta::json(['proyectos' => $lista]);
    }

    public function crear(Peticion $peticion): Respuesta
    {
        $this->exigirAdmin($peticion);
        $proyecto = ($this->proyectos)()->crear($peticion->json());
        return Respuesta::json(['proyecto' => $proyecto->aArray()], 201);
    }

    /** @param array{id: int} $parametros */
    public function actualizar(Peticion $peticion, array $parametros): Respuesta
    {
        $this->exigirAdmin($peticion);
        $proyecto = ($this->proyectos)()->actualizar($parametros['id'], $peticion->json());
        return Respuesta::json(['proyecto' => $proyecto->aArray()]);
    }

    /** @param array{id: int} $parametros */
    public function eliminar(Peticion $peticion, array $parametros): Respuesta
    {
        $this->exigirAdmin($peticion);
        ($this->proyectos)()->eliminar($parametros['id']);
        return Respuesta::sinContenido();
    }

    private function exigirAdmin(Peticion $peticion): void
    {
        ($this->autenticacion)()->exigirAdmin($peticion->cabecera('x-csrf-token'), $peticion->modificaDatos());
    }
}
