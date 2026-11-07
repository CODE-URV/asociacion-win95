<?php

declare(strict_types=1);

namespace CodeUrv\Infraestructura\BaseDeDatos;

use CodeUrv\Aplicacion\Puertos\RegistroIntentos;

final class RegistroIntentosPdo implements RegistroIntentos
{
    private const CONSERVAR_SEGUNDOS = 86400;

    public function __construct(private readonly \PDO $pdo)
    {
    }

    public function fallosDesde(string $clave, int $desdeTimestamp): int
    {
        $consulta = $this->pdo->prepare('SELECT COUNT(*) FROM intentos_login WHERE clave = ? AND momento >= ?');
        $consulta->execute([$clave, $desdeTimestamp]);
        return (int) $consulta->fetchColumn();
    }

    public function registrarFallo(string $clave, int $timestamp): void
    {
        $this->pdo->prepare('INSERT INTO intentos_login (clave, momento) VALUES (?, ?)')->execute([$clave, $timestamp]);
        // Limpieza de registros antiguos para que la tabla no crezca sin fin
        $this->pdo->prepare('DELETE FROM intentos_login WHERE momento < ?')->execute([$timestamp - self::CONSERVAR_SEGUNDOS]);
    }

    public function limpiar(string $clave): void
    {
        $this->pdo->prepare('DELETE FROM intentos_login WHERE clave = ?')->execute([$clave]);
    }
}
