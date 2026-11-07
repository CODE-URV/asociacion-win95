<?php

declare(strict_types=1);

namespace CodeUrv\Infraestructura\BaseDeDatos;

use CodeUrv\Infraestructura\Config;

final class ConexionPdo
{
    /**
     * MySQL en Hostinger:   DB_DSN = mysql:host=localhost;dbname=u863071096_codeurv;charset=utf8mb4
     * SQLite en local/tests: DB_DSN = sqlite:/ruta/a/dev.sqlite
     */
    public static function desdeConfig(Config $config): \PDO
    {
        $pdo = new \PDO(
            $config->obligatorio('DB_DSN'),
            $config->texto('DB_USUARIO') ?: null,
            $config->texto('DB_CONTRASENA') ?: null,
            [
                \PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION,
                \PDO::ATTR_DEFAULT_FETCH_MODE => \PDO::FETCH_ASSOC,
                \PDO::ATTR_EMULATE_PREPARES => false,
            ],
        );
        return $pdo;
    }
}
