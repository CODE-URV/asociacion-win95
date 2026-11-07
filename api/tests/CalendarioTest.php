<?php

declare(strict_types=1);

use CodeUrv\Aplicacion\CasosDeUso\Autenticacion;
use CodeUrv\Aplicacion\CasosDeUso\GestionarActividades;
use CodeUrv\Aplicacion\CasosDeUso\GestionarCalendario;
use CodeUrv\Aplicacion\Puertos\CalendarioEditable;
use CodeUrv\Aplicacion\ServicioNoDisponible;
use CodeUrv\Dominio\ErrorDeValidacion;
use CodeUrv\Dominio\Evento;
use CodeUrv\Infraestructura\BaseDeDatos\AjustesPdo;
use CodeUrv\Infraestructura\BaseDeDatos\RepositorioActividadesPdo;
use CodeUrv\Infraestructura\BaseDeDatos\RepositorioInscripcionesPdo;
use CodeUrv\Infraestructura\Google\CalendarioGoogleEditable;
use CodeUrv\Infraestructura\Google\EventoGoogle;
use CodeUrv\Infraestructura\Google\TokenCuentaServicio;
use CodeUrv\Infraestructura\Http\ClienteHttp;
use CodeUrv\Presentacion\Api;
use CodeUrv\Presentacion\Controladores\ActividadesControlador;
use CodeUrv\Presentacion\Controladores\CalendarioControlador;
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
use function CodeUrv\Tests\pdoSqlite;

date_default_timezone_set('Europe/Madrid');

/** Calendario en memoria que puede fallar como Google. */
final class CalendarioEnMemoria implements CalendarioEditable
{
    /** @var array<string, Evento> */
    public array $eventos = [];
    public bool $caido = false;
    private int $siguiente = 1;

    public function entre(\DateTimeImmutable $desde, \DateTimeImmutable $hasta): array
    {
        $this->comprobar();
        return array_values($this->eventos);
    }

    public function crear(Evento $evento): Evento
    {
        $this->comprobar();
        $conId = $evento->conId('ev' . $this->siguiente++);
        return $this->eventos[$conId->id] = $conId;
    }

    public function actualizar(Evento $evento): Evento
    {
        $this->comprobar();
        return $this->eventos[$evento->id] = $evento;
    }

    public function eliminar(string $id): void
    {
        $this->comprobar();
        unset($this->eventos[$id]);
    }

    private function comprobar(): void
    {
        if ($this->caido) {
            throw new ServicioNoDisponible('Google Calendar respondió 403. Forbidden');
        }
    }
}

/** Cliente HTTP falso que apunta las peticiones y responde lo programado. */
final class HttpFalso extends ClienteHttp
{
    /** @var list<array{metodo: string, url: string, cabeceras: list<string>, cuerpo: string|null}> */
    public array $peticiones = [];
    /** @var list<array{0: int, 1: string}> */
    public array $respuestas = [];

    public function peticion(string $metodo, string $url, array $cabeceras = [], ?string $cuerpo = null): array
    {
        $this->peticiones[] = compact('metodo', 'url', 'cabeceras', 'cuerpo');
        return array_shift($this->respuestas) ?? [200, '{}'];
    }
}

/** JSON de cuenta de servicio con una clave RSA generada para el test. */
$cuentaDePrueba = static function (): array {
    $config = is_file('C:/Program Files/Git/usr/ssl/openssl.cnf') ? ['config' => 'C:/Program Files/Git/usr/ssl/openssl.cnf'] : [];
    $clave = openssl_pkey_new(['private_key_bits' => 2048, 'private_key_type' => OPENSSL_KEYTYPE_RSA] + $config);
    openssl_pkey_export($clave, $privada, null, $config);
    $publica = openssl_pkey_get_details($clave)['key'];
    $ruta = tempnam(sys_get_temp_dir(), 'cuenta') . '.json';
    file_put_contents($ruta, json_encode([
        'client_email' => 'web@codeurv.iam.gserviceaccount.com',
        'private_key' => $privada,
        'token_uri' => 'https://oauth2.googleapis.com/token',
    ]));
    return [$ruta, $publica];
};

