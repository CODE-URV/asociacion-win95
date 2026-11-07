<?php

declare(strict_types=1);

use CodeUrv\Aplicacion\CasosDeUso\Autenticacion;
use CodeUrv\Aplicacion\CasosDeUso\ConsultarEventos;
use CodeUrv\Aplicacion\CasosDeUso\EnviarInscripcion;
use CodeUrv\Aplicacion\CasosDeUso\GestionarProyectos;
use CodeUrv\Aplicacion\Puertos\CalendarioEventos;
use CodeUrv\Aplicacion\Puertos\ReceptorInscripciones;
use CodeUrv\Aplicacion\ServicioNoDisponible;
use CodeUrv\Dominio\Evento;
use CodeUrv\Dominio\SolicitudInscripcion;
use CodeUrv\Infraestructura\BaseDeDatos\RepositorioProyectosPdo;
use CodeUrv\Presentacion\Api;
use CodeUrv\Presentacion\Controladores\ProyectosControlador;
use CodeUrv\Presentacion\Controladores\PublicoControlador;
use CodeUrv\Presentacion\Controladores\SesionControlador;
use CodeUrv\Presentacion\Http\Peticion;
use CodeUrv\Tests\IntentosEnMemoria;
use CodeUrv\Tests\SesionEnMemoria;
use CodeUrv\Tests\UsuariosEnMemoria;

use function CodeUrv\Tests\afirmar;
use function CodeUrv\Tests\igual;
use function CodeUrv\Tests\montarActividades;
use function CodeUrv\Tests\pdoSqlite;

/** Monta la API completa con dobles en memoria y devuelve [atender(), estado compartido]. */
$montar = static function (bool $googleCaido = false): array {
    $pdo = pdoSqlite();
    $sesion = new SesionEnMemoria();
    $usuarios = new UsuariosEnMemoria();
    $usuarios->agregar('admin', 'una-contraseña-larga');
    $errores = new ArrayObject();
    $recibidas = new ArrayObject();

    $calendario = new class ($googleCaido) implements CalendarioEventos {
        public function __construct(private bool $caido)
        {
        }
        public function entre(\DateTimeImmutable $desde, \DateTimeImmutable $hasta): array
        {
            if ($this->caido) {
                throw new ServicioNoDisponible('Google Calendar respondió 403. API key not valid');
            }
            return [new Evento('e1', 'Hackathon', 'Descripción', 'ETSE', '2026-11-20T10:00:00+01:00', false)];
        }
    };
    $receptor = new class ($recibidas) implements ReceptorInscripciones {
        public function __construct(private ArrayObject $recibidas)
        {
        }
        public function enviar(SolicitudInscripcion $solicitud): void
        {
            $this->recibidas[] = $solicitud->aArray();
        }
    };

    $auth = static fn () => new Autenticacion($usuarios, new IntentosEnMemoria(), $sesion, static fn () => time());
    $api = new Api(
        new ProyectosControlador(static fn () => new GestionarProyectos(new RepositorioProyectosPdo($pdo)), $auth),
        new SesionControlador($auth),
        new PublicoControlador(
            static fn () => new ConsultarEventos($calendario),
            static fn () => new EnviarInscripcion($receptor),
        ),
        montarActividades($pdo, $auth, static fn () => new \DateTimeImmutable()),
        static function (string $m) use ($errores) { $errores[] = $m; },
    );

    $atender = static function (string $metodo, string $ruta, ?array $json = null, array $cabeceras = [], array $consulta = []) use ($api) {
        if ($json !== null) {
            $cabeceras['content-type'] = 'application/json';
        }
        return $api->atender(new Peticion($metodo, $ruta, $consulta, $cabeceras, $json === null ? '' : json_encode($json), '127.0.0.1'));
    };

    return [$atender, $sesion, $errores, $recibidas, $api];
};

$proyecto = ['nombre' => 'Web', 'estado' => 'En Progreso', 'progreso' => 50, 'tecnologias' => ['React']];

