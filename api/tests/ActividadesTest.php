<?php

declare(strict_types=1);

use CodeUrv\Aplicacion\CasosDeUso\Autenticacion;
use CodeUrv\Dominio\Actividad;
use CodeUrv\Dominio\CodigoAsistencia;
use CodeUrv\Dominio\ErrorDeValidacion;
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
use function CodeUrv\Tests\lanza;
use function CodeUrv\Tests\montarActividades;
use function CodeUrv\Tests\pdoSqlite;

date_default_timezone_set('Europe/Madrid');

$datosActividad = static fn (array $cambios = []) => array_merge([
    'titulo' => 'Install Party DEIM x CodeURV',
    'tipo' => 'Taller',
    'descripcion' => "Configura el teu entorn.\nPorta el portàtil.",
    'informacionExtra' => 'Pendrive de 32 GB per a Linux.',
    'lugar' => 'Planta baixa CRAI',
    'inicio' => '2026-11-19T16:00',
    'fin' => '2026-11-19T19:00',
    'ponente' => 'Jordi Duch',
    'plazas' => null,
    'publicada' => true,
    'inscripcionesAbiertas' => true,
], $cambios);

$datosPersona = static fn (array $cambios = []) => array_merge([
    'email' => 'Ana.Perez@estudiants.urv.cat',
    'nombre' => 'Ana',
    'apellidos' => 'Pérez Martí',
    'grado' => 'Grau en Enginyeria Informàtica',
    'curso' => '1er',
    'confirmaAsistencia' => true,
    'aceptaPrivacidad' => true,
], $cambios);

/** API completa con SQLite y un reloj que el test puede mover. */
$montar = static function () {
    $pdo = pdoSqlite();
    $sesion = new SesionEnMemoria();
    $usuarios = new UsuariosEnMemoria();
    $usuarios->agregar('admin', 'una-contraseña-larga');
    $reloj = new class { public \DateTimeImmutable $ahora; };
    $reloj->ahora = new \DateTimeImmutable('2026-11-10 12:00');
    $relojCierre = static fn () => $reloj->ahora;

    $auth = static fn () => new Autenticacion($usuarios, new IntentosEnMemoria(), $sesion, static fn () => $reloj->ahora->getTimestamp());
    $nada = static fn () => throw new \LogicException('no usado');
    $api = new Api(
        new ProyectosControlador($nada, $auth),
        new SesionControlador($auth),
        new PublicoControlador($nada, $nada),
        montarActividades($pdo, $auth, $relojCierre),
        static function (string $m) { throw new \RuntimeException($m); },
    );

    $csrf = null;
    $atender = static function (string $metodo, string $ruta, ?array $json = null) use ($api, &$csrf) {
        $cabeceras = $json !== null ? ['content-type' => 'application/json'] : [];
        if ($csrf !== null) {
            $cabeceras['x-csrf-token'] = $csrf;
        }
        return $api->atender(new Peticion($metodo, $ruta, [], $cabeceras, $json === null ? '' : json_encode($json), '127.0.0.1'));
    };
    $entrarComoAdmin = static function () use ($atender, &$csrf) {
        $csrf = $atender('POST', '/sesion', ['usuario' => 'admin', 'contrasena' => 'una-contraseña-larga'])->datos['csrf'];
    };

    return [$atender, $entrarComoAdmin, $reloj];
};

