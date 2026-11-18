<?php

declare(strict_types=1);

namespace CodeUrv\Aplicacion\CasosDeUso;

use CodeUrv\Aplicacion\Puertos\RepositorioOlimpiadas;
use CodeUrv\Dominio\NoEncontrado;
use CodeUrv\Dominio\Olimpiadas\Clasificacion;
use CodeUrv\Dominio\Olimpiadas\Equipo;
use CodeUrv\Dominio\Olimpiadas\EstadoPrueba;
use CodeUrv\Dominio\Olimpiadas\PartidaWikiRace;
use CodeUrv\Dominio\Olimpiadas\Prueba;
use CodeUrv\Dominio\Olimpiadas\PuntuacionImagen;
use CodeUrv\Dominio\Olimpiadas\TipoPrueba;

/**
 * Ranking y resultados. El público solo ve las pruebas en curso o finalizadas, y los
 * resultados de las finalizadas (que son las que suman en el ranking general).
 */
final class ConsultarOlimpiadas
{
    public function __construct(
        private readonly RepositorioOlimpiadas $repositorio,
        private readonly VisibilidadOlimpiadas $visibilidad,
    ) {
    }

    public function visibles(): bool
    {
        return $this->visibilidad->visibles();
    }

    /**
     * @param bool $admin datos de administración (códigos, notas, partidas en curso)
     * @param bool $esAdmin quien pregunta es admin: puede verlas aunque estén ocultas
     * @return array<string, mixed>
     */
    public function resumen(bool $admin = false, bool $esAdmin = false): array
    {
        $this->visibilidad->exigir($admin || $esAdmin);
        $equipos = [];
        foreach ($this->repositorio->equipos() as $equipo) {
            $equipos[$equipo->id] = $equipo;
        }

        $pruebas = [];
        $finalizadas = [];
        foreach ($this->repositorio->pruebas() as $prueba) {
            if (!$admin && !$prueba->esVisible()) {
                continue;
            }
            $puntuaciones = $prueba->tipo === TipoPrueba::Imagen ? $this->repositorio->puntuaciones($prueba->id) : [];
            $partidas = $prueba->tipo === TipoPrueba::WikiRace ? $this->repositorio->partidas($prueba->id) : [];
            $clasificacion = $this->clasificacion($prueba, $equipos, $puntuaciones, $partidas);
            if ($prueba->finalizada()) {
                $finalizadas[] = $clasificacion;
            }

            $datos = $prueba->aArray($admin);
            if ($admin || $prueba->finalizada()) {
                $datos['clasificacion'] = $clasificacion;
            }
            if ($prueba->tipo === TipoPrueba::WikiRace && $prueba->estado === EstadoPrueba::EnCurso) {
                $datos['jugando'] = count(array_filter($partidas, static fn (PartidaWikiRace $p) => !$p->terminada()));
                $datos['llegados'] = count(array_filter($partidas, static fn (PartidaWikiRace $p) => $p->terminada()));
            }
            if ($admin) {
                $datos['puntuaciones'] = array_map(static fn (PuntuacionImagen $p) => $p->aArray(), $puntuaciones);
                $datos['partidas'] = array_map(static fn (PartidaWikiRace $p) => $p->aArray(), $partidas);
            }
            $pruebas[] = $datos;
        }

        $ranking = array_map(
            static fn (array $fila) => $fila + ['nombre' => $equipos[$fila['equipoId']]->nombre],
            Clasificacion::general(array_keys($equipos), $finalizadas),
        );

        return [
            'equipos' => array_values(array_map(static fn (Equipo $e) => $e->aArray($admin), $equipos)),
            'pruebas' => $pruebas,
            'ranking' => $ranking,
            'criterios' => PuntuacionImagen::CRITERIOS,
            'puntosPorPosicion' => Clasificacion::PUNTOS,
            'visibles' => $this->visibilidad->visibles(),
        ];
    }

    /**
     * Imagen de un equipo; el público solo puede verla cuando la prueba ha terminado.
     * @return array{contenido: string, tipo: string}
     */
    public function imagenPublica(int $pruebaId, int $equipoId, bool $esAdmin = false): array
    {
        $this->visibilidad->exigir($esAdmin);
        $prueba = $this->repositorio->buscarPrueba($pruebaId);
        if ($prueba === null || $prueba->tipo !== TipoPrueba::Imagen || !$prueba->finalizada()) {
            throw new NoEncontrado('La imagen no existe.');
        }
        return $this->repositorio->imagen($pruebaId, $equipoId) ?? throw new NoEncontrado('La imagen no existe.');
    }

    /**
     * @param array<int, Equipo> $equipos
     * @param list<PuntuacionImagen> $puntuaciones
     * @param list<PartidaWikiRace> $partidas
     * @return list<array<string, mixed>>
     */
    private function clasificacion(Prueba $prueba, array $equipos, array $puntuaciones, array $partidas): array
    {
        $resultados = [];
        if ($prueba->tipo === TipoPrueba::Imagen) {
            foreach ($puntuaciones as $p) {
                if ($p->completa() && isset($equipos[$p->equipoId])) {
                    $resultados[$p->equipoId] = $p;
                }
            }
            $comparar = static fn (PuntuacionImagen $a, PuntuacionImagen $b) => $b->total() <=> $a->total();
        } else {
            foreach ($partidas as $p) {
                if ($p->terminada() && isset($equipos[$p->equipoId])) {
                    $resultados[$p->equipoId] = $p;
                }
            }
            $comparar = PartidaWikiRace::comparar(...);
        }

        return array_map(static fn (array $fila) => $fila + [
            'nombre' => $equipos[$fila['equipoId']]->nombre,
            'detalle' => $resultados[$fila['equipoId']]->aArray(),
        ], Clasificacion::calcular($resultados, $comparar));
    }
}