return [
    'GET /proyectos es público' => static function () use ($montar) {
        [$atender] = $montar();
        $r = $atender('GET', '/proyectos');
        igual(200, $r->estado);
        igual(['proyectos' => []], $r->datos);
    },

    'crear proyecto sin sesión → 401; con sesión pero sin CSRF → 401' => static function () use ($montar, $proyecto) {
        [$atender] = $montar();
        igual(401, $atender('POST', '/proyectos', $proyecto)->estado);
        $atender('POST', '/sesion', ['usuario' => 'admin', 'contrasena' => 'una-contraseña-larga']);
        igual(401, $atender('POST', '/proyectos', $proyecto)->estado);
    },

    'flujo de admin completo: login, crear, editar, borrar, logout' => static function () use ($montar, $proyecto) {
        [$atender] = $montar();
        $login = $atender('POST', '/sesion', ['usuario' => 'admin', 'contrasena' => 'una-contraseña-larga']);
        igual(200, $login->estado);
        $csrf = ['x-csrf-token' => $login->datos['csrf']];

        $creado = $atender('POST', '/proyectos', $proyecto, $csrf);
        igual(201, $creado->estado);
        $id = $creado->datos['proyecto']['id'];

        $editado = $atender('PUT', "/proyectos/{$id}", ['progreso' => 90] + $proyecto, $csrf);
        igual(90, $editado->datos['proyecto']['progreso']);

        igual(422, $atender('PUT', "/proyectos/{$id}", ['nombre' => ''] + $proyecto, $csrf)->estado);
        igual(404, $atender('PUT', '/proyectos/999', $proyecto, $csrf)->estado);
        igual(204, $atender('DELETE', "/proyectos/{$id}", null, $csrf)->estado);

        igual(204, $atender('DELETE', '/sesion', null, $csrf)->estado);
        igual(['usuario' => null, 'csrf' => null], $atender('GET', '/sesion')->datos);
    },

    'error de validación devuelve 422 con los detalles por campo' => static function () use ($montar) {
        [$atender] = $montar();
        $r = $atender('POST', '/inscripciones', ['nombre' => '']);
        igual(422, $r->estado);
        afirmar(isset($r->datos['detalles']['nombre']), 'Faltan los detalles del campo nombre');
    },

    'inscripción válida llega al receptor con el formato de la hoja' => static function () use ($montar) {
        [$atender, , , $recibidas] = $montar();
        $r = $atender('POST', '/inscripciones', [
            'socioAnterior' => SolicitudInscripcion::SOCIO_NUEVO, 'grado' => 'GEI', 'curso' => '2n', 'talla' => 'L',
            'nombre' => 'Ana', 'correo' => 'ana@urv.cat', 'telefono' => '600',
        ]);
        igual(201, $r->estado);
        igual('L', $recibidas[0]['talla']);
    },

    'eventos: formato propio, no el de Google' => static function () use ($montar) {
        [$atender] = $montar();
        $r = $atender('GET', '/eventos', null, [], ['desde' => '2026-11-01T00:00:00Z', 'hasta' => '2026-11-30T23:59:59Z']);
        igual(200, $r->estado);
        igual(['id', 'titulo', 'descripcion', 'lugar', 'inicio', 'todoElDia'], array_keys($r->datos['eventos'][0]));
    },

    'si Google falla: 502 genérico al navegador y el detalle al log' => static function () use ($montar) {
        [$atender, , $errores] = $montar(true);
        $r = $atender('GET', '/eventos', null, [], ['desde' => '2026-11-01', 'hasta' => '2026-11-30']);
        igual(502, $r->estado);
        afirmar(!str_contains(json_encode($r->datos), 'API key'), 'El detalle interno no debe llegar al navegador');
        afirmar(str_contains($errores[0], 'API key'), 'El detalle debe ir al log');
    },

    'rutas y métodos desconocidos, JSON inválido y Content-Type incorrecto' => static function () use ($montar) {
        [$atender, , , , $api] = $montar();
        igual(404, $atender('GET', '/no-existe')->estado);
        $r = $atender('PATCH', '/proyectos');
        igual(405, $r->estado);
        afirmar(str_contains($r->cabeceras['Allow'], 'POST'));

        $roto = new Peticion('POST', '/sesion', [], ['content-type' => 'application/json'], '{roto', '1.1.1.1');
        igual(400, $api->atender($roto)->estado);
        $sinTipo = new Peticion('POST', '/sesion', [], ['content-type' => 'text/plain'], '{}', '1.1.1.1');
        igual(400, $api->atender($sinTipo)->estado);
    },
];
