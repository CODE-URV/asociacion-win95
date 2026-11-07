<?php

declare(strict_types=1);

use CodeUrv\Aplicacion\CasosDeUso\Autenticacion;
use CodeUrv\Aplicacion\CasosDeUso\ConsultarEventos;
use CodeUrv\Aplicacion\CasosDeUso\GestionarProyectos;
use CodeUrv\Aplicacion\CredencialesIncorrectas;
use CodeUrv\Aplicacion\DemasiadosIntentos;
use CodeUrv\Aplicacion\NoAutorizado;
use CodeUrv\Aplicacion\Puertos\CalendarioEventos;
use CodeUrv\Dominio\ErrorDeValidacion;
use CodeUrv\Dominio\NoEncontrado;
use CodeUrv\Infraestructura\BaseDeDatos\RepositorioProyectosPdo;
use CodeUrv\Tests\IntentosEnMemoria;
use CodeUrv\Tests\SesionEnMemoria;
use CodeUrv\Tests\UsuariosEnMemoria;

use function CodeUrv\Tests\afirmar;
use function CodeUrv\Tests\igual;
use function CodeUrv\Tests\lanza;
use function CodeUrv\Tests\pdoSqlite;

$montar = static function (): array {
    $usuarios = new UsuariosEnMemoria();
    $usuarios->agregar('admin', 'una-contraseña-larga');
    $intentos = new IntentosEnMemoria();
    $sesion = new SesionEnMemoria();
    $reloj = new class { public int $ahora = 1_800_000_000; };
    $auth = new Autenticacion($usuarios, $intentos, $sesion, static fn () => $reloj->ahora);
    return [$auth, $sesion, $intentos, $reloj];
};

return [
    'login correcto inicia sesión y devuelve token CSRF' => static function () use ($montar) {
        [$auth, $sesion] = $montar();
        $r = $auth->iniciarSesion('admin', 'una-contraseña-larga', '1.2.3.4');
        igual('admin', $r['usuario']['nombre']);
        igual($sesion->csrf, $r['csrf']);
        igual('admin', $auth->sesionActual()['usuario']['nombre']);
    },

    'contraseña incorrecta o usuario inexistente: mismo error' => static function () use ($montar) {
        [$auth, $sesion] = $montar();
        $a = lanza(CredencialesIncorrectas::class, static fn () => $auth->iniciarSesion('admin', 'mal', '1.2.3.4'));
        $b = lanza(CredencialesIncorrectas::class, static fn () => $auth->iniciarSesion('nadie', 'mal', '1.2.3.4'));
        igual($a->getMessage(), $b->getMessage());
        igual(null, $sesion->usuario);
    },

    'tras 5 fallos se bloquea 15 minutos, aunque luego acierte' => static function () use ($montar) {
        [$auth, , , $reloj] = $montar();
        for ($i = 0; $i < Autenticacion::MAX_FALLOS; $i++) {
            lanza(CredencialesIncorrectas::class, static fn () => $auth->iniciarSesion('admin', 'mal', '9.9.9.9'));
        }
        lanza(DemasiadosIntentos::class, static fn () => $auth->iniciarSesion('admin', 'una-contraseña-larga', '9.9.9.9'));
        $reloj->ahora += Autenticacion::VENTANA_SEGUNDOS + 1;
        $auth->iniciarSesion('admin', 'una-contraseña-larga', '9.9.9.9');
    },

    'el bloqueo también es por usuario aunque cambie la IP' => static function () use ($montar) {
        [$auth] = $montar();
        for ($i = 0; $i < Autenticacion::MAX_FALLOS; $i++) {
            lanza(CredencialesIncorrectas::class, static fn () => $auth->iniciarSesion('admin', 'mal', "10.0.0.{$i}"));
        }
        lanza(DemasiadosIntentos::class, static fn () => $auth->iniciarSesion('admin', 'una-contraseña-larga', '10.0.0.99'));
    },

    'exigirAdmin: sin sesión, sin CSRF o con CSRF falso → NoAutorizado' => static function () use ($montar) {
        [$auth] = $montar();
        lanza(NoAutorizado::class, static fn () => $auth->exigirAdmin(null, false));
        $csrf = $auth->iniciarSesion('admin', 'una-contraseña-larga', '1.2.3.4')['csrf'];
        igual('admin', $auth->exigirAdmin(null, false)); // leer no necesita CSRF
        lanza(NoAutorizado::class, static fn () => $auth->exigirAdmin(null, true));
        lanza(NoAutorizado::class, static fn () => $auth->exigirAdmin('falso', true));
        igual('admin', $auth->exigirAdmin($csrf, true));
    },

    'gestionar proyectos: crear, actualizar, eliminar y errores' => static function () {
        $casos = new GestionarProyectos(new RepositorioProyectosPdo(pdoSqlite()));
        $datos = ['nombre' => 'Bot de Discord', 'estado' => 'Planificación', 'progreso' => 0, 'tecnologias' => ['Python']];

        $creado = $casos->crear($datos);
        afirmar($creado->id !== null);
        $actualizado = $casos->actualizar($creado->id, ['progreso' => 40, 'estado' => 'En Progreso'] + $datos);
        igual(40, $actualizado->progreso);
        igual(1, count($casos->listar()));

        lanza(NoEncontrado::class, static fn () => $casos->actualizar(999, $datos));
        lanza(ErrorDeValidacion::class, static fn () => $casos->crear(['nombre' => '']));
        $casos->eliminar($creado->id);
        igual([], $casos->listar());
        lanza(NoEncontrado::class, static fn () => $casos->eliminar($creado->id));
    },

    'consultar eventos valida las fechas antes de llamar a Google' => static function () {
        $calendario = new class implements CalendarioEventos {
            public int $llamadas = 0;
            public function entre(\DateTimeImmutable $desde, \DateTimeImmutable $hasta): array
            {
                $this->llamadas++;
                return [];
            }
        };
        $casos = new ConsultarEventos($calendario);
        lanza(ErrorDeValidacion::class, static fn () => $casos->entre('no-es-fecha', '2026-11-30'));
        lanza(ErrorDeValidacion::class, static fn () => $casos->entre('2026-12-01', '2026-11-01'));
        lanza(ErrorDeValidacion::class, static fn () => $casos->entre('2020-01-01', '2026-01-01'));
        igual(0, $calendario->llamadas);
        $casos->entre('2026-11-01T00:00:00Z', '2026-11-30T23:59:59Z');
        igual(1, $calendario->llamadas);
    },
];
