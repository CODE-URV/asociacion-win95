<?php

declare(strict_types=1);

namespace CodeUrv\Presentacion\Controladores;

use CodeUrv\Aplicacion\CasosDeUso\Autenticacion;
use CodeUrv\Presentacion\Http\Peticion;
use CodeUrv\Presentacion\Http\Respuesta;

final class SesionControlador
{
    /** @param \Closure(): Autenticacion $autenticacion */
    public function __construct(private readonly \Closure $autenticacion)
    {
    }

    /** GET /sesion → { usuario: { nombre } | null, csrf } */
    public function consultar(Peticion $peticion): Respuesta
    {
        return Respuesta::json(($this->autenticacion)()->sesionActual());
    }

    /** POST /sesion { usuario, contrasena } */
    public function iniciar(Peticion $peticion): Respuesta
    {
        $datos = $peticion->json();
        $usuario = is_string($datos['usuario'] ?? null) ? $datos['usuario'] : '';
        $contrasena = is_string($datos['contrasena'] ?? null) ? $datos['contrasena'] : '';

        return Respuesta::json(($this->autenticacion)()->iniciarSesion($usuario, $contrasena, $peticion->ip));
    }

    /** DELETE /sesion */
    public function cerrar(Peticion $peticion): Respuesta
    {
        $autenticacion = ($this->autenticacion)();
        $autenticacion->exigirAdmin($peticion->cabecera('x-csrf-token'), true);
        $autenticacion->cerrarSesion();
        return Respuesta::sinContenido();
    }
}
