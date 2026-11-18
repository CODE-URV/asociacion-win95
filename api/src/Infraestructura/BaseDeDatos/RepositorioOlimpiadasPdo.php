<?php

declare(strict_types=1);

namespace CodeUrv\Infraestructura\BaseDeDatos;

use CodeUrv\Aplicacion\Puertos\RepositorioOlimpiadas;
use CodeUrv\Dominio\Olimpiadas\Equipo;
use CodeUrv\Dominio\Olimpiadas\PartidaWikiRace;
use CodeUrv\Dominio\Olimpiadas\Prueba;
use CodeUrv\Dominio\Olimpiadas\PuntuacionImagen;

/** Funciona igual con MySQL (Hostinger) y SQLite (local y tests). */
final class RepositorioOlimpiadasPdo implements RepositorioOlimpiadas
{
    // La imagen no se lee al listar: solo si la hay
    private const COLUMNAS_PUNTUACION = 'prueba_id, equipo_id, originalidad, adecuacion, calidad, imagen IS NOT NULL AS tiene_imagen';

    public function __construct(private readonly \PDO $pdo)
    {
    }

    // ---------- Equipos ----------

    public function equipos(): array
    {
        $filas = $this->pdo->query('SELECT id, nombre, miembros, codigo FROM olimpiadas_equipos ORDER BY nombre, id')->fetchAll();
        return array_map(self::aEquipo(...), $filas);
    }

    public function buscarEquipo(int $id): ?Equipo
    {
        return $this->unEquipo('id = ?', $id);
    }

    public function buscarEquipoPorCodigo(string $codigo): ?Equipo
    {
        return $this->unEquipo('codigo = ?', $codigo);
    }

    public function existeNombreEquipo(string $nombre, ?int $exceptoId = null): bool
    {
        // Sin distinguir mayúsculas (en MySQL ya lo hace la collation)
        $consulta = $this->pdo->prepare('SELECT COUNT(*) FROM olimpiadas_equipos WHERE LOWER(nombre) = LOWER(?) AND id <> ?');
        $consulta->execute([$nombre, $exceptoId ?? 0]);
        return (int) $consulta->fetchColumn() > 0;
    }

    public function guardarEquipo(Equipo $equipo): Equipo
    {
        $valores = [
            'nombre' => $equipo->nombre,
            'miembros' => json_encode($equipo->miembros, JSON_UNESCAPED_UNICODE),
            'codigo' => $equipo->codigo,
        ];
        if ($equipo->id === null) {
            $this->pdo->prepare('INSERT INTO olimpiadas_equipos (nombre, miembros, codigo) VALUES (:nombre, :miembros, :codigo)')->execute($valores);
            return $equipo->conId((int) $this->pdo->lastInsertId());
        }
        $this->pdo
            ->prepare('UPDATE olimpiadas_equipos SET nombre = :nombre, miembros = :miembros, codigo = :codigo WHERE id = :id')
            ->execute($valores + ['id' => $equipo->id]);
        return $equipo;
    }

    public function eliminarEquipo(int $id): void
    {
        // A mano también, por si la base no aplica ON DELETE CASCADE (SQLite sin PRAGMA)
        $this->pdo->prepare('DELETE FROM olimpiadas_puntuaciones WHERE equipo_id = ?')->execute([$id]);
        $this->pdo->prepare('DELETE FROM olimpiadas_partidas WHERE equipo_id = ?')->execute([$id]);
        $this->pdo->prepare('DELETE FROM olimpiadas_equipos WHERE id = ?')->execute([$id]);
    }

    // ---------- Pruebas ----------

    public function pruebas(): array
    {
        $filas = $this->pdo->query('SELECT id, nombre, tipo, descripcion, estado, origen, destino FROM olimpiadas_pruebas ORDER BY id')->fetchAll();
        return array_map(self::aPrueba(...), $filas);
    }

    public function buscarPrueba(int $id): ?Prueba
    {
        $consulta = $this->pdo->prepare('SELECT id, nombre, tipo, descripcion, estado, origen, destino FROM olimpiadas_pruebas WHERE id = ?');
        $consulta->execute([$id]);
        $fila = $consulta->fetch();
        return $fila === false ? null : self::aPrueba($fila);
    }

