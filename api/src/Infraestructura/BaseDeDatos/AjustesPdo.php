<?php

declare(strict_types=1);

namespace CodeUrv\Infraestructura\BaseDeDatos;

use CodeUrv\Aplicacion\Puertos\Ajustes;

final class AjustesPdo implements Ajustes
{
    /** @var array<string, string> */
    private array $cache = [];

    public function __construct(private readonly \PDO $pdo)
    {
    }

    public function obtenerOCrear(string $clave, callable $generar): string
    {
        if (isset($this->cache[$clave])) {
            return $this->cache[$clave];
        }

        $valor = $this->leer($clave);
        if ($valor === null) {
            try {
                $this->pdo->prepare('INSERT INTO ajustes (clave, valor) VALUES (?, ?)')->execute([$clave, (string) $generar()]);
            } catch (\PDOException) {
                // otra petición lo ha creado a la vez: se usa el suyo
            }
            $valor = $this->leer($clave);
        }
        return $this->cache[$clave] = (string) $valor;
    }

    private function leer(string $clave): ?string
    {
        $consulta = $this->pdo->prepare('SELECT valor FROM ajustes WHERE clave = ?');
        $consulta->execute([$clave]);
        $valor = $consulta->fetchColumn();
        return $valor === false ? null : (string) $valor;
    }
}
