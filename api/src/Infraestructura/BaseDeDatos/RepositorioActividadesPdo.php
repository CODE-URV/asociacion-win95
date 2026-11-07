<?php

declare(strict_types=1);

namespace CodeUrv\Infraestructura\BaseDeDatos;

use CodeUrv\Aplicacion\Puertos\RepositorioActividades;
use CodeUrv\Dominio\Actividad;

final class RepositorioActividadesPdo implements RepositorioActividades
{
    private const COLUMNAS = 'id, titulo, tipo, descripcion, informacion_extra, lugar, inicio, fin, ponente, plazas, publicada, inscripciones_abiertas, en_calendario, evento_calendario_id';

    public function __construct(private readonly \PDO $pdo)
    {
    }

    public function todas(): array
    {
        $filas = $this->pdo->query('SELECT ' . self::COLUMNAS . ' FROM actividades ORDER BY inicio, id')->fetchAll();
        return array_map(self::aActividad(...), $filas);
    }

    public function buscar(int $id): ?Actividad
    {
        $consulta = $this->pdo->prepare('SELECT ' . self::COLUMNAS . ' FROM actividades WHERE id = ?');
        $consulta->execute([$id]);
        $fila = $consulta->fetch();
        return $fila === false ? null : self::aActividad($fila);
    }

    public function guardar(Actividad $actividad): Actividad
    {
        $valores = [
            'titulo' => $actividad->titulo,
            'tipo' => $actividad->tipo->value,
            'descripcion' => $actividad->descripcion,
            'informacion_extra' => $actividad->informacionExtra,
            'lugar' => $actividad->lugar,
            'inicio' => $actividad->inicio->format('Y-m-d H:i:s'),
            'fin' => $actividad->fin->format('Y-m-d H:i:s'),
            'ponente' => $actividad->ponente,
            'plazas' => $actividad->plazas,
            'publicada' => $actividad->publicada ? 1 : 0,
            'inscripciones_abiertas' => $actividad->inscripcionesAbiertas ? 1 : 0,
            'en_calendario' => $actividad->enCalendario ? 1 : 0,
            'evento_calendario_id' => $actividad->eventoCalendarioId,
        ];

        if ($actividad->id === null) {
            $columnas = implode(', ', array_keys($valores));
            $marcadores = ':' . implode(', :', array_keys($valores));
            $this->pdo->prepare("INSERT INTO actividades ({$columnas}) VALUES ({$marcadores})")->execute($valores);
            return $actividad->conId((int) $this->pdo->lastInsertId());
        }

        $asignaciones = implode(', ', array_map(static fn ($c) => "{$c} = :{$c}", array_keys($valores)));
        $this->pdo
            ->prepare("UPDATE actividades SET {$asignaciones}, actualizado_en = CURRENT_TIMESTAMP WHERE id = :id")
            ->execute($valores + ['id' => $actividad->id]);
        return $actividad;
    }

    public function eliminar(int $id): bool
    {
        // Se borran también a mano por si la base no aplica ON DELETE CASCADE (SQLite sin PRAGMA)
        $this->pdo->prepare('DELETE FROM inscripciones_actividad WHERE actividad_id = ?')->execute([$id]);
        $consulta = $this->pdo->prepare('DELETE FROM actividades WHERE id = ?');
        $consulta->execute([$id]);
        return $consulta->rowCount() > 0;
    }

    /** @param array<string, mixed> $fila */
    private static function aActividad(array $fila): Actividad
    {
        $fecha = static fn ($valor) => substr((string) $valor, 0, 16); // 'Y-m-d H:i'
        return Actividad::desdeDatos([
            'titulo' => (string) $fila['titulo'],
            'tipo' => (string) $fila['tipo'],
            'descripcion' => (string) $fila['descripcion'],
            'informacionExtra' => (string) $fila['informacion_extra'],
            'lugar' => (string) $fila['lugar'],
            'inicio' => $fecha($fila['inicio']),
            'fin' => $fecha($fila['fin']),
            'ponente' => (string) $fila['ponente'],
            'plazas' => $fila['plazas'] === null ? null : (int) $fila['plazas'],
            'publicada' => (bool) $fila['publicada'],
            'inscripcionesAbiertas' => (bool) $fila['inscripciones_abiertas'],
            'enCalendario' => (bool) $fila['en_calendario'],
        ], (int) $fila['id'], $fila['evento_calendario_id'] === null ? null : (string) $fila['evento_calendario_id']);
    }
}