    public function guardarPrueba(Prueba $prueba): Prueba
    {
        $valores = [
            'nombre' => $prueba->nombre,
            'tipo' => $prueba->tipo->value,
            'descripcion' => $prueba->descripcion,
            'estado' => $prueba->estado->value,
            'origen' => $prueba->origen,
            'destino' => $prueba->destino,
        ];
        if ($prueba->id === null) {
            $this->pdo->prepare(
                'INSERT INTO olimpiadas_pruebas (nombre, tipo, descripcion, estado, origen, destino)
                 VALUES (:nombre, :tipo, :descripcion, :estado, :origen, :destino)'
            )->execute($valores);
            return $prueba->conId((int) $this->pdo->lastInsertId());
        }
        $this->pdo->prepare(
            'UPDATE olimpiadas_pruebas SET nombre = :nombre, tipo = :tipo, descripcion = :descripcion,
             estado = :estado, origen = :origen, destino = :destino WHERE id = :id'
        )->execute($valores + ['id' => $prueba->id]);
        return $prueba;
    }

    public function eliminarPrueba(int $id): void
    {
        $this->pdo->prepare('DELETE FROM olimpiadas_puntuaciones WHERE prueba_id = ?')->execute([$id]);
        $this->pdo->prepare('DELETE FROM olimpiadas_partidas WHERE prueba_id = ?')->execute([$id]);
        $this->pdo->prepare('DELETE FROM olimpiadas_pruebas WHERE id = ?')->execute([$id]);
    }

    // ---------- Prueba de imagen ----------

    public function puntuaciones(int $pruebaId): array
    {
        $consulta = $this->pdo->prepare('SELECT ' . self::COLUMNAS_PUNTUACION . ' FROM olimpiadas_puntuaciones WHERE prueba_id = ?');
        $consulta->execute([$pruebaId]);
        return array_map(self::aPuntuacion(...), $consulta->fetchAll());
    }

    public function buscarPuntuacion(int $pruebaId, int $equipoId): ?PuntuacionImagen
    {
        $consulta = $this->pdo->prepare('SELECT ' . self::COLUMNAS_PUNTUACION . ' FROM olimpiadas_puntuaciones WHERE prueba_id = ? AND equipo_id = ?');
        $consulta->execute([$pruebaId, $equipoId]);
        $fila = $consulta->fetch();
        return $fila === false ? null : self::aPuntuacion($fila);
    }

    public function guardarPuntuacion(PuntuacionImagen $puntuacion): void
    {
        $this->asegurarFila($puntuacion->pruebaId, $puntuacion->equipoId);
        $this->pdo->prepare(
            'UPDATE olimpiadas_puntuaciones SET originalidad = :originalidad, adecuacion = :adecuacion, calidad = :calidad
             WHERE prueba_id = :prueba AND equipo_id = :equipo'
        )->execute([
            'originalidad' => $puntuacion->notas['originalidad'],
            'adecuacion' => $puntuacion->notas['adecuacion'],
            'calidad' => $puntuacion->notas['calidad'],
            'prueba' => $puntuacion->pruebaId,
            'equipo' => $puntuacion->equipoId,
        ]);
    }

    public function guardarImagen(int $pruebaId, int $equipoId, ?string $contenido, ?string $tipo): void
    {
        $this->asegurarFila($pruebaId, $equipoId);
        $consulta = $this->pdo->prepare('UPDATE olimpiadas_puntuaciones SET imagen = ?, imagen_tipo = ? WHERE prueba_id = ? AND equipo_id = ?');
        $consulta->bindValue(1, $contenido, $contenido === null ? \PDO::PARAM_NULL : \PDO::PARAM_LOB);
        $consulta->bindValue(2, $tipo, $tipo === null ? \PDO::PARAM_NULL : \PDO::PARAM_STR);
        $consulta->bindValue(3, $pruebaId, \PDO::PARAM_INT);
        $consulta->bindValue(4, $equipoId, \PDO::PARAM_INT);
        $consulta->execute();
    }

    public function imagen(int $pruebaId, int $equipoId): ?array
    {
        $consulta = $this->pdo->prepare('SELECT imagen, imagen_tipo FROM olimpiadas_puntuaciones WHERE prueba_id = ? AND equipo_id = ? AND imagen IS NOT NULL');
        $consulta->execute([$pruebaId, $equipoId]);
        $fila = $consulta->fetch();
        if ($fila === false) {
            return null;
        }
        $contenido = is_resource($fila['imagen']) ? stream_get_contents($fila['imagen']) : $fila['imagen'];
        return ['contenido' => (string) $contenido, 'tipo' => (string) $fila['imagen_tipo']];
    }

    // ---------- Wiki Race ----------

    public function partidas(int $pruebaId): array
    {
        $consulta = $this->pdo->prepare('SELECT prueba_id, equipo_id, inicio_ms, fin_ms, ruta FROM olimpiadas_partidas WHERE prueba_id = ?');
        $consulta->execute([$pruebaId]);
        return array_map(self::aPartida(...), $consulta->fetchAll());
    }

