<?php

declare(strict_types=1);

namespace CodeUrv\Infraestructura\BaseDeDatos;

use CodeUrv\Aplicacion\Puertos\RepositorioUsuarios;
use CodeUrv\Dominio\Usuario;

final class RepositorioUsuariosPdo implements RepositorioUsuarios
{
    public function __construct(private readonly \PDO $pdo)
    {
    }

    public function buscarPorNombre(string $nombre): ?Usuario
    {
        $consulta = $this->pdo->prepare('SELECT id, nombre, hash_contrasena FROM usuarios WHERE nombre = ?');
        $consulta->execute([$nombre]);
        $fila = $consulta->fetch();
        if ($fila === false) {
            return null;
        }
        return new Usuario((int) $fila['id'], (string) $fila['nombre'], (string) $fila['hash_contrasena']);
    }
}
