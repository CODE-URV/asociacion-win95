<?php

declare(strict_types=1);

namespace CodeUrv\Presentacion\Controladores;

use CodeUrv\Aplicacion\CasosDeUso\Autenticacion;
use CodeUrv\Aplicacion\CasosDeUso\ConsultarOlimpiadas;
use CodeUrv\Aplicacion\CasosDeUso\GestionarOlimpiadas;
use CodeUrv\Aplicacion\CasosDeUso\JugarWikiRace;
use CodeUrv\Presentacion\Http\Peticion;
use CodeUrv\Presentacion\Http\PeticionInvalida;
use CodeUrv\Presentacion\Http\Respuesta;

final class OlimpiadasControlador
{
    /**
     * @param \Closure(): ConsultarOlimpiadas $consulta
     * @param \Closure(): JugarWikiRace $wikiRace
     * @param \Closure(): GestionarOlimpiadas $gestion
     * @param \Closure(): Autenticacion $autenticacion
     */
    public function __construct(
        private readonly \Closure $consulta,
        private readonly \Closure $wikiRace,
        private readonly \Closure $gestion,
        private readonly \Closure $autenticacion,
    ) {
    }

    // ---------- Público ----------

    /** GET /olimpiadas/visibilidad — para saber si se pone el icono en el escritorio */
    public function visibilidad(Peticion $peticion): Respuesta
    {
        return Respuesta::json(['visibles' => ($this->consulta)()->visibles()]);
    }

    /** GET /olimpiadas — ranking, pruebas y resultados publicados */
    public function resumen(Peticion $peticion): Respuesta
    {
        return Respuesta::json(($this->consulta)()->resumen(false, $this->esAdmin()));
    }

    /** GET /olimpiadas/pruebas/{id}/equipos/{equipo}/imagen — solo con la prueba finalizada */
    public function imagen(Peticion $peticion, array $p): Respuesta
    {
        $imagen = ($this->consulta)()->imagenPublica($p['id'], $p['equipo'], $this->esAdmin());
        return Respuesta::archivo($imagen['contenido'], $imagen['tipo'], "imagen-{$p['id']}-{$p['equipo']}");
    }

    /** POST /olimpiadas/pruebas/{id}/partida { codigo } — empezar (o recuperar) la Wiki Race */
    public function empezarWikiRace(Peticion $peticion, array $p): Respuesta
    {
        $codigo = $this->texto($peticion->json(), 'codigo');
        return Respuesta::json(($this->wikiRace)()->empezar($p['id'], $codigo, $peticion->ip, $this->esAdmin()));
    }

    /** POST /olimpiadas/pruebas/{id}/partida/pasos { codigo, articulo } — un clic */
    public function avanzarWikiRace(Peticion $peticion, array $p): Respuesta
    {
        $datos = $peticion->json();
        return Respuesta::json(($this->wikiRace)()->avanzar(
            $p['id'],
            $this->texto($datos, 'codigo'),
            $this->texto($datos, 'articulo'),
            $peticion->ip,
            $this->esAdmin(),
        ));
    }

    // ---------- Administración ----------

    /** GET /admin/olimpiadas — todo, con códigos de equipo, notas y partidas en curso */
    public function resumenAdmin(Peticion $peticion): Respuesta
    {
        $this->admin($peticion);
        return Respuesta::json(($this->consulta)()->resumen(true));
    }

    /** PUT /admin/olimpiadas/visibilidad { visibles: bool } */
    public function cambiarVisibilidad(Peticion $peticion): Respuesta
    {
        $visibles = $peticion->json()['visibles'] ?? null;
        if (!is_bool($visibles)) {
            throw new PeticionInvalida('Falta "visibles" (true o false).');
        }
        $this->admin($peticion)->cambiarVisibilidad($visibles);
        return Respuesta::json(['visibles' => $visibles]);
    }

    /** POST /admin/olimpiadas/equipos */
    public function crearEquipo(Peticion $peticion): Respuesta
    {
        $equipo = $this->admin($peticion)->crearEquipo($peticion->json());
        return Respuesta::json(['equipo' => $equipo->aArray(true)], 201);
    }

    /** PUT /admin/olimpiadas/equipos/{id} */
    public function actualizarEquipo(Peticion $peticion, array $p): Respuesta
    {
        $equipo = $this->admin($peticion)->actualizarEquipo($p['id'], $peticion->json());
        return Respuesta::json(['equipo' => $equipo->aArray(true)]);
    }