    public function buscarPartida(int $pruebaId, int $equipoId): ?PartidaWikiRace
    {
        $consulta = $this->pdo->prepare('SELECT prueba_id, equipo_id, inicio_ms, fin_ms, ruta FROM olimpiadas_partidas WHERE prueba_id = ? AND equipo_id = ?');
        $consulta->execute([$pruebaId, $equipoId]);
        $fila = $consulta->fetch();
        return $fila === false ? null : self::aPartida($fila);
    }

    public function guardarPartida(PartidaWikiRace $partida): void
    {
        $valores = [
            'inicio' => $partida->inicioMs,
            'fin' => $partida->finMs,
            'ruta' => json_encode($partida->ruta, JSON_UNESCAPED_UNICODE),
            'prueba' => $partida->pruebaId,
            'equipo' => $partida->equipoId,
        ];
        $existe = $this->pdo->prepare('SELECT COUNT(*) FROM olimpiadas_partidas WHERE prueba_id = ? AND equipo_id = ?');
        $existe->execute([$partida->pruebaId, $partida->equipoId]);
        $sql = (int) $existe->fetchColumn() > 0
            ? 'UPDATE olimpiadas_partidas SET inicio_ms = :inicio, fin_ms = :fin, ruta = :ruta WHERE prueba_id = :prueba AND equipo_id = :equipo'
            : 'INSERT INTO olimpiadas_partidas (prueba_id, equipo_id, inicio_ms, fin_ms, ruta) VALUES (:prueba, :equipo, :inicio, :fin, :ruta)';
        $this->pdo->prepare($sql)->execute($valores);
    }

    public function eliminarPartida(int $pruebaId, int $equipoId): void
    {
        $this->pdo->prepare('DELETE FROM olimpiadas_partidas WHERE prueba_id = ? AND equipo_id = ?')->execute([$pruebaId, $equipoId]);
    }

    // ---------- Auxiliares ----------

    private function unEquipo(string $condicion, int|string $valor): ?Equipo
    {
        $consulta = $this->pdo->prepare("SELECT id, nombre, miembros, codigo FROM olimpiadas_equipos WHERE {$condicion}");
        $consulta->execute([$valor]);
        $fila = $consulta->fetch();
        return $fila === false ? null : self::aEquipo($fila);
    }

    /** Crea la fila de notas/imagen del equipo en la prueba si aún no existe. */
    private function asegurarFila(int $pruebaId, int $equipoId): void
    {
        $existe = $this->pdo->prepare('SELECT COUNT(*) FROM olimpiadas_puntuaciones WHERE prueba_id = ? AND equipo_id = ?');
        $existe->execute([$pruebaId, $equipoId]);
        if ((int) $existe->fetchColumn() === 0) {
            $this->pdo->prepare('INSERT INTO olimpiadas_puntuaciones (prueba_id, equipo_id) VALUES (?, ?)')->execute([$pruebaId, $equipoId]);
        }
    }

    /** @param array<string, mixed> $fila */
    private static function aEquipo(array $fila): Equipo
    {
        $miembros = json_decode((string) $fila['miembros'], true);
        return Equipo::desdeDatos(
            ['nombre' => (string) $fila['nombre'], 'miembros' => is_array($miembros) ? array_values($miembros) : []],
            (string) $fila['codigo'],
            (int) $fila['id'],
        );
    }

    /** @param array<string, mixed> $fila */
    private static function aPrueba(array $fila): Prueba
    {
        return Prueba::desdeDatos([
            'nombre' => (string) $fila['nombre'],
            'tipo' => (string) $fila['tipo'],
            'descripcion' => (string) $fila['descripcion'],
            'estado' => (string) $fila['estado'],
            'origen' => (string) $fila['origen'],
            'destino' => (string) $fila['destino'],
        ], (int) $fila['id'])->conArticulos((string) $fila['origen'], (string) $fila['destino']);
    }

    /** @param array<string, mixed> $fila */
    private static function aPuntuacion(array $fila): PuntuacionImagen
    {
        $nota = static fn ($valor) => $valor === null ? null : (int) $valor;
        return PuntuacionImagen::reconstruir((int) $fila['prueba_id'], (int) $fila['equipo_id'], [
            'originalidad' => $nota($fila['originalidad']),
            'adecuacion' => $nota($fila['adecuacion']),
            'calidad' => $nota($fila['calidad']),
        ], (bool) $fila['tiene_imagen']);
    }

    /** @param array<string, mixed> $fila */
    private static function aPartida(array $fila): PartidaWikiRace
    {
        $ruta = json_decode((string) $fila['ruta'], true);
        return PartidaWikiRace::reconstruir(
            (int) $fila['prueba_id'],
            (int) $fila['equipo_id'],
            (int) $fila['inicio_ms'],
            $fila['fin_ms'] === null ? null : (int) $fila['fin_ms'],
            is_array($ruta) ? array_values($ruta) : [],
        );
    }
}
