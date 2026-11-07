<?php

declare(strict_types=1);

namespace CodeUrv\Infraestructura\BaseDeDatos;

use CodeUrv\Aplicacion\Conflicto;
use CodeUrv\Aplicacion\Puertos\RepositorioInscripciones;
use CodeUrv\Dominio\InscripcionActividad;

final class RepositorioInscripcionesPdo implements RepositorioInscripciones
{
    private const COLUMNAS = 'id, actividad_id, email, nombre, apellidos, grado, curso, codigo, inscrito_en, asistio_en, certificado_enviado_en';

    public function __construct(private readonly \PDO $pdo)
    {
    }

    public function deActividad(int $actividadId): array
    {
        $consulta = $this->pdo->prepare('SELECT ' . self::COLUMNAS . ' FROM inscripciones_actividad WHERE actividad_id = ? ORDER BY apellidos, nombre');
        $consulta->execute([$actividadId]);
        return array_map(self::aInscripcion(...), $consulta->fetchAll());
    }

    public function recuento(): array
    {
        $filas = $this->pdo->query(
            'SELECT actividad_id, COUNT(*) AS inscritos, COUNT(asistio_en) AS asistentes
             FROM inscripciones_actividad GROUP BY actividad_id'
        )->fetchAll();

        $recuento = [];
        foreach ($filas as $fila) {
            $recuento[(int) $fila['actividad_id']] = ['inscritos' => (int) $fila['inscritos'], 'asistentes' => (int) $fila['asistentes']];
        }
        return $recuento;
    }

    public function buscar(int $id): ?InscripcionActividad
    {
        return $this->unaPor('id = ?', [$id]);
    }

    public function buscarPorEmail(int $actividadId, string $email): ?InscripcionActividad
    {
        return $this->unaPor('actividad_id = ? AND email = ?', [$actividadId, InscripcionActividad::normalizarEmail($email)]);
    }

    public function buscarPorCodigo(string $codigo): ?InscripcionActividad
    {
        return $this->unaPor('codigo = ?', [strtoupper(trim($codigo))]);
    }

    public function guardar(InscripcionActividad $inscripcion): InscripcionActividad
    {
        $fecha = static fn (?\DateTimeImmutable $f) => $f?->format('Y-m-d H:i:s');
        $valores = [
            'actividad_id' => $inscripcion->actividadId,
            'email' => $inscripcion->email,
            'nombre' => $inscripcion->nombre,
            'apellidos' => $inscripcion->apellidos,
            'grado' => $inscripcion->grado,
            'curso' => $inscripcion->curso,
            'codigo' => $inscripcion->codigo,
            'inscrito_en' => $fecha($inscripcion->inscritoEn),
            'asistio_en' => $fecha($inscripcion->asistioEn),
            'certificado_enviado_en' => $fecha($inscripcion->certificadoEnviadoEn),
        ];

        if ($inscripcion->id === null) {
            $columnas = implode(', ', array_keys($valores));
            $marcadores = ':' . implode(', :', array_keys($valores));
            try {
                $this->pdo->prepare("INSERT INTO inscripciones_actividad ({$columnas}) VALUES ({$marcadores})")->execute($valores);
            } catch (\PDOException $e) {
                // Dos envíos casi a la vez con el mismo correo: la restricción UNIQUE lo frena
                if ($e->getCode() === '23000') {
                    throw new Conflicto('Ya estás inscrito en esta actividad con este correo.');
                }
                throw $e;
            }
            return $inscripcion->conId((int) $this->pdo->lastInsertId());
        }

        $this->pdo->prepare(
            'UPDATE inscripciones_actividad SET asistio_en = :asistio_en, certificado_enviado_en = :certificado_enviado_en WHERE id = :id'
        )->execute([
            'asistio_en' => $valores['asistio_en'],
            'certificado_enviado_en' => $valores['certificado_enviado_en'],
            'id' => $inscripcion->id,
        ]);
        return $inscripcion;
    }

    public function eliminar(int $id): bool
    {
        $consulta = $this->pdo->prepare('DELETE FROM inscripciones_actividad WHERE id = ?');
        $consulta->execute([$id]);
        return $consulta->rowCount() > 0;
    }

    /** @param list<mixed> $parametros */
    private function unaPor(string $condicion, array $parametros): ?InscripcionActividad
    {
        $consulta = $this->pdo->prepare('SELECT ' . self::COLUMNAS . " FROM inscripciones_actividad WHERE {$condicion}");
        $consulta->execute($parametros);
        $fila = $consulta->fetch();
        return $fila === false ? null : self::aInscripcion($fila);
    }

    /** @param array<string, mixed> $fila */
    private static function aInscripcion(array $fila): InscripcionActividad
    {
        $fecha = static fn ($v) => $v === null ? null : new \DateTimeImmutable((string) $v);
        return InscripcionActividad::desdeAlmacen(
            (int) $fila['id'],
            (int) $fila['actividad_id'],
            (string) $fila['email'],
            (string) $fila['nombre'],
            (string) $fila['apellidos'],
            (string) $fila['grado'],
            (string) $fila['curso'],
            (string) $fila['codigo'],
            $fecha($fila['inscrito_en']),
            $fecha($fila['asistio_en']),
            $fecha($fila['certificado_enviado_en']),
        );
    }
}
