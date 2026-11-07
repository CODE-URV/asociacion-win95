<?php

declare(strict_types=1);

use CodeUrv\Aplicacion\CasosDeUso\Autenticacion;
use CodeUrv\Aplicacion\ServicioNoDisponible;
use CodeUrv\Dominio\Certificado;
use CodeUrv\Dominio\TipoActividad;
use CodeUrv\Infraestructura\Correo\EnviadorSmtp;
use CodeUrv\Infraestructura\Correo\MensajeMime;
use CodeUrv\Infraestructura\Pdf\CertificadoPdf;
use CodeUrv\Presentacion\Api;
use CodeUrv\Presentacion\Controladores\ProyectosControlador;
use CodeUrv\Presentacion\Controladores\PublicoControlador;
use CodeUrv\Presentacion\Controladores\SesionControlador;
use CodeUrv\Presentacion\Http\Peticion;
use CodeUrv\Tests\CorreoEnMemoria;
use CodeUrv\Tests\IntentosEnMemoria;
use CodeUrv\Tests\SesionEnMemoria;
use CodeUrv\Tests\UsuariosEnMemoria;

use function CodeUrv\Tests\afirmar;
use function CodeUrv\Tests\igual;
use function CodeUrv\Tests\lanza;
use function CodeUrv\Tests\montarActividades;
use function CodeUrv\Tests\pdoSqlite;

date_default_timezone_set('Europe/Madrid');

$certificado = static fn (TipoActividad $tipo = TipoActividad::Charla, string $fecha = '2025-10-02 18:00') =>
    new Certificado('Núria Puig i Ferrer', 'Introducció a la IA', $tipo, new \DateTimeImmutable($fecha), 'Jordi Duch', 'Oriol Algar');

/** API con un correo en memoria, una actividad publicada y dos inscritos (uno con asistencia). */
$montar = static function () {
    $pdo = pdoSqlite();
    $sesion = new SesionEnMemoria();
    $usuarios = new UsuariosEnMemoria();
    $usuarios->agregar('admin', 'una-contraseña-larga');
    $reloj = new class { public \DateTimeImmutable $ahora; };
    $reloj->ahora = new \DateTimeImmutable('2026-11-10 12:00');
    $correo = new CorreoEnMemoria();

    $auth = static fn () => new Autenticacion($usuarios, new IntentosEnMemoria(), $sesion, static fn () => $reloj->ahora->getTimestamp());
    $nada = static fn () => throw new \LogicException('no usado');
    $api = new Api(
        new ProyectosControlador($nada, $auth),
        new SesionControlador($auth),
        new PublicoControlador($nada, $nada),
        montarActividades($pdo, $auth, static fn () => $reloj->ahora, $correo),
        static function (string $m) { throw new \RuntimeException($m); },
    );

    $csrf = null;
    $atender = static function (string $metodo, string $ruta, ?array $json = null, array $consulta = []) use ($api, &$csrf) {
        $cabeceras = $json !== null ? ['content-type' => 'application/json'] : [];
        if ($csrf !== null) {
            $cabeceras['x-csrf-token'] = $csrf;
        }
        return $api->atender(new Peticion($metodo, $ruta, $consulta, $cabeceras, $json === null ? '' : json_encode($json), '127.0.0.1'));
    };
    $csrf = $atender('POST', '/sesion', ['usuario' => 'admin', 'contrasena' => 'una-contraseña-larga'])->datos['csrf'];

    $id = $atender('POST', '/admin/actividades', [
        'titulo' => 'Introducció a la IA', 'tipo' => 'Charla', 'descripcion' => '', 'informacionExtra' => '',
        'lugar' => 'Aula 1', 'inicio' => '2026-11-19T18:00', 'fin' => '2026-11-19T20:00', 'ponente' => 'Jordi Duch',
        'plazas' => null, 'publicada' => true, 'inscripcionesAbiertas' => true,
    ])->datos['actividad']['id'];

    foreach (['ana@urv.cat' => 'Ana', 'pau@urv.cat' => 'Pau', 'marc@urv.cat' => 'Marc'] as $email => $nombre) {
        $atender('POST', "/actividades/{$id}/inscripciones", [
            'email' => $email, 'nombre' => $nombre, 'apellidos' => 'Prova', 'grado' => 'GEI', 'curso' => '1er',
            'confirmaAsistencia' => true, 'aceptaPrivacidad' => true,
        ]);
    }
    $inscritos = $atender('GET', "/admin/actividades/{$id}/inscripciones")->datos['inscripciones'];
    $porNombre = array_column($inscritos, 'id', 'nombre');
    $atender('PUT', "/admin/actividades/{$id}/inscripciones/{$porNombre['Ana']}", ['asistio' => true]);
    $atender('PUT', "/admin/actividades/{$id}/inscripciones/{$porNombre['Pau']}", ['asistio' => true]);

    return [$atender, $id, $porNombre, $correo, $reloj];
};

