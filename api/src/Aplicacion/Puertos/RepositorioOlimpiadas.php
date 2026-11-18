<?php

declare(strict_types=1);

namespace CodeUrv\Aplicacion\Puertos;

use CodeUrv\Dominio\Olimpiadas\Equipo;
use CodeUrv\Dominio\Olimpiadas\PartidaWikiRace;
use CodeUrv\Dominio\Olimpiadas\Prueba;
use CodeUrv\Dominio\Olimpiadas\PuntuacionImagen;

/** Equipos, pruebas y resultados de las CodeOlimpiadas. */
interface RepositorioOlimpiadas
{
    /** @return list<Equipo> ordenados por nombre */
    public function equipos(): array;

    public function buscarEquipo(int $id): ?Equipo;

    public function buscarEquipoPorCodigo(string $codigo): ?Equipo;

    public function existeNombreEquipo(string $nombre, ?int $exceptoId = null): bool;

    public function guardarEquipo(Equipo $equipo): Equipo;

    /** Borra también sus notas, imágenes y partidas. */
    public function eliminarEquipo(int $id): void;

    /** @return list<Prueba> en orden de creación */
    public function pruebas(): array;

    public function buscarPrueba(int $id): ?Prueba;

    public function guardarPrueba(Prueba $prueba): Prueba;

    /** Borra también sus notas, imágenes y partidas. */
    public function eliminarPrueba(int $id): void;

    /** @return list<PuntuacionImagen> */
    public function puntuaciones(int $pruebaId): array;

    public function buscarPuntuacion(int $pruebaId, int $equipoId): ?PuntuacionImagen;

    /** Guarda las notas (la imagen se guarda aparte). */
    public function guardarPuntuacion(PuntuacionImagen $puntuacion): void;

    /** null en $contenido borra la imagen. */
    public function guardarImagen(int $pruebaId, int $equipoId, ?string $contenido, ?string $tipo): void;

    /** @return array{contenido: string, tipo: string}|null */
    public function imagen(int $pruebaId, int $equipoId): ?array;

    /** @return list<PartidaWikiRace> */
    public function partidas(int $pruebaId): array;

    public function buscarPartida(int $pruebaId, int $equipoId): ?PartidaWikiRace;

    public function guardarPartida(PartidaWikiRace $partida): void;

    public function eliminarPartida(int $pruebaId, int $equipoId): void;
}
