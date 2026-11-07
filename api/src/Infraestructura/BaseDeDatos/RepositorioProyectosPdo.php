<?php

declare(strict_types=1);

namespace CodeUrv\Infraestructura\BaseDeDatos;

use CodeUrv\Aplicacion\Puertos\RepositorioProyectos;
use CodeUrv\Dominio\Proyecto;

/** Proyectos en MySQL (o SQLite en desarrollo). Las listas se guardan como JSON. */
final class RepositorioProyectosPdo implements RepositorioProyectos
{
    private const COLUMNAS = 'id, nombre, descripcion, responsable, email, estado, progreso, tecnologias, repositorio, colaboradores';

    public function __construct(private readonly \PDO $pdo)
    {
    }

    public function todos(): array
    {
        $filas = $this->pdo->query('SELECT ' . self::COLUMNAS . ' FROM proyectos ORDER BY id')->fetchAll();
        return array_map(self::aProyecto(...), $filas);
    }

    public function buscar(int $id): ?Proyecto
    {
        $consulta = $this->pdo->prepare('SELECT ' . self::COLUMNAS . ' FROM proyectos WHERE id = ?');
        $consulta->execute([$id]);
        $fila = $consulta->fetch();
        return $fila === false ? null : self::aProyecto($fila);
    }

    public function guardar(Proyecto $proyecto): Proyecto
    {
        $valores = [
            'nombre' => $proyecto->nombre,
            'descripcion' => $proyecto->descripcion,
            'responsable' => $proyecto->responsable,
            'email' => $proyecto->email,
            'estado' => $proyecto->estado->value,
            'progreso' => $proyecto->progreso,
            'tecnologias' => json_encode($proyecto->tecnologias, JSON_UNESCAPED_UNICODE),
            'repositorio' => $proyecto->repositorio,
            'colaboradores' => json_encode($proyecto->colaboradores, JSON_UNESCAPED_UNICODE),
        ];

        if ($proyecto->id === null) {
            $columnas = implode(', ', array_keys($valores));
            $marcadores = ':' . implode(', :', array_keys($valores));
            $this->pdo->prepare("INSERT INTO proyectos ({$columnas}) VALUES ({$marcadores})")->execute($valores);
            return $proyecto->conId((int) $this->pdo->lastInsertId());
        }

        $asignaciones = implode(', ', array_map(static fn ($c) => "{$c} = :{$c}", array_keys($valores)));
        $this->pdo
            ->prepare("UPDATE proyectos SET {$asignaciones}, actualizado_en = CURRENT_TIMESTAMP WHERE id = :id")
            ->execute($valores + ['id' => $proyecto->id]);
        return $proyecto;
    }

    public function eliminar(int $id): bool
    {
        $consulta = $this->pdo->prepare('DELETE FROM proyectos WHERE id = ?');
        $consulta->execute([$id]);
        return $consulta->rowCount() > 0;
    }

    /** @param array<string, mixed> $fila */
    private static function aProyecto(array $fila): Proyecto
    {
        $lista = static fn ($json) => is_array($d = json_decode((string) $json, true)) ? array_values($d) : [];

        return Proyecto::desdeDatos([
            'nombre' => (string) $fila['nombre'],
            'descripcion' => (string) $fila['descripcion'],
            'responsable' => (string) $fila['responsable'],
            'email' => (string) $fila['email'],
            'estado' => (string) $fila['estado'],
            'progreso' => (int) $fila['progreso'],
            'tecnologias' => $lista($fila['tecnologias']),
            'repositorio' => (string) $fila['repositorio'],
            'colaboradores' => $lista($fila['colaboradores']),
        ], (int) $fila['id']);
    }
}
