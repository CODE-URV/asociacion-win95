<?php

declare(strict_types=1);

use CodeUrv\Aplicacion\CasosDeUso\Autenticacion;
use CodeUrv\Aplicacion\CasosDeUso\ConsultarOlimpiadas;
use CodeUrv\Aplicacion\CasosDeUso\GestionarOlimpiadas;
use CodeUrv\Aplicacion\CasosDeUso\JugarWikiRace;
use CodeUrv\Aplicacion\CasosDeUso\VisibilidadOlimpiadas;
use CodeUrv\Infraestructura\BaseDeDatos\AjustesPdo;
use CodeUrv\Aplicacion\Puertos\Wikipedia;
use CodeUrv\Dominio\Olimpiadas\Clasificacion;
use CodeUrv\Dominio\Olimpiadas\PartidaWikiRace;
use CodeUrv\Infraestructura\BaseDeDatos\RepositorioOlimpiadasPdo;
use CodeUrv\Infraestructura\Http\ClienteHttp;
use CodeUrv\Infraestructura\Wikipedia\WikipediaApi;
use CodeUrv\Presentacion\Api;
use CodeUrv\Presentacion\Controladores\OlimpiadasControlador;
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

/** Wikipedia de mentira: artículos, redirecciones y enlaces. */
final class WikipediaFalsa implements Wikipedia
{
    public const ENLACES = [
        'Tarragona' => ['Cataluña', 'Imperio romano', 'Mar Mediterráneo'],
        'Cataluña' => ['España', 'Barcelona'],
        'Imperio romano' => ['Julio César', 'Roma'],
        'Julio César' => ['Pizza'], // no es verdad, pero sirve para el test
        'Pizza' => [],
        'España' => [],
        'Barcelona' => [],
        'Roma' => [],
        'Mar Mediterráneo' => [],
    ];
    public const REDIRECCIONES = ['Cesar' => 'Julio César'];
    public int $consultas = 0;

    public function articulo(string $titulo): ?string
    {
        $titulo = self::REDIRECCIONES[$titulo] ?? $titulo;
        return isset(self::ENLACES[$titulo]) ? $titulo : null;
    }

    public function seguirEnlace(string $desde, string $enlace): ?string
    {
        $this->consultas++;
        return in_array($enlace, self::ENLACES[$desde] ?? [], true) ? $this->articulo($enlace) : null;
    }
}

$montar = static function (bool $abiertas = true) {
    $pdo = pdoSqlite();
    $sesion = new SesionEnMemoria();
    $usuarios = new UsuariosEnMemoria();
    $usuarios->agregar('admin', 'una-contraseña-larga');
    $reloj = new class { public \DateTimeImmutable $ahora; };
    $reloj->ahora = new \DateTimeImmutable('2026-11-20 18:00:00.000');
    $leerReloj = static fn () => $reloj->ahora;
    $wikipedia = new WikipediaFalsa();
    $repositorio = new RepositorioOlimpiadasPdo($pdo);
    $intentos = new IntentosEnMemoria();
    $visibilidad = new VisibilidadOlimpiadas(new AjustesPdo($pdo));
    $codigos = ['AAAAAA', 'BBBBBB', 'CCCCCC', 'DDDDDD'];

    $auth = static fn () => new Autenticacion($usuarios, new IntentosEnMemoria(), $sesion, static fn () => $reloj->ahora->getTimestamp());
    $nada = static fn () => throw new \LogicException('no usado');
    $api = new Api(
        new ProyectosControlador($nada, $auth),
        new SesionControlador($auth),
        new PublicoControlador($nada, $nada),
        montarActividades($pdo, $auth, $leerReloj),
        static function (string $m) { throw new \RuntimeException($m); },
        null,
        new OlimpiadasControlador(
            static fn () => new ConsultarOlimpiadas($repositorio, $visibilidad),
            static fn () => new JugarWikiRace($repositorio, $wikipedia, $intentos, $leerReloj, $visibilidad),
            static fn () => new GestionarOlimpiadas($repositorio, $wikipedia, static function () use (&$codigos) {
                return array_shift($codigos);
            }, $visibilidad),
            $auth,
        ),
    );

    $csrf = null;
    $atender = static function (string $metodo, string $ruta, ?array $json = null) use ($api, &$csrf) {
        $cabeceras = $json !== null ? ['content-type' => 'application/json'] : [];
        if ($csrf !== null) {
            $cabeceras['x-csrf-token'] = $csrf;
        }
        return $api->atender(new Peticion($metodo, $ruta, [], $cabeceras, $json === null ? '' : json_encode($json), '10.0.0.1'));
    };
    $entrar = static function () use ($atender, &$csrf) {
        $csrf = $atender('POST', '/sesion', ['usuario' => 'admin', 'contrasena' => 'una-contraseña-larga'])->datos['csrf'];
    };
    $salir = static function () use (&$csrf, $sesion) {
        $sesion->cerrar();
        $csrf = null;
    };
    if ($abiertas) {
        $visibilidad->cambiar(true);
    }
    return [$atender, $entrar, $salir, $reloj, $wikipedia];
};

