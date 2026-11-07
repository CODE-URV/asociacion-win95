<?php

declare(strict_types=1);

// Monta la API real (Config + Contenedor + todas las capas) como en producción,
// con SQLite en vez de MySQL. Si falta algún archivo en el repositorio, falla aquí
// y GitHub no despliega.

use CodeUrv\Contenedor;
use CodeUrv\Infraestructura\Config;
use CodeUrv\Presentacion\Http\Peticion;
use CodeUrv\Tests\SesionEnMemoria;

use function CodeUrv\Tests\afirmar;
use function CodeUrv\Tests\igual;

$conConfig = static function (array $valores, callable $prueba): void {
    $ruta = tempnam(sys_get_temp_dir(), 'codeurv') . '.php';
    file_put_contents($ruta, '<?php return ' . var_export($valores, true) . ';');
    $anterior = getenv('CODEURV_CONFIG');
    putenv('CODEURV_CONFIG=' . $ruta);
    try {
        $prueba(Config::cargar('/no/existe/config.php'));
    } finally {
        putenv($anterior === false ? 'CODEURV_CONFIG' : 'CODEURV_CONFIG=' . $anterior);
        @unlink($ruta);
    }
};

return [
    'Config lee config.php (o el indicado en CODEURV_CONFIG) y exige las claves obligatorias' => static function () use ($conConfig) {
        $conConfig(['DB_DSN' => 'sqlite::memory:', 'VACIA' => ''], static function (Config $config) {
            igual('sqlite::memory:', $config->obligatorio('DB_DSN'));
            igual('por defecto', $config->texto('VACIA', 'por defecto'));
            $error = null;
            try {
                $config->obligatorio('WEB_APP_URL');
            } catch (\RuntimeException $e) {
                $error = $e->getMessage();
            }
            afirmar($error !== null && str_contains($error, 'WEB_APP_URL'));
        });
    },

    'el Contenedor monta la API completa y responde con la base de datos real' => static function () use ($conConfig) {
        $sqlite = tempnam(sys_get_temp_dir(), 'codeurv-db');
        $pdo = new \PDO('sqlite:' . $sqlite);
        $pdo->exec((string) file_get_contents(__DIR__ . '/../sql/sqlite.sql'));
        $pdo = null;

        $conConfig(['DB_DSN' => 'sqlite:' . $sqlite], static function (Config $config) {
            $api = (new Contenedor($config, new SesionEnMemoria()))->api();
            $respuesta = $api->atender(new Peticion('GET', '/proyectos'));
            igual(200, $respuesta->estado);
            igual(['proyectos' => []], $respuesta->datos);
            igual(['usuario' => null, 'csrf' => null], $api->atender(new Peticion('GET', '/sesion'))->datos);
        });
        @unlink($sqlite);
    },
];
