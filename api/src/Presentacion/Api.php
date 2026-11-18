<?php

declare(strict_types=1);

namespace CodeUrv\Presentacion;

use CodeUrv\Aplicacion\AccesoDenegado;
use CodeUrv\Aplicacion\Conflicto;
use CodeUrv\Aplicacion\CredencialesIncorrectas;
use CodeUrv\Presentacion\Controladores\ActividadesControlador;
use CodeUrv\Presentacion\Controladores\CalendarioControlador;
use CodeUrv\Presentacion\Controladores\OlimpiadasControlador;
use CodeUrv\Aplicacion\DemasiadosIntentos;
use CodeUrv\Aplicacion\NoAutorizado;
use CodeUrv\Aplicacion\ServicioNoDisponible;
use CodeUrv\Dominio\ErrorDeValidacion;
use CodeUrv\Dominio\NoEncontrado;
use CodeUrv\Presentacion\Controladores\ProyectosControlador;
use CodeUrv\Presentacion\Controladores\PublicoControlador;
use CodeUrv\Presentacion\Controladores\SesionControlador;
use CodeUrv\Presentacion\Http\Peticion;
use CodeUrv\Presentacion\Http\PeticionInvalida;
use CodeUrv\Presentacion\Http\Respuesta;
use CodeUrv\Presentacion\Http\Router;

/** Rutas de la API y traducción de errores a respuestas HTTP. */
final class Api
{
    private readonly Router $router;

