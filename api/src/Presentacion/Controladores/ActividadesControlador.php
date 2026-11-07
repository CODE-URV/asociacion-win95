<?php

declare(strict_types=1);

namespace CodeUrv\Presentacion\Controladores;

use CodeUrv\Aplicacion\CasosDeUso\Autenticacion;
use CodeUrv\Aplicacion\CasosDeUso\EnviarCertificados;
use CodeUrv\Aplicacion\CasosDeUso\GestionarActividades;
use CodeUrv\Aplicacion\CasosDeUso\ParticiparEnActividades;
use CodeUrv\Dominio\InscripcionActividad;
use CodeUrv\Presentacion\Http\Peticion;
use CodeUrv\Presentacion\Http\PeticionInvalida;
use CodeUrv\Presentacion\Http\Respuesta;

final class ActividadesControlador
{
    /**
     * @param \Closure(): ParticiparEnActividades $publico
     * @param \Closure(): GestionarActividades $gestion
     * @param \Closure(): Autenticacion $autenticacion
     * @param \Closure(): EnviarCertificados $certificados
     */
    public function __construct(
        private readonly \Closure $publico,
        private readonly \Closure $gestion,
        private readonly \Closure $autenticacion,
        private readonly \Closure $certificados,
    ) {
    }

    // ---------- Público ----------

    /** GET /actividades */
    public function listarPublicas(Peticion $peticion): Respuesta
    {
        $lista = array_map(static fn (array $f) => $f['actividad']->aArray() + [
            'plazasLibres' => $f['plazasLibres'],
            'motivoCerrada' => $f['motivoCerrada'],
            'terminada' => $f['terminada'],
        ], ($this->publico)()->listarPublicas());
        return Respuesta::json(['actividades' => $lista]);
    }

    /** POST /actividades/{id}/inscripciones */
    public function inscribirse(Peticion $peticion, array $p): Respuesta
    {
        $inscripcion = ($this->publico)()->inscribirse($p['id'], $peticion->json());
        return Respuesta::json(['ok' => true, 'nombre' => $inscripcion->nombre], 201);
    }

    /** POST /actividades/{id}/pase { codigo } */
    public function pase(Peticion $peticion, array $p): Respuesta
    {
        $codigo = $peticion->json()['codigo'] ?? '';
        if (!is_string($codigo)) {
            throw new PeticionInvalida('Falta el código.');
        }
        return Respuesta::json(['pase' => ($this->publico)()->obtenerPase($p['id'], $codigo)]);
    }

    /** POST /actividades/{id}/asistencia { pase, email, [nombre, apellidos, grado, curso, ...] } */
    public function asistencia(Peticion $peticion, array $p): Respuesta
    {
        $datos = $peticion->json();
        $pase = is_string($datos['pase'] ?? null) ? $datos['pase'] : '';
        $resultado = ($this->publico)()->registrarAsistencia($p['id'], $pase, $datos);

        if ($resultado['requiereDatos']) {
            return Respuesta::json(['requiereDatos' => true]);
        }
        return Respuesta::json([
            'registrada' => true,
            'yaRegistrada' => $resultado['yaRegistrada'],
            'nombre' => $resultado['inscripcion']->nombre,
        ]);
    }

    // ---------- Administración ----------

    /** GET /admin/actividades */
    public function listar(Peticion $peticion): Respuesta
    {
        $gestion = $this->admin($peticion);
        $lista = array_map(static fn (array $f) => $f['actividad']->aArray() + [
            'inscritos' => $f['inscritos'],
            'asistentes' => $f['asistentes'],
        ], $gestion->listar());
        return Respuesta::json(['actividades' => $lista]);
    }

    /** POST /admin/actividades */
    public function crear(Peticion $peticion): Respuesta
    {
        $r = $this->admin($peticion)->crear($peticion->json());
        return Respuesta::json(['actividad' => $r['actividad']->aArray(), 'aviso' => $r['aviso']], 201);
    }

    /** PUT /admin/actividades/{id} */
    public function actualizar(Peticion $peticion, array $p): Respuesta
    {
        $r = $this->admin($peticion)->actualizar($p['id'], $peticion->json());
        return Respuesta::json(['actividad' => $r['actividad']->aArray(), 'aviso' => $r['aviso']]);
    }

    /** DELETE /admin/actividades/{id} */
    public function eliminar(Peticion $peticion, array $p): Respuesta
    {
        $aviso = $this->admin($peticion)->eliminar($p['id']);
        return $aviso === null ? Respuesta::sinContenido() : Respuesta::json(['aviso' => $aviso]);
    }

    /** GET /admin/actividades/{id}/inscripciones */
    public function inscritos(Peticion $peticion, array $p): Respuesta
    {
        $lista = array_map(static fn (InscripcionActividad $i) => $i->aArray(), $this->admin($peticion)->inscritos($p['id']));
        return Respuesta::json(['inscripciones' => $lista]);
    }

    /** PUT /admin/actividades/{id}/inscripciones/{inscripcion} { asistio: bool } */
    public function marcarAsistencia(Peticion $peticion, array $p): Respuesta
    {
        $asistio = $peticion->json()['asistio'] ?? null;
        if (!is_bool($asistio)) {
            throw new PeticionInvalida('Falta "asistio" (true o false).');
        }
        $inscripcion = $this->admin($peticion)->marcarAsistencia($p['id'], $p['inscripcion'], $asistio);
        return Respuesta::json(['inscripcion' => $inscripcion->aArray()]);
    }

    /** DELETE /admin/actividades/{id}/inscripciones/{inscripcion} */
    public function eliminarInscripcion(Peticion $peticion, array $p): Respuesta
    {
        $this->admin($peticion)->eliminarInscripcion($p['id'], $p['inscripcion']);
        return Respuesta::sinContenido();
    }

    /** POST /admin/actividades/{id}/certificados — envía el siguiente lote */
    public function enviarCertificados(Peticion $peticion, array $p): Respuesta
    {
        $this->admin($peticion);
        return Respuesta::json(($this->certificados)()->enviarLote($p['id']));
    }

    /** POST /admin/actividades/{id}/inscripciones/{inscripcion}/certificado — reenviar a una persona */
    public function reenviarCertificado(Peticion $peticion, array $p): Respuesta
    {
        $this->admin($peticion);
        $inscripcion = ($this->certificados)()->reenviar($p['id'], $p['inscripcion']);
        return Respuesta::json(['inscripcion' => $inscripcion->aArray()]);
    }

    /** GET /admin/actividades/{id}/certificado-previo[?inscripcion=ID] — PDF para revisar */
    public function vistaPreviaCertificado(Peticion $peticion, array $p): Respuesta
    {
        $this->admin($peticion);
        $inscripcion = ctype_digit($peticion->consulta('inscripcion')) ? (int) $peticion->consulta('inscripcion') : null;
        $previo = ($this->certificados)()->vistaPrevia($p['id'], $inscripcion);
        return Respuesta::archivo($previo['pdf'], 'application/pdf', $previo['nombre']);
    }

    /** GET /admin/actividades/{id}/qr */
    public function codigoQr(Peticion $peticion, array $p): Respuesta
    {
        return Respuesta::json($this->admin($peticion)->codigoQr($p['id']));
    }

    private function admin(Peticion $peticion): GestionarActividades
    {
        ($this->autenticacion)()->exigirAdmin($peticion->cabecera('x-csrf-token'), $peticion->modificaDatos());
        return ($this->gestion)();
    }
}
