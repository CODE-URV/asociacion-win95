<?php

declare(strict_types=1);

namespace CodeUrv;

use CodeUrv\Aplicacion\CasosDeUso\Autenticacion;
use CodeUrv\Aplicacion\CasosDeUso\ConsultarEventos;
use CodeUrv\Aplicacion\CasosDeUso\EnviarInscripcion;
use CodeUrv\Aplicacion\CasosDeUso\EnviarCertificados;
use CodeUrv\Aplicacion\CasosDeUso\GestionarActividades;
use CodeUrv\Aplicacion\CasosDeUso\GestionarCalendario;
use CodeUrv\Infraestructura\Google\CalendarioGoogleEditable;
use CodeUrv\Infraestructura\Google\TokenCuentaServicio;
use CodeUrv\Presentacion\Controladores\CalendarioControlador;
use CodeUrv\Infraestructura\Correo\EnviadorSmtp;
use CodeUrv\Infraestructura\Pdf\CertificadoPdf;
use CodeUrv\Aplicacion\CasosDeUso\GestionarProyectos;
use CodeUrv\Aplicacion\CasosDeUso\ParticiparEnActividades;
use CodeUrv\Infraestructura\BaseDeDatos\AjustesPdo;
use CodeUrv\Infraestructura\BaseDeDatos\RepositorioActividadesPdo;
use CodeUrv\Infraestructura\BaseDeDatos\RepositorioInscripcionesPdo;
use CodeUrv\Presentacion\Controladores\ActividadesControlador;
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
            new ActividadesControlador(
                fn () => new ParticiparEnActividades(
                    new RepositorioActividadesPdo($this->pdo()),
                    new RepositorioInscripcionesPdo($this->pdo()),
                    new AjustesPdo($this->pdo()),
                    $this->reloj(),
                    self::generarCodigoCertificado(...),
                ),
                fn () => new GestionarActividades(
                    new RepositorioActividadesPdo($this->pdo()),
                    new RepositorioInscripcionesPdo($this->pdo()),
                    new AjustesPdo($this->pdo()),
                    $this->reloj(),
                    $this->calendarioEditable(),
                ),
                $autenticacion,
                fn () => new EnviarCertificados(
                    new RepositorioActividadesPdo($this->pdo()),
                    new RepositorioInscripcionesPdo($this->pdo()),
                    new CertificadoPdf(dirname(__DIR__) . '/recursos/logo-certificado.jpg'),
                    new EnviadorSmtp(
                        $this->config->texto('SMTP_HOST', 'smtp.gmail.com'),
                        (int) $this->config->texto('SMTP_PUERTO', '465'),
                        $this->config->texto('SMTP_USUARIO'),
                        $this->config->texto('SMTP_CONTRASENA'),
                        $this->config->texto('SMTP_NOMBRE', 'CODE URV'),
                    ),
                    $this->config->texto('CERTIFICADO_PRESIDENTE'),
                    $this->reloj(),
                ),
            ),
            static fn (string $mensaje) => error_log('[codeurv-api] ' . $mensaje),
            new CalendarioControlador(
                fn () => new GestionarCalendario($this->calendarioEditable(), $this->reloj()),
                $autenticacion,
            ),
        );
    }

    /** Google Calendar con permiso de escritura (cuenta de servicio). No conecta hasta que se usa. */
    private function calendarioEditable(): CalendarioGoogleEditable
    {
        return new CalendarioGoogleEditable(
            $this->http,
            new TokenCuentaServicio($this->http, $this->config->texto('GOOGLE_CUENTA_SERVICIO')),
            $this->config->texto('GOOGLE_CALENDAR_ID'),
        );
    }

    /** @return \Closure(): \DateTimeImmutable */
    private function reloj(): \Closure
    {
        return static fn (): \DateTimeImmutable => new \DateTimeImmutable('now', new \DateTimeZone('Europe/Madrid'));
    }

    /** Código público del certificado: 12 caracteres sin letras confusas (0/O, 1/I...). */
    private static function generarCodigoCertificado(): string
    {
        $alfabeto = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        $codigo = '';
        for ($i = 0; $i < 12; $i++) {
            $codigo .= $alfabeto[random_int(0, strlen($alfabeto) - 1)];
        }
        return $codigo;
    }

    private function pdo(): \PDO
    {
        return $this->pdo ??= ConexionPdo::desdeConfig($this->config);
    }
}
