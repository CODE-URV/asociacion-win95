<?php

declare(strict_types=1);

namespace CodeUrv;

use CodeUrv\Aplicacion\CasosDeUso\Autenticacion;
use CodeUrv\Aplicacion\CasosDeUso\ConsultarEventos;
use CodeUrv\Aplicacion\CasosDeUso\EnviarInscripcion;
use CodeUrv\Aplicacion\CasosDeUso\GestionarProyectos;
use CodeUrv\Aplicacion\Puertos\Sesion;
use CodeUrv\Infraestructura\BaseDeDatos\ConexionPdo;
use CodeUrv\Infraestructura\BaseDeDatos\RegistroIntentosPdo;
use CodeUrv\Infraestructura\BaseDeDatos\RepositorioProyectosPdo;
use CodeUrv\Infraestructura\BaseDeDatos\RepositorioUsuariosPdo;
use CodeUrv\Infraestructura\Config;
use CodeUrv\Infraestructura\Google\CalendarioGoogle;
use CodeUrv\Infraestructura\Google\InscripcionesAppsScript;
use CodeUrv\Infraestructura\Http\ClienteHttp;
use CodeUrv\Presentacion\Api;
use CodeUrv\Presentacion\Controladores\ProyectosControlador;
use CodeUrv\Presentacion\Controladores\PublicoControlador;
use CodeUrv\Presentacion\Controladores\SesionControlador;

/**
 * Raíz de composición: el único sitio que conoce todas las capas y las conecta.
 * Todo se crea bajo demanda, así una petición de eventos no abre la base de datos.
 */
final class Contenedor
{
    private ?\PDO $pdo = null;

    public function __construct(
        private readonly Config $config,
        private readonly Sesion $sesion,
        private readonly ClienteHttp $http = new ClienteHttp(),
    ) {
    }

    public function api(): Api
    {
        $autenticacion = fn () => new Autenticacion(
            new RepositorioUsuariosPdo($this->pdo()),
            new RegistroIntentosPdo($this->pdo()),
            $this->sesion,
            static fn (): int => time(),
        );

        return new Api(
            new ProyectosControlador(
                fn () => new GestionarProyectos(new RepositorioProyectosPdo($this->pdo())),
                $autenticacion,
            ),
            new SesionControlador($autenticacion),
            new PublicoControlador(
                fn () => new ConsultarEventos(new CalendarioGoogle(
                    $this->http,
                    $this->config->obligatorio('GOOGLE_CALENDAR_API_KEY'),
                    $this->config->obligatorio('GOOGLE_CALENDAR_ID'),
                )),
                fn () => new EnviarInscripcion(new InscripcionesAppsScript(
                    $this->http,
                    $this->config->obligatorio('WEB_APP_URL'),
                )),
            ),
            static fn (string $mensaje) => error_log('[codeurv-api] ' . $mensaje),
        );
    }

    private function pdo(): \PDO
    {
        return $this->pdo ??= ConexionPdo::desdeConfig($this->config);
    }
}