    /** @param \Closure(string): void $registrarError */
    public function __construct(
        ProyectosControlador $proyectos,
        SesionControlador $sesion,
        PublicoControlador $publico,
        ActividadesControlador $actividades,
        private readonly \Closure $registrarError,
        ?CalendarioControlador $calendario = null,
        ?OlimpiadasControlador $olimpiadas = null,
    ) {
        $this->router = (new Router())
            ->agregar('GET', '/proyectos', $proyectos->listar(...))
            ->agregar('POST', '/proyectos', $proyectos->crear(...))
            ->agregar('PUT', '/proyectos/{id}', $proyectos->actualizar(...))
            ->agregar('DELETE', '/proyectos/{id}', $proyectos->eliminar(...))
            ->agregar('GET', '/sesion', $sesion->consultar(...))
            ->agregar('POST', '/sesion', $sesion->iniciar(...))
            ->agregar('DELETE', '/sesion', $sesion->cerrar(...))
            ->agregar('GET', '/eventos', $publico->eventos(...))
            ->agregar('POST', '/inscripciones', $publico->inscribir(...))
            // Actividades: público
            ->agregar('GET', '/actividades', $actividades->listarPublicas(...))
            ->agregar('POST', '/actividades/{id}/inscripciones', $actividades->inscribirse(...))
            ->agregar('POST', '/actividades/{id}/pase', $actividades->pase(...))
            ->agregar('POST', '/actividades/{id}/asistencia', $actividades->asistencia(...))
            // Actividades: administración
            ->agregar('GET', '/admin/actividades', $actividades->listar(...))
            ->agregar('POST', '/admin/actividades', $actividades->crear(...))
            ->agregar('PUT', '/admin/actividades/{id}', $actividades->actualizar(...))
            ->agregar('DELETE', '/admin/actividades/{id}', $actividades->eliminar(...))
            ->agregar('GET', '/admin/actividades/{id}/inscripciones', $actividades->inscritos(...))
            ->agregar('PUT', '/admin/actividades/{id}/inscripciones/{inscripcion}', $actividades->marcarAsistencia(...))
            ->agregar('DELETE', '/admin/actividades/{id}/inscripciones/{inscripcion}', $actividades->eliminarInscripcion(...))
            ->agregar('GET', '/admin/actividades/{id}/qr', $actividades->codigoQr(...))
            ->agregar('POST', '/admin/actividades/{id}/certificados', $actividades->enviarCertificados(...))
            ->agregar('POST', '/admin/actividades/{id}/inscripciones/{inscripcion}/certificado', $actividades->reenviarCertificado(...))
            ->agregar('GET', '/admin/actividades/{id}/certificado-previo', $actividades->vistaPreviaCertificado(...));

        if ($calendario !== null) {
            // Calendario de Google desde el Panel de control (admin)
            $this->router
                ->agregar('GET', '/admin/eventos', $calendario->listar(...))
                ->agregar('POST', '/admin/eventos', $calendario->crear(...))
                ->agregar('PUT', '/admin/eventos/{evento:texto}', $calendario->actualizar(...))
                ->agregar('DELETE', '/admin/eventos/{evento:texto}', $calendario->eliminar(...));
        }

        if ($olimpiadas !== null) {
            $equipo = '/pruebas/{id}/equipos/{equipo}';
            $this->router
                // CodeOlimpiadas: público
                ->agregar('GET', '/olimpiadas', $olimpiadas->resumen(...))
                ->agregar('GET', '/olimpiadas/visibilidad', $olimpiadas->visibilidad(...))
                ->agregar('GET', "/olimpiadas{$equipo}/imagen", $olimpiadas->imagen(...))
                ->agregar('POST', '/olimpiadas/pruebas/{id}/partida', $olimpiadas->empezarWikiRace(...))
                ->agregar('POST', '/olimpiadas/pruebas/{id}/partida/pasos', $olimpiadas->avanzarWikiRace(...))
                // CodeOlimpiadas: administración
                ->agregar('GET', '/admin/olimpiadas', $olimpiadas->resumenAdmin(...))
                ->agregar('PUT', '/admin/olimpiadas/visibilidad', $olimpiadas->cambiarVisibilidad(...))
                ->agregar('POST', '/admin/olimpiadas/equipos', $olimpiadas->crearEquipo(...))
                ->agregar('PUT', '/admin/olimpiadas/equipos/{id}', $olimpiadas->actualizarEquipo(...))
                ->agregar('DELETE', '/admin/olimpiadas/equipos/{id}', $olimpiadas->eliminarEquipo(...))
                ->agregar('POST', '/admin/olimpiadas/pruebas', $olimpiadas->crearPrueba(...))
                ->agregar('PUT', '/admin/olimpiadas/pruebas/{id}', $olimpiadas->actualizarPrueba(...))
                ->agregar('DELETE', '/admin/olimpiadas/pruebas/{id}', $olimpiadas->eliminarPrueba(...))
                ->agregar('PUT', "/admin/olimpiadas{$equipo}/notas", $olimpiadas->puntuar(...))
                ->agregar('GET', "/admin/olimpiadas{$equipo}/imagen", $olimpiadas->imagenAdmin(...))
                ->agregar('PUT', "/admin/olimpiadas{$equipo}/imagen", $olimpiadas->subirImagen(...))
                ->agregar('DELETE', "/admin/olimpiadas{$equipo}/imagen", $olimpiadas->eliminarImagen(...))
                ->agregar('DELETE', "/admin/olimpiadas{$equipo}/partida", $olimpiadas->reiniciarPartida(...));
        }
    }

    public function atender(Peticion $peticion): Respuesta
    {
        try {
            return $this->router->despachar($peticion);
        } catch (ErrorDeValidacion $e) {
            return Respuesta::error(422, $e->getMessage(), $e->errores);
        } catch (PeticionInvalida $e) {
            return Respuesta::error(400, $e->getMessage());
        } catch (NoEncontrado $e) {
            return Respuesta::error(404, $e->getMessage());
        } catch (CredencialesIncorrectas | NoAutorizado $e) {
            return Respuesta::error(401, $e->getMessage());
        } catch (AccesoDenegado $e) {
            return Respuesta::error(403, $e->getMessage());
        } catch (Conflicto $e) {
            return Respuesta::error(409, $e->getMessage());
        } catch (DemasiadosIntentos $e) {
            return Respuesta::error(429, $e->getMessage())->conCabecera('Retry-After', '900');
        } catch (ServicioNoDisponible $e) {
            ($this->registrarError)($e->getMessage());
            return Respuesta::error(502, 'Un servicio externo no responde. Inténtalo más tarde.');
        } catch (\Throwable $e) {
            // Los detalles van al log del servidor, nunca al navegador
            ($this->registrarError)(get_class($e) . ': ' . $e->getMessage() . ' en ' . $e->getFile() . ':' . $e->getLine());
            return Respuesta::error(500, 'Error interno del servidor.');
        }
    }
}