return [
    // ---------- Dominio ----------

    'certificado: frase según el tipo de actividad' => static function () use ($certificado) {
        igual('va assistir a la xerrada', $certificado(TipoActividad::Charla)->frase());
        igual('va assistir al taller', $certificado(TipoActividad::Taller)->frase());
        igual('va assistir a l’activitat', $certificado(TipoActividad::Otro)->frase());
    },

    'certificado: fecha en catalán con «d’» delante de vocal' => static function () use ($certificado) {
        igual('el 2 d’octubre de 2025', $certificado(fecha: '2025-10-02')->textoFecha());
        igual('el 15 d’abril de 2026', $certificado(fecha: '2026-04-15')->textoFecha());
        igual('el 19 de novembre de 2026', $certificado(fecha: '2026-11-19')->textoFecha());
        igual('el 3 de març de 2026', $certificado(fecha: '2026-03-03')->textoFecha());
    },

    'certificado: nombre de archivo sin acentos' => static function () use ($certificado) {
        igual('certificat-nuria-puig-i-ferrer.pdf', $certificado()->nombreArchivo());
    },

    // ---------- Infraestructura ----------

    'PDF: documento válido con el nombre y los textos en catalán' => static function () use ($certificado) {
        $pdf = (new CertificadoPdf(__DIR__ . '/../recursos/logo-certificado.jpg'))->generar($certificado());
        afirmar(str_starts_with($pdf, '%PDF-1.4'), 'No empieza como un PDF');
        afirmar(str_ends_with($pdf, "%%EOF\n"), 'No acaba como un PDF');
        afirmar(str_contains($pdf, "(N\xFAria Puig i Ferrer)"), 'Falta el nombre en WinAnsi');
        afirmar(str_contains($pdf, "(Certificat d\x92assist\xE8ncia)"), 'Falta el título con apóstrofo y acento');
        afirmar(str_contains($pdf, '/DCTDecode'), 'Falta el logo');
        // La tabla xref apunta al inicio real de cada objeto
        preg_match('/startxref\n(\d+)/', $pdf, $m);
        igual('xref', substr($pdf, (int) $m[1], 4));
    },

    'MIME: asunto con acentos codificado y PDF adjunto en base64' => static function () use ($certificado) {
        $c = $certificado();
        $mime = MensajeMime::construir('codeurv@gmail.com', 'CODE URV', 'nuria@urv.cat', $c->asuntoCorreo(), $c->textoCorreo('Núria'),
            ['nombre' => 'cert.pdf', 'tipo' => 'application/pdf', 'contenido' => '%PDF-falso'], 'FRONTERA');
        afirmar(str_contains($mime, 'Subject: =?UTF-8?B?' . base64_encode($c->asuntoCorreo()) . '?='));
        afirmar(str_contains($mime, 'From: CODE URV <codeurv@gmail.com>'));
        afirmar(str_contains($mime, 'filename="cert.pdf"'));
        afirmar(str_contains($mime, base64_encode('%PDF-falso')));
        afirmar(str_ends_with($mime, "--FRONTERA--\r\n"));
    },

    'SMTP: conversación completa con un servidor falso y error de contraseña' => static function () {
        $php = PHP_BINARY;
        foreach (['secreta' => true, 'mala' => false] as $contrasena => $debeFuncionar) {
            $puerto = random_int(20000, 40000);
            $salida = tempnam(sys_get_temp_dir(), 'smtp');
            $proceso = proc_open([$php, __DIR__ . '/smtp-falso.php', (string) $puerto, $salida], [1 => ['pipe', 'w']], $tubos);
            fgets($tubos[1]); // "listo"

            $smtp = new EnviadorSmtp('127.0.0.1', $puerto, 'codeurv@gmail.com', $contrasena, 'CODE URV', false);
            $error = null;
            try {
                $smtp->enviar('nuria@urv.cat', 'Prova', ".línea que empieza por punto\nadiós", ['nombre' => 'c.pdf', 'tipo' => 'application/pdf', 'contenido' => 'PDF']);
            } catch (ServicioNoDisponible $e) {
                $error = $e->getMessage();
            }
            proc_close($proceso);
            $registro = json_decode((string) file_get_contents($salida), true) ?? ['comandos' => [], 'mensaje' => ''];
            @unlink($salida);

            if ($debeFuncionar) {
                igual(null, $error);
                afirmar(in_array('RCPT TO:<nuria@urv.cat>', $registro['comandos'], true), 'No se envió RCPT TO');
                afirmar(str_contains($registro['mensaje'], 'filename="c.pdf"'), 'El servidor no recibió el adjunto');
            } else {
                afirmar($error !== null && str_contains($error, 'contraseña'), 'Debía avisar de la contraseña: ' . $error);
            }
        }
    },

    // ---------- Caso de uso por la API ----------

    'no se envían certificados antes de que empiece la actividad' => static function () use ($montar) {
        [$atender, $id] = $montar();
        igual(409, $atender('POST', "/admin/actividades/{$id}/certificados")->estado);
    },

    'enviar: solo a quien asistió, una vez, y por lotes' => static function () use ($montar) {
        [$atender, $id, , $correo, $reloj] = $montar();
        $reloj->ahora = new \DateTimeImmutable('2026-11-19 20:30');

        $r = $atender('POST', "/admin/actividades/{$id}/certificados")->datos;
        igual(['enviados' => 2, 'pendientes' => 0, 'error' => null], $r);
        igual(['ana@urv.cat', 'pau@urv.cat'], array_column($correo->enviados, 'para'));
        igual('application/pdf', $correo->enviados[0]['adjunto']['tipo']);
        afirmar(str_contains($correo->enviados[0]['texto'], 'Hola Ana'));
        afirmar(str_starts_with($correo->enviados[0]['adjunto']['contenido'], '%PDF'));

        // Repetir no reenvía a nadie
        igual(0, $atender('POST', "/admin/actividades/{$id}/certificados")->datos['enviados']);
        $inscritos = $atender('GET', "/admin/actividades/{$id}/inscripciones")->datos['inscripciones'];
        igual(2, count(array_filter($inscritos, static fn ($i) => $i['certificadoEnviadoEn'] !== null)));
    },

    'si el correo falla se para y devuelve el motivo, sin marcar como enviado' => static function () use ($montar) {
        [$atender, $id, , $correo, $reloj] = $montar();
        $reloj->ahora = new \DateTimeImmutable('2026-11-19 20:30');
        $correo->fallarDesde = 1;

        $r = $atender('POST', "/admin/actividades/{$id}/certificados")->datos;
        igual(1, $r['enviados']);
        igual(1, $r['pendientes']);
        afirmar(str_contains($r['error'], 'contraseña'));

        $correo->fallarDesde = null;
        igual(['enviados' => 1, 'pendientes' => 0, 'error' => null], $atender('POST', "/admin/actividades/{$id}/certificados")->datos);
    },

    'reenviar a una persona y vista previa en PDF' => static function () use ($montar) {
        [$atender, $id, $porNombre, $correo, $reloj] = $montar();
        $reloj->ahora = new \DateTimeImmutable('2026-11-19 20:30');

        igual(409, $atender('POST', "/admin/actividades/{$id}/inscripciones/{$porNombre['Marc']}/certificado")->estado); // no vino
        igual(200, $atender('POST', "/admin/actividades/{$id}/inscripciones/{$porNombre['Ana']}/certificado")->estado);
        igual(['ana@urv.cat'], array_column($correo->enviados, 'para'));

        $previo = $atender('GET', "/admin/actividades/{$id}/certificado-previo");
        igual('application/pdf', $previo->cabeceras['Content-Type']);
        afirmar(str_starts_with((string) $previo->binario, '%PDF'));
        $dePau = $atender('GET', "/admin/actividades/{$id}/certificado-previo", null, ['inscripcion' => (string) $porNombre['Pau']]);
        afirmar(str_contains((string) $dePau->binario, '(Pau Prova)'));
    },
];