    /** DELETE /admin/olimpiadas/equipos/{id} */
    public function eliminarEquipo(Peticion $peticion, array $p): Respuesta
    {
        $this->admin($peticion)->eliminarEquipo($p['id']);
        return Respuesta::sinContenido();
    }

    /** POST /admin/olimpiadas/pruebas */
    public function crearPrueba(Peticion $peticion): Respuesta
    {
        $prueba = $this->admin($peticion)->crearPrueba($peticion->json());
        return Respuesta::json(['prueba' => $prueba->aArray(true)], 201);
    }

    /** PUT /admin/olimpiadas/pruebas/{id} */
    public function actualizarPrueba(Peticion $peticion, array $p): Respuesta
    {
        $prueba = $this->admin($peticion)->actualizarPrueba($p['id'], $peticion->json());
        return Respuesta::json(['prueba' => $prueba->aArray(true)]);
    }

    /** DELETE /admin/olimpiadas/pruebas/{id} */
    public function eliminarPrueba(Peticion $peticion, array $p): Respuesta
    {
        $this->admin($peticion)->eliminarPrueba($p['id']);
        return Respuesta::sinContenido();
    }

    /** PUT /admin/olimpiadas/pruebas/{id}/equipos/{equipo}/notas { originalidad, adecuacion, calidad } */
    public function puntuar(Peticion $peticion, array $p): Respuesta
    {
        $puntuacion = $this->admin($peticion)->puntuar($p['id'], $p['equipo'], $peticion->json());
        return Respuesta::json(['puntuacion' => $puntuacion->aArray()]);
    }

    /** PUT /admin/olimpiadas/pruebas/{id}/equipos/{equipo}/imagen { imagen: base64 } */
    public function subirImagen(Peticion $peticion, array $p): Respuesta
    {
        $gestion = $this->admin($peticion);
        $base64 = $this->texto($peticion->json(Peticion::MAX_CUERPO_GRANDE), 'imagen');
        $base64 = preg_replace('#^data:[\w/+.-]+;base64,#', '', $base64) ?? '';
        $contenido = base64_decode($base64, true);
        if ($contenido === false) {
            throw new PeticionInvalida('La imagen no viene en base64.');
        }
        return Respuesta::json(['puntuacion' => $gestion->subirImagen($p['id'], $p['equipo'], $contenido)->aArray()]);
    }

    /** DELETE /admin/olimpiadas/pruebas/{id}/equipos/{equipo}/imagen */
    public function eliminarImagen(Peticion $peticion, array $p): Respuesta
    {
        $this->admin($peticion)->eliminarImagen($p['id'], $p['equipo']);
        return Respuesta::sinContenido();
    }

    /** GET /admin/olimpiadas/pruebas/{id}/equipos/{equipo}/imagen */
    public function imagenAdmin(Peticion $peticion, array $p): Respuesta
    {
        $imagen = $this->admin($peticion)->imagen($p['id'], $p['equipo']);
        return Respuesta::archivo($imagen['contenido'], $imagen['tipo'], "imagen-{$p['id']}-{$p['equipo']}");
    }

    /** DELETE /admin/olimpiadas/pruebas/{id}/equipos/{equipo}/partida — que vuelva a empezar */
    public function reiniciarPartida(Peticion $peticion, array $p): Respuesta
    {
        $this->admin($peticion)->reiniciarPartida($p['id'], $p['equipo']);
        return Respuesta::sinContenido();
    }

    /** @param array<string, mixed> $datos */
    private function texto(array $datos, string $campo): string
    {
        $valor = $datos[$campo] ?? null;
        if (!is_string($valor) || $valor === '') {
            throw new PeticionInvalida("Falta \"{$campo}\".");
        }
        return $valor;
    }

    /** Hay sesión de admin (solo para leer: no exige el token CSRF). */
    private function esAdmin(): bool
    {
        return (($this->autenticacion)()->sesionActual()['usuario'] ?? null) !== null;
    }

    private function admin(Peticion $peticion): GestionarOlimpiadas
    {
        ($this->autenticacion)()->exigirAdmin($peticion->cabecera('x-csrf-token'), $peticion->modificaDatos());
        return ($this->gestion)();
    }
}