// PNG de 1x1 píxel
$png = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');

return [
    'clasificación por posición: 10, 8, 6... y los empatados comparten puesto y puntos' => static function () {
        $filas = Clasificacion::calcular([1 => 25, 2 => 30, 3 => 25, 4 => 12], static fn ($a, $b) => $b <=> $a);
        igual([
            ['equipoId' => 2, 'posicion' => 1, 'puntos' => 10],
            ['equipoId' => 1, 'posicion' => 2, 'puntos' => 8],
            ['equipoId' => 3, 'posicion' => 2, 'puntos' => 8],
            ['equipoId' => 4, 'posicion' => 4, 'puntos' => 5],
        ], $filas);

        $general = Clasificacion::general([1, 2, 3], [
            [['equipoId' => 1, 'puntos' => 10], ['equipoId' => 2, 'puntos' => 8]],
            [['equipoId' => 2, 'puntos' => 10], ['equipoId' => 1, 'puntos' => 6]],
        ]);
        igual([[2, 1, 18], [1, 2, 16], [3, 3, 0]], array_map(static fn ($f) => [$f['equipoId'], $f['posicion'], $f['puntos']], $general));
    },

    'la Wiki Race gana quien llega antes; a igual tiempo, quien hace menos clics' => static function () {
        $a = PartidaWikiRace::reconstruir(1, 1, 0, 60_000, ['A', 'B', 'C']);
        $b = PartidaWikiRace::reconstruir(1, 2, 0, 60_000, ['A', 'C']);
        $c = PartidaWikiRace::reconstruir(1, 3, 0, 50_000, ['A', 'B', 'D', 'C']);
        $filas = Clasificacion::calcular([1 => $a, 2 => $b, 3 => $c], PartidaWikiRace::comparar(...));
        igual([3, 2, 1], array_column($filas, 'equipoId'));
    },

    'el admin crea equipos con código y el público no ve los códigos' => static function () use ($montar) {
        [$atender, $entrar, $salir] = $montar();
        igual(401, $atender('POST', '/admin/olimpiadas/equipos', ['nombre' => 'Los Bugs'])->estado);

        $entrar();
        $r = $atender('POST', '/admin/olimpiadas/equipos', ['nombre' => ' Los Bugs ', 'miembros' => ['Ana', '', 'Pol']]);
        igual(201, $r->estado);
        igual(['id' => 1, 'nombre' => 'Los Bugs', 'miembros' => ['Ana', 'Pol'], 'codigo' => 'AAAAAA'], $r->datos['equipo']);
        $repetido = $atender('POST', '/admin/olimpiadas/equipos', ['nombre' => 'los bugs', 'miembros' => []]);
        igual(422, $repetido->estado);
        afirmar(isset($repetido->datos['detalles']['nombre']));

        $salir();
        $publico = $atender('GET', '/olimpiadas')->datos;
        igual([['id' => 1, 'nombre' => 'Los Bugs', 'miembros' => ['Ana', 'Pol']]], $publico['equipos']);
    },

    'prueba de imagen: se sube, se puntúa y solo cuenta y se ve al finalizarla' => static function () use ($montar, $png) {
        [$atender, $entrar, $salir] = $montar();
        $entrar();
        $atender('POST', '/admin/olimpiadas/equipos', ['nombre' => 'Rojo', 'miembros' => []]);
        $atender('POST', '/admin/olimpiadas/equipos', ['nombre' => 'Azul', 'miembros' => []]);
        $prueba = $atender('POST', '/admin/olimpiadas/pruebas', ['nombre' => 'Imagen con IA', 'tipo' => 'imagen', 'descripcion' => 'Un gato astronauta'])->datos['prueba'];
        igual('preparacion', $prueba['estado']);

        igual(422, $atender('PUT', '/admin/olimpiadas/pruebas/1/equipos/1/imagen', ['imagen' => base64_encode('no soy una imagen')])->estado);
        $subida = $atender('PUT', '/admin/olimpiadas/pruebas/1/equipos/1/imagen', ['imagen' => 'data:image/png;base64,' . base64_encode($png)]);
        igual(200, $subida->estado);
        igual(true, $subida->datos['puntuacion']['tieneImagen']);
        $atender('PUT', '/admin/olimpiadas/pruebas/1/equipos/2/imagen', ['imagen' => base64_encode($png)]);

        igual(422, $atender('PUT', '/admin/olimpiadas/pruebas/1/equipos/1/notas', ['originalidad' => 11])->estado);
        $notas = $atender('PUT', '/admin/olimpiadas/pruebas/1/equipos/1/notas', ['originalidad' => 9, 'adecuacion' => 7, 'calidad' => 8]);
        igual(24, $notas->datos['puntuacion']['total']);
        igual(true, $notas->datos['puntuacion']['completa']);
        $atender('PUT', '/admin/olimpiadas/pruebas/1/equipos/2/notas', ['originalidad' => 10, 'adecuacion' => 9, 'calidad' => null]);

        $admin = $atender('GET', '/admin/olimpiadas');
        igual(200, $admin->estado);
        igual(['Rojo'], array_column($admin->datos['pruebas'][0]['clasificacion'], 'nombre'), 'Azul no tiene las tres notas.');
        igual(200, $atender('GET', '/admin/olimpiadas/pruebas/1/equipos/1/imagen')->estado);

        // En preparación no la ve nadie; en curso se ve pero sin resultados
        $salir();
        igual([], $atender('GET', '/olimpiadas')->datos['pruebas']);
        $entrar();
        $atender('PUT', '/admin/olimpiadas/pruebas/1', ['nombre' => 'Imagen con IA', 'tipo' => 'imagen', 'descripcion' => 'Un gato astronauta', 'estado' => 'en_curso']);
        $salir();
        $publico = $atender('GET', '/olimpiadas')->datos;
        afirmar(!isset($publico['pruebas'][0]['clasificacion']));
        igual(0, $publico['ranking'][0]['puntos']);
        igual(404, $atender('GET', '/olimpiadas/pruebas/1/equipos/1/imagen')->estado);

        $entrar();
        $atender('PUT', '/admin/olimpiadas/pruebas/1/equipos/2/notas', ['originalidad' => 10, 'adecuacion' => 9, 'calidad' => 9]);
        $atender('PUT', '/admin/olimpiadas/pruebas/1', ['nombre' => 'Imagen con IA', 'tipo' => 'imagen', 'descripcion' => 'Un gato astronauta', 'estado' => 'finalizada']);
        $salir();
        $publico = $atender('GET', '/olimpiadas')->datos;
        igual(['Azul', 'Rojo'], array_column($publico['pruebas'][0]['clasificacion'], 'nombre'));
        igual([['Azul', 10], ['Rojo', 8]], array_map(static fn ($f) => [$f['nombre'], $f['puntos']], $publico['ranking']));
        $imagen = $atender('GET', '/olimpiadas/pruebas/1/equipos/2/imagen');
        igual(200, $imagen->estado);
        igual('image/png', $imagen->cabeceras['Content-Type']);
        igual($png, $imagen->binario);
    },

    'Wiki Race: se juega con el código, cada clic tiene que ser un enlace y el servidor cronometra' => static function () use ($montar) {
        [$atender, $entrar, $salir, $reloj, $wikipedia] = $montar();
        $entrar();
        $atender('POST', '/admin/olimpiadas/equipos', ['nombre' => 'Rojo', 'miembros' => []]); // AAAAAA
        $atender('POST', '/admin/olimpiadas/equipos', ['nombre' => 'Azul', 'miembros' => []]); // BBBBBB
        $datos = ['nombre' => 'Wiki Race', 'tipo' => 'wikirace', 'descripcion' => '', 'origen' => 'tarragona', 'destino' => 'Cesar'];
        $prueba = $atender('POST', '/admin/olimpiadas/pruebas', $datos);
        igual(201, $prueba->estado);
        igual(['Tarragona', 'Julio César'], [$prueba->datos['prueba']['origen'], $prueba->datos['prueba']['destino']], 'Se guardan los títulos reales.');
        igual(422, $atender('POST', '/admin/olimpiadas/pruebas', ['destino' => 'No existe'] + $datos)->estado);

        $salir();
        igual(404, $atender('POST', '/olimpiadas/pruebas/1/partida', ['codigo' => 'AAAAAA'])->estado, 'En preparación no existe para el público.');
        $entrar();
        $atender('PUT', '/admin/olimpiadas/pruebas/1', ['estado' => 'en_curso', 'origen' => 'Tarragona', 'destino' => 'Julio César'] + $datos);
        $salir();

        $publico = $atender('GET', '/olimpiadas')->datos['pruebas'][0];
        afirmar(!isset($publico['origen']) && !isset($publico['destino']), 'Los artículos no se ven hasta jugar.');

        igual(401, $atender('POST', '/olimpiadas/pruebas/1/partida', ['codigo' => 'ZZZZZZ'])->estado);
        $inicio = $atender('POST', '/olimpiadas/pruebas/1/partida', ['codigo' => 'aaaaaa']);
        igual(200, $inicio->estado);
        igual('Tarragona', $inicio->datos['partida']['actual']);
        igual('Julio César', $inicio->datos['prueba']['destino']);

        $paso = static fn (string $codigo, string $articulo) => $atender('POST', '/olimpiadas/pruebas/1/partida/pasos', ['codigo' => $codigo, 'articulo' => $articulo]);
        $reloj->ahora = $reloj->ahora->modify('+5 seconds');
        $trampa = $paso('AAAAAA', 'Julio César');
        igual(409, $trampa->estado);
        afirmar(str_contains($trampa->datos['error'], 'Tarragona'));

        igual('Cataluña', $paso('AAAAAA', 'Cataluña')->datos['partida']['actual']);
        $consultas = $wikipedia->consultas;
        igual('Tarragona', $paso('AAAAAA', 'Tarragona')->datos['partida']['actual'], 'Atrás vuelve al anterior');
        igual($consultas, $wikipedia->consultas, 'Volver atrás no pregunta a Wikipedia.');
        $paso('AAAAAA', 'Imperio romano');
        $reloj->ahora = $reloj->ahora->modify('+70 seconds');
        $final = $paso('AAAAAA', 'Julio César')->datos;
        igual(true, $final['partida']['terminada']);
        igual(4, $final['partida']['clics']);
        igual(75_000, $final['partida']['tiempoMs']);
        igual(['Tarragona', 'Cataluña', 'Tarragona', 'Imperio romano', 'Julio César'], $final['partida']['ruta']);
        igual(75_000, $paso('AAAAAA', 'Roma')->datos['partida']['tiempoMs'], 'Terminada, ya no cambia.');

        // Azul empieza más tarde pero tarda menos: gana
        $atender('POST', '/olimpiadas/pruebas/1/partida', ['codigo' => 'BBBBBB']);
        $paso('BBBBBB', 'Imperio romano');
        $reloj->ahora = $reloj->ahora->modify('+30 seconds');
        $paso('BBBBBB', 'Julio César');
        igual(2, $atender('GET', '/olimpiadas')->datos['pruebas'][0]['llegados']);

        $entrar();
        $atender('PUT', '/admin/olimpiadas/pruebas/1', ['estado' => 'finalizada', 'origen' => 'Tarragona', 'destino' => 'Julio César'] + $datos);
        igual(409, $atender('PUT', '/admin/olimpiadas/pruebas/1', ['estado' => 'finalizada', 'origen' => 'Roma', 'destino' => 'Julio César'] + $datos)->estado, 'Ya se ha jugado.');
        $salir();
        $publico = $atender('GET', '/olimpiadas')->datos;
        igual(['Azul', 'Rojo'], array_column($publico['pruebas'][0]['clasificacion'], 'nombre'));
        igual('Tarragona', $publico['pruebas'][0]['origen']);
        igual(409, $atender('POST', '/olimpiadas/pruebas/1/partida', ['codigo' => 'AAAAAA'])->estado, 'Ya ha terminado.');
    },

    'Wiki Race: demasiados códigos incorrectos bloquean 15 minutos' => static function () use ($montar) {
        [$atender, $entrar, $salir] = $montar();
        $entrar();
        $atender('POST', '/admin/olimpiadas/equipos', ['nombre' => 'Rojo', 'miembros' => []]);
        $atender('POST', '/admin/olimpiadas/pruebas', ['nombre' => 'WR', 'tipo' => 'wikirace', 'origen' => 'Tarragona', 'destino' => 'Roma', 'estado' => 'en_curso']);
        $salir();
        for ($i = 0; $i < 10; $i++) {
            igual(401, $atender('POST', '/olimpiadas/pruebas/1/partida', ['codigo' => 'ZZZZZ' . ($i % 8 + 2)])->estado);
        }
        igual(429, $atender('POST', '/olimpiadas/pruebas/1/partida', ['codigo' => 'AAAAAA'])->estado);
    },

    'borrar un equipo quita sus resultados; reiniciar deja volver a jugar' => static function () use ($montar) {
        [$atender, $entrar] = $montar();
        $entrar();
        $atender('POST', '/admin/olimpiadas/equipos', ['nombre' => 'Rojo', 'miembros' => []]);
        $atender('POST', '/admin/olimpiadas/pruebas', ['nombre' => 'WR', 'tipo' => 'wikirace', 'origen' => 'Tarragona', 'destino' => 'Roma', 'estado' => 'en_curso']);
        $atender('POST', '/olimpiadas/pruebas/1/partida', ['codigo' => 'AAAAAA']);
        $atender('POST', '/olimpiadas/pruebas/1/partida/pasos', ['codigo' => 'AAAAAA', 'articulo' => 'Cataluña']);
        igual(1, $atender('GET', '/admin/olimpiadas')->datos['pruebas'][0]['partidas'][0]['clics']);
        igual(204, $atender('DELETE', '/admin/olimpiadas/pruebas/1/equipos/1/partida')->estado);
        igual([], $atender('GET', '/admin/olimpiadas')->datos['pruebas'][0]['partidas']);
        igual(0, $atender('POST', '/olimpiadas/pruebas/1/partida', ['codigo' => 'AAAAAA'])->datos['partida']['clics']);
        igual(204, $atender('DELETE', '/admin/olimpiadas/equipos/1')->estado);
        $admin = $atender('GET', '/admin/olimpiadas')->datos;
        igual([], $admin['equipos']);
        igual([], $admin['pruebas'][0]['partidas']);
    },

    'ocultas al público hasta que el admin las activa; el admin las ve siempre' => static function () use ($montar) {
        [$atender, $entrar, $salir] = $montar(false);
        igual(['visibles' => false], $atender('GET', '/olimpiadas/visibilidad')->datos);
        igual(404, $atender('GET', '/olimpiadas')->estado);
        $entrar();
        $atender('POST', '/admin/olimpiadas/equipos', ['nombre' => 'Rojo', 'miembros' => []]);
        $atender('POST', '/admin/olimpiadas/pruebas', ['nombre' => 'WR', 'tipo' => 'wikirace', 'origen' => 'Tarragona', 'destino' => 'Roma', 'estado' => 'en_curso']);
        $comoAdmin = $atender('GET', '/olimpiadas');
        igual(200, $comoAdmin->estado, 'El admin ve la ventana aunque estén ocultas.');
        igual(false, $comoAdmin->datos['visibles']);
        igual(200, $atender('POST', '/olimpiadas/pruebas/1/partida', ['codigo' => 'AAAAAA'])->estado, 'El admin puede probar la Wiki Race.');
        igual(400, $atender('PUT', '/admin/olimpiadas/visibilidad', ['visibles' => 'si'])->estado);
        igual(['visibles' => true], $atender('PUT', '/admin/olimpiadas/visibilidad', ['visibles' => true])->datos);

        $salir();
        igual(401, $atender('PUT', '/admin/olimpiadas/visibilidad', ['visibles' => false])->estado);
        igual(['visibles' => true], $atender('GET', '/olimpiadas/visibilidad')->datos);
        igual(200, $atender('GET', '/olimpiadas')->estado);
        $entrar();
        $atender('PUT', '/admin/olimpiadas/visibilidad', ['visibles' => false]);
        $salir();
        igual(404, $atender('GET', '/olimpiadas')->estado);
        igual(404, $atender('POST', '/olimpiadas/pruebas/1/partida', ['codigo' => 'AAAAAA'])->estado);
    },

    'WikipediaApi entiende redirecciones y comprueba el enlace' => static function () {
        $http = new class extends ClienteHttp {
            public array $urls = [];
            public array $cabeceras = [];
            public function get(string $url, array $cabeceras = []): array
            {
                $this->urls[] = $url;
                $this->cabeceras = $cabeceras;
                parse_str((string) parse_url($url, PHP_URL_QUERY), $q);
                if (($q['pltitles'] ?? null) === 'EEUU') {
                    return [200, json_encode(['query' => [
                        'redirects' => [['from' => 'EEUU', 'to' => 'Estados Unidos']],
                        'pages' => [
                            ['ns' => 0, 'title' => 'Nueva York', 'links' => [['ns' => 0, 'title' => 'EEUU']]],
                            ['ns' => 0, 'title' => 'Estados Unidos'],
                        ],
                    ]])];
                }
                if (isset($q['pltitles'])) {
                    return [200, json_encode(['query' => ['pages' => [['ns' => 0, 'title' => 'Nueva York'], ['ns' => 0, 'title' => 'Marte']]]])];
                }
                if ($q['titles'] === 'no existe') {
                    return [200, json_encode(['query' => [
                        'normalized' => [['from' => 'no existe', 'to' => 'No existe']],
                        'pages' => [['ns' => 0, 'title' => 'No existe', 'missing' => true]],
                    ]])];
                }
                return [500, 'error'];
            }
        };
        $wiki = new WikipediaApi($http);
        igual('Estados Unidos', $wiki->seguirEnlace('Nueva York', 'EEUU'));
        igual(null, $wiki->seguirEnlace('Nueva York', 'Marte'));
        igual(null, $wiki->articulo('no existe'));
        igual(null, $wiki->seguirEnlace('Nueva York', 'A|B'), 'Sin pedirlo a Wikipedia');
        igual(3, count($http->urls));
        afirmar(str_starts_with($http->cabeceras[0], 'User-Agent: CodeURV'));
        afirmar(str_contains($http->urls[0], 'redirects=1'));
        \CodeUrv\Tests\lanza(\CodeUrv\Aplicacion\ServicioNoDisponible::class, static fn () => $wiki->articulo('Otro'));
    },
];