return [
    // ---------- Dominio ----------

    'actividad: valida fechas, tipo y plazas' => static function () use ($datosActividad) {
        $e = lanza(ErrorDeValidacion::class, static fn () => Actividad::desdeDatos($datosActividad([
            'fin' => '2026-11-19T15:00', 'tipo' => 'Fiesta', 'plazas' => 0, 'titulo' => '',
        ])));
        $campos = array_keys($e->errores);
        sort($campos);
        igual(['fin', 'plazas', 'tipo', 'titulo'], $campos);
        lanza(ErrorDeValidacion::class, static fn () => Actividad::desdeDatos($datosActividad(['inicio' => '19/11/2026 16:00'])));
    },

    'actividad: motivos por los que no se puede apuntar' => static function () use ($datosActividad) {
        $antes = new \DateTimeImmutable('2026-11-10 12:00');
        igual(null, Actividad::desdeDatos($datosActividad())->motivoInscripcionCerrada($antes, 0));
        afirmar(Actividad::desdeDatos($datosActividad(['publicada' => false]))->motivoInscripcionCerrada($antes, 0) !== null);
        afirmar(Actividad::desdeDatos($datosActividad(['inscripcionesAbiertas' => false]))->motivoInscripcionCerrada($antes, 0) !== null);
        igual('No quedan plazas.', Actividad::desdeDatos($datosActividad(['plazas' => 2]))->motivoInscripcionCerrada($antes, 2));
        igual('Esta actividad ya ha terminado.', Actividad::desdeDatos($datosActividad())->motivoInscripcionCerrada(new \DateTimeImmutable('2026-11-19 19:00'), 0));
    },

    'actividad: la asistencia se registra de 30 min antes a 1 h después' => static function () use ($datosActividad) {
        $a = Actividad::desdeDatos($datosActividad());
        afirmar(!$a->admiteAsistencia(new \DateTimeImmutable('2026-11-19 15:29')));
        afirmar($a->admiteAsistencia(new \DateTimeImmutable('2026-11-19 15:30')));
        afirmar($a->admiteAsistencia(new \DateTimeImmutable('2026-11-19 20:00')));
        afirmar(!$a->admiteAsistencia(new \DateTimeImmutable('2026-11-19 20:01')));
    },

    'código QR: vale ~1 minuto y solo para su actividad' => static function () {
        $t = 1_800_000_000;
        $codigo = CodigoAsistencia::generar('secreto', 7, $t);
        afirmar(CodigoAsistencia::esValido('secreto', 7, strtolower($codigo), $t + 30));
        afirmar(CodigoAsistencia::esValido('secreto', 7, $codigo, $t + 60));
        afirmar(!CodigoAsistencia::esValido('secreto', 7, $codigo, $t + 120));
        afirmar(!CodigoAsistencia::esValido('secreto', 8, $codigo, $t));
        afirmar(!CodigoAsistencia::esValido('otro', 7, $codigo, $t));
    },

    'pase: 15 minutos, ligado a la actividad y sin poder manipularlo' => static function () {
        $t = 1_800_000_000;
        $pase = CodigoAsistencia::crearPase('secreto', 7, $t);
        afirmar(CodigoAsistencia::paseValido('secreto', 7, $pase, $t + 899));
        afirmar(!CodigoAsistencia::paseValido('secreto', 7, $pase, $t + 901));
        afirmar(!CodigoAsistencia::paseValido('secreto', 8, $pase, $t));
        [$id, $caduca, $firma] = explode('.', $pase);
        afirmar(!CodigoAsistencia::paseValido('secreto', 7, "{$id}." . ($caduca + 3600) . ".{$firma}", $t));
    },

    // ---------- Flujo completo por la API ----------

    'sin sesión de admin no se gestionan actividades' => static function () use ($montar, $datosActividad) {
        [$atender] = $montar();
        igual(401, $atender('GET', '/admin/actividades')->estado);
        igual(401, $atender('POST', '/admin/actividades', $datosActividad())->estado);
    },

    'inscripción: lista pública, validación, duplicados y plazas' => static function () use ($montar, $datosActividad, $datosPersona) {
        [$atender, $entrarComoAdmin] = $montar();
        $entrarComoAdmin();
        $id = $atender('POST', '/admin/actividades', $datosActividad(['plazas' => 2]))->datos['actividad']['id'];
        $atender('POST', '/admin/actividades', $datosActividad(['titulo' => 'Borrador', 'publicada' => false]));

        $lista = $atender('GET', '/actividades')->datos['actividades'];
        igual(1, count($lista)); // el borrador no se ve
        igual(2, $lista[0]['plazasLibres']);

        $sinConfirmar = $atender('POST', "/actividades/{$id}/inscripciones", $datosPersona(['confirmaAsistencia' => false]));
        igual(422, $sinConfirmar->estado);
        afirmar(isset($sinConfirmar->datos['detalles']['confirmaAsistencia']));

        igual(201, $atender('POST', "/actividades/{$id}/inscripciones", $datosPersona())->estado);
        $repetida = $atender('POST', "/actividades/{$id}/inscripciones", $datosPersona(['email' => 'ana.perez@ESTUDIANTS.urv.cat']));
        igual(409, $repetida->estado);

        igual(201, $atender('POST', "/actividades/{$id}/inscripciones", $datosPersona(['email' => 'b@urv.cat']))->estado);
        $llena = $atender('POST', "/actividades/{$id}/inscripciones", $datosPersona(['email' => 'c@urv.cat']));
        igual(409, $llena->estado);
        igual('No quedan plazas.', $llena->datos['error']);
        igual(0, $atender('GET', '/actividades')->datos['actividades'][0]['plazasLibres']);
    },

    'asistencia con QR: inscrito, persona nueva en la puerta, repetida y caducada' => static function () use ($montar, $datosActividad, $datosPersona) {
        [$atender, $entrarComoAdmin, $reloj] = $montar();
        $entrarComoAdmin();
        $id = $atender('POST', '/admin/actividades', $datosActividad())->datos['actividad']['id'];
        $atender('POST', "/actividades/{$id}/inscripciones", $datosPersona());

        // Antes de la actividad no se puede
        $codigo = $atender('GET', "/admin/actividades/{$id}/qr")->datos['codigo'];
        igual(403, $atender('POST', "/actividades/{$id}/pase", ['codigo' => $codigo])->estado);

        // Durante la actividad
        $reloj->ahora = new \DateTimeImmutable('2026-11-19 16:10');
        $qr = $atender('GET', "/admin/actividades/{$id}/qr")->datos;
        afirmar($qr['cambiaEn'] > $qr['ahora']);
        $pase = $atender('POST', "/actividades/{$id}/pase", ['codigo' => $qr['codigo']])->datos['pase'];

        $r = $atender('POST', "/actividades/{$id}/asistencia", ['pase' => $pase, 'email' => ' ANA.PEREZ@estudiants.urv.cat ']);
        igual(['registrada' => true, 'yaRegistrada' => false, 'nombre' => 'Ana'], $r->datos);
        igual(true, $atender('POST', "/actividades/{$id}/asistencia", ['pase' => $pase, 'email' => 'ana.perez@estudiants.urv.cat'])->datos['yaRegistrada']);

        // Alguien que no se apuntó: primero se le piden los datos, luego queda inscrito y presente
        igual(['requiereDatos' => true], $atender('POST', "/actividades/{$id}/asistencia", ['pase' => $pase, 'email' => 'nuevo@urv.cat'])->datos);
        $nuevo = $atender('POST', "/actividades/{$id}/asistencia", ['pase' => $pase] + $datosPersona(['email' => 'nuevo@urv.cat', 'nombre' => 'Pau']));
        igual('Pau', $nuevo->datos['nombre']);

        // Un QR de hace 2 minutos ya no sirve; un pase de hace 20 tampoco
        $reloj->ahora = new \DateTimeImmutable('2026-11-19 16:12');
        igual(403, $atender('POST', "/actividades/{$id}/pase", ['codigo' => $qr['codigo']])->estado);
        $reloj->ahora = new \DateTimeImmutable('2026-11-19 16:31');
        igual(403, $atender('POST', "/actividades/{$id}/asistencia", ['pase' => $pase, 'email' => 'nuevo@urv.cat'])->estado);

        // El admin ve quién ha venido
        $inscritos = $atender('GET', "/admin/actividades/{$id}/inscripciones")->datos['inscripciones'];
        igual(2, count($inscritos));
        igual(2, count(array_filter($inscritos, static fn ($i) => $i['asistioEn'] !== null)));
        $resumen = $atender('GET', '/admin/actividades')->datos['actividades'][0];
        igual([2, 2], [$resumen['inscritos'], $resumen['asistentes']]);
    },

    'admin: marcar asistencia a mano, borrar inscripción y borrar actividad' => static function () use ($montar, $datosActividad, $datosPersona) {
        [$atender, $entrarComoAdmin] = $montar();
        $entrarComoAdmin();
        $id = $atender('POST', '/admin/actividades', $datosActividad())->datos['actividad']['id'];
        $atender('POST', "/actividades/{$id}/inscripciones", $datosPersona());
        $iid = $atender('GET', "/admin/actividades/{$id}/inscripciones")->datos['inscripciones'][0]['id'];

        $marcada = $atender('PUT', "/admin/actividades/{$id}/inscripciones/{$iid}", ['asistio' => true]);
        afirmar($marcada->datos['inscripcion']['asistioEn'] !== null);
        $desmarcada = $atender('PUT', "/admin/actividades/{$id}/inscripciones/{$iid}", ['asistio' => false]);
        igual(null, $desmarcada->datos['inscripcion']['asistioEn']);

        igual(404, $atender('DELETE', "/admin/actividades/999/inscripciones/{$iid}")->estado);
        igual(204, $atender('DELETE', "/admin/actividades/{$id}/inscripciones/{$iid}")->estado);
        igual(204, $atender('DELETE', "/admin/actividades/{$id}")->estado);
        igual([], $atender('GET', '/admin/actividades')->datos['actividades']);
    },
];