$datosActividad = static fn (array $cambios = []) => array_merge([
    'titulo' => 'Cómo afrontar tu primera Hackathon', 'tipo' => 'Charla', 'descripcion' => 'Consejos.',
    'informacionExtra' => '', 'lugar' => 'Aula 101', 'inicio' => '2026-11-18T15:10', 'fin' => '2026-11-18T16:10',
    'ponente' => 'Eric Riveiro i Gaizka Alonso', 'plazas' => null, 'publicada' => true, 'inscripcionesAbiertas' => true,
    'enCalendario' => true,
], $cambios);

$montarGestion = static function (CalendarioEnMemoria $calendario): GestionarActividades {
    $pdo = pdoSqlite();
    return new GestionarActividades(
        new RepositorioActividadesPdo($pdo),
        new RepositorioInscripcionesPdo($pdo),
        new AjustesPdo($pdo),
        static fn () => new \DateTimeImmutable('2026-11-10 12:00'),
        $calendario,
    );
};

return [
    // ---------- Dominio ----------

    'evento: valida título y fechas; todo el día usa solo fecha' => static function () {
        $e = Evento::desdeDatos(['titulo' => 'Hackathon', 'todoElDia' => true, 'inicio' => '2026-12-05', 'fin' => '2026-12-06']);
        igual(['2026-12-05', '2026-12-06'], [$e->inicio, $e->fin]);
        $error = lanza(ErrorDeValidacion::class, static fn () => Evento::desdeDatos([
            'titulo' => '', 'todoElDia' => false, 'inicio' => '2026-12-05T18:00', 'fin' => '2026-12-05T17:00',
        ]));
        $campos = array_keys($error->errores);
        sort($campos);
        igual(['fin', 'titulo'], $campos);
        lanza(ErrorDeValidacion::class, static fn () => Evento::desdeDatos(['titulo' => 'x', 'todoElDia' => true, 'inicio' => '2026-12-05T10:00', 'fin' => '2026-12-05']));
    },

    // ---------- Infraestructura ----------

    'Google: fechas a hora local y fin de día completo exclusivo en ambos sentidos' => static function () {
        $conHora = EventoGoogle::desdeApi(['id' => 'a', 'summary' => 'Charla', 'start' => ['dateTime' => '2026-11-18T14:10:00Z'], 'end' => ['dateTime' => '2026-11-18T15:10:00Z']]);
        igual(['2026-11-18T15:10', '2026-11-18T16:10', false], [$conHora->inicio, $conHora->fin, $conHora->todoElDia]);

        $diaCompleto = EventoGoogle::desdeApi(['id' => 'b', 'summary' => 'Hackathon', 'start' => ['date' => '2026-12-05'], 'end' => ['date' => '2026-12-07']]);
        igual(['2026-12-05', '2026-12-06', true], [$diaCompleto->inicio, $diaCompleto->fin, $diaCompleto->todoElDia]);

        igual(['date' => '2026-12-07'], EventoGoogle::aApi($diaCompleto)['end']);
        igual(['dateTime' => '2026-11-18T15:10:00', 'timeZone' => 'Europe/Madrid'], EventoGoogle::aApi($conHora)['start']);
    },

    'cuenta de servicio: JWT RS256 firmado y verificable, y el token se reutiliza' => static function () use ($cuentaDePrueba) {
        [$ruta, $publica] = $cuentaDePrueba();
        $http = new HttpFalso();
        $http->respuestas = [[200, '{"access_token":"tok-123","expires_in":3600}']];
        $token = new TokenCuentaServicio($http, $ruta, TokenCuentaServicio::PERMISO_CALENDARIO, static fn () => 1_800_000_000);

        igual('tok-123', $token->obtener());
        igual('tok-123', $token->obtener()); // no vuelve a pedirlo
        igual(1, count($http->peticiones));

        parse_str((string) $http->peticiones[0]['cuerpo'], $formulario);
        igual('urn:ietf:params:oauth:grant-type:jwt-bearer', $formulario['grant_type']);
        [$cab, $recl, $firma] = explode('.', $formulario['assertion']);
        $decodificar = static fn ($p) => base64_decode(strtr($p, '-_', '+/'));
        igual(1, openssl_verify("{$cab}.{$recl}", $decodificar($firma), $publica, OPENSSL_ALGO_SHA256));
        $reclamaciones = json_decode($decodificar($recl), true);
        igual('web@codeurv.iam.gserviceaccount.com', $reclamaciones['iss']);
        igual(TokenCuentaServicio::PERMISO_CALENDARIO, $reclamaciones['scope']);
        igual(1_800_000_000 + 3600, $reclamaciones['exp']);
        @unlink($ruta);
    },

    'calendario editable: peticiones correctas a la API y error claro si falta permiso' => static function () use ($cuentaDePrueba) {
        [$ruta] = $cuentaDePrueba();
        $http = new HttpFalso();
        $http->respuestas = [
            [200, '{"access_token":"tok","expires_in":3600}'],
            [200, '{"id":"nuevo123"}'],
            [204, ''],
            [404, '{"error":{"message":"Not Found"}}'],
            [403, '{"error":{"message":"Forbidden"}}'],
        ];
        $calendario = new CalendarioGoogleEditable($http, new TokenCuentaServicio($http, $ruta), 'codeurv@group.calendar.google.com');

        $creado = $calendario->crear(Evento::desdeDatos(['titulo' => 'Charla', 'todoElDia' => false, 'inicio' => '2026-11-18T15:10', 'fin' => '2026-11-18T16:10']));
        igual('nuevo123', $creado->id);
        igual('POST', $http->peticiones[1]['metodo']);
        afirmar(str_contains($http->peticiones[1]['url'], 'codeurv%40group.calendar.google.com/events'));
        afirmar(in_array('Authorization: Bearer tok', $http->peticiones[1]['cabeceras'], true));

        $calendario->eliminar('nuevo123');
        $calendario->eliminar('ya-no-existe'); // 404 al borrar: no es error
        igual('DELETE', $http->peticiones[3]['metodo']);

        $error = lanza(ServicioNoDisponible::class, static fn () => $calendario->actualizar($creado));
        afirmar(str_contains($error->getMessage(), 'compartido el calendario'), 'Debe dar la pista de compartir el calendario');
        @unlink($ruta);

        $sinCuenta = new CalendarioGoogleEditable(new HttpFalso(), new TokenCuentaServicio(new HttpFalso(), ''), 'x');
        $falta = lanza(ServicioNoDisponible::class, static fn () => $sinCuenta->entre(new \DateTimeImmutable(), new \DateTimeImmutable()));
        afirmar(str_contains($falta->getMessage(), 'GOOGLE_CUENTA_SERVICIO'));
    },

    // ---------- Sincronización de actividades ----------

    'actividad publicada y marcada: se crea, se actualiza y se quita del calendario' => static function () use ($montarGestion, $datosActividad) {
        $calendario = new CalendarioEnMemoria();
        $gestion = $montarGestion($calendario);

        $r = $gestion->crear($datosActividad());
        igual(null, $r['aviso']);
        $id = $r['actividad']->id;
        $eventoId = $r['actividad']->eventoCalendarioId;
        afirmar($eventoId !== null);
        igual('Cómo afrontar tu primera Hackathon', $calendario->eventos[$eventoId]->titulo);
        afirmar(str_contains($calendario->eventos[$eventoId]->descripcion, 'Eric Riveiro i Gaizka Alonso'));

        $gestion->actualizar($id, $datosActividad(['lugar' => 'Sala de Graus']));
        igual('Sala de Graus', $calendario->eventos[$eventoId]->lugar);
        igual(1, count($calendario->eventos));

        $despublicada = $gestion->actualizar($id, $datosActividad(['publicada' => false]));
        igual([], $calendario->eventos);
        igual(null, $despublicada['actividad']->eventoCalendarioId);

        $gestion->actualizar($id, $datosActividad());
        igual(1, count($calendario->eventos));
        igual(null, $gestion->eliminar($id));
        igual([], $calendario->eventos);
    },

    'sin marcar "en el calendario" no se toca Google' => static function () use ($montarGestion, $datosActividad) {
        $calendario = new CalendarioEnMemoria();
        $calendario->caido = true; // si se llamara, fallaría
        $r = $montarGestion($calendario)->crear($datosActividad(['enCalendario' => false]));
        igual(null, $r['aviso']);
        igual(null, $r['actividad']->eventoCalendarioId);
    },

    'si Google falla, la actividad se guarda igual y vuelve un aviso' => static function () use ($montarGestion, $datosActividad) {
        $calendario = new CalendarioEnMemoria();
        $calendario->caido = true;
        $gestion = $montarGestion($calendario);
        $r = $gestion->crear($datosActividad());
        afirmar(str_contains((string) $r['aviso'], 'no se ha podido actualizar'));
        afirmar($r['actividad']->id !== null);
        igual(1, count($gestion->listar()));

        // Cuando Google vuelve, al guardar otra vez se crea el evento
        $calendario->caido = false;
        $gestion->actualizar($r['actividad']->id, $datosActividad());
        igual(1, count($calendario->eventos));
    },

    // ---------- API del panel ----------

    'API /admin/eventos: solo admin, CRUD y errores de Google visibles' => static function () {
        $calendario = new CalendarioEnMemoria();
        $sesion = new SesionEnMemoria();
        $usuarios = new UsuariosEnMemoria();
        $usuarios->agregar('admin', 'una-contraseña-larga');
        $reloj = static fn () => new \DateTimeImmutable('2026-11-10 12:00');
        $auth = static fn () => new Autenticacion($usuarios, new IntentosEnMemoria(), $sesion, static fn () => time());
        $nada = static fn () => throw new \LogicException('no usado');
        $api = new Api(
            new ProyectosControlador($nada, $auth),
            new SesionControlador($auth),
            new PublicoControlador($nada, $nada),
            new ActividadesControlador($nada, $nada, $auth, $nada),
            static function (string $m) { throw new \RuntimeException($m); },
            new CalendarioControlador(static fn () => new GestionarCalendario($calendario, $reloj), $auth),
        );
        $csrf = null;
        $atender = static function (string $metodo, string $ruta, ?array $json = null) use ($api, &$csrf) {
            $cabeceras = $json !== null ? ['content-type' => 'application/json'] : [];
            if ($csrf) {
                $cabeceras['x-csrf-token'] = $csrf;
            }
            return $api->atender(new Peticion($metodo, $ruta, [], $cabeceras, $json === null ? '' : json_encode($json), '127.0.0.1'));
        };

        igual(401, $atender('GET', '/admin/eventos')->estado);
        $csrf = $atender('POST', '/sesion', ['usuario' => 'admin', 'contrasena' => 'una-contraseña-larga'])->datos['csrf'];

        $nuevo = $atender('POST', '/admin/eventos', ['titulo' => 'Hackathon', 'todoElDia' => true, 'inicio' => '2026-12-05', 'fin' => '2026-12-06']);
        igual(201, $nuevo->estado);
        $id = $nuevo->datos['evento']['id'];
        igual(1, count($atender('GET', '/admin/eventos')->datos['eventos']));

        igual(200, $atender('PUT', "/admin/eventos/{$id}", ['titulo' => 'Hackathon URV', 'todoElDia' => true, 'inicio' => '2026-12-05', 'fin' => '2026-12-06'])->estado);
        igual('Hackathon URV', $calendario->eventos[$id]->titulo);
        igual(422, $atender('PUT', "/admin/eventos/{$id}", ['titulo' => '', 'todoElDia' => true, 'inicio' => 'x', 'fin' => 'y'])->estado);
        igual(204, $atender('DELETE', "/admin/eventos/{$id}")->estado);

        $calendario->caido = true;
        $fallo = $atender('GET', '/admin/eventos');
        igual(409, $fallo->estado);
        afirmar(str_contains($fallo->datos['error'], '403'));
    },
];
