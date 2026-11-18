<?php

declare(strict_types=1);

namespace CodeUrv\Aplicacion\CasosDeUso;

use CodeUrv\Aplicacion\Conflicto;
use CodeUrv\Aplicacion\DemasiadosIntentos;
use CodeUrv\Aplicacion\NoAutorizado;
use CodeUrv\Aplicacion\Puertos\RegistroIntentos;
use CodeUrv\Aplicacion\Puertos\RepositorioOlimpiadas;
use CodeUrv\Aplicacion\Puertos\Wikipedia;
use CodeUrv\Dominio\NoEncontrado;
use CodeUrv\Dominio\Olimpiadas\Equipo;
use CodeUrv\Dominio\Olimpiadas\EstadoPrueba;
use CodeUrv\Dominio\Olimpiadas\PartidaWikiRace;
use CodeUrv\Dominio\Olimpiadas\Prueba;
use CodeUrv\Dominio\Olimpiadas\TipoPrueba;

/**
 * Jugar una Wiki Race desde la web con el código del equipo. El servidor mide el tiempo
 * y comprueba en Wikipedia que cada clic es un enlace del artículo en el que estaban.
 */
final class JugarWikiRace
{
    private const MAX_FALLOS = 10;
    private const VENTANA_SEGUNDOS = 900;

    /** @param \Closure(): \DateTimeImmutable $reloj */
    public function __construct(
        private readonly RepositorioOlimpiadas $repositorio,
        private readonly Wikipedia $wikipedia,
        private readonly RegistroIntentos $intentos,
        private readonly \Closure $reloj,
        private readonly VisibilidadOlimpiadas $visibilidad,
    ) {
    }

    /**
     * Empieza la partida del equipo, o la recupera si ya había empezado (p. ej. al recargar).
     * @return array<string, mixed>
     */
    public function empezar(int $pruebaId, string $codigo, string $ip, bool $esAdmin = false): array
    {
        $this->visibilidad->exigir($esAdmin);
        $prueba = $this->pruebaEnCurso($pruebaId);
        $equipo = $this->equipo($codigo, $ip);
        $partida = $this->repositorio->buscarPartida($pruebaId, $equipo->id);
        if ($partida === null) {
            $partida = PartidaWikiRace::empezar($pruebaId, $equipo->id, $prueba->origen, $this->ahoraMs());
            $this->repositorio->guardarPartida($partida);
        }
        return $this->estado($prueba, $equipo, $partida);
    }

    /**
     * Un clic en un enlace (o "Atrás", que vuelve al artículo anterior y también cuenta).
     * @return array<string, mixed>
     */
    public function avanzar(int $pruebaId, string $codigo, string $articulo, string $ip, bool $esAdmin = false): array
    {
        $this->visibilidad->exigir($esAdmin);
        $prueba = $this->pruebaEnCurso($pruebaId);
        $equipo = $this->equipo($codigo, $ip);
        $partida = $this->repositorio->buscarPartida($pruebaId, $equipo->id)
            ?? throw new Conflicto('Primero tenéis que empezar la partida.');
        if ($partida->terminada()) {
            return $this->estado($prueba, $equipo, $partida);
        }
        if (!$partida->puedeSeguir()) {
            throw new Conflicto('Habéis llegado al máximo de ' . PartidaWikiRace::MAX_CLICS . ' clics.');
        }

        $articulo = Prueba::normalizarArticulo($articulo);
        if ($articulo === '' || mb_strlen($articulo) > Prueba::MAX_ARTICULO) {
            throw new Conflicto('Artículo no válido.');
        }
        $destino = $articulo === $partida->anterior()
            ? $articulo
            : $this->wikipedia->seguirEnlace($partida->actual(), $articulo);
        if ($destino === null) {
            throw new Conflicto("Ese enlace no está en «{$partida->actual()}».");
        }

        $partida = $partida->avanzar($destino, $destino === $prueba->destino, $this->ahoraMs());
        $this->repositorio->guardarPartida($partida);
        return $this->estado($prueba, $equipo, $partida);
    }

    /** @return array<string, mixed> */
    private function estado(Prueba $prueba, Equipo $equipo, PartidaWikiRace $partida): array
    {
        return [
            'prueba' => ['id' => $prueba->id, 'nombre' => $prueba->nombre, 'origen' => $prueba->origen, 'destino' => $prueba->destino],
            'equipo' => ['id' => $equipo->id, 'nombre' => $equipo->nombre],
            'partida' => $partida->aArray(),
            // Para que el cronómetro del navegador vaya con la hora del servidor
            'transcurridoMs' => $partida->tiempoMs() ?? max(0, $this->ahoraMs() - $partida->inicioMs),
        ];
    }

    private function pruebaEnCurso(int $id): Prueba
    {
        $prueba = $this->repositorio->buscarPrueba($id);
        if ($prueba === null || $prueba->tipo !== TipoPrueba::WikiRace || !$prueba->esVisible()) {
            throw new NoEncontrado('Esta Wiki Race no existe.');
        }
        if ($prueba->estado !== EstadoPrueba::EnCurso) {
            throw new Conflicto('Esta Wiki Race ya ha terminado.');
        }
        return $prueba;
    }

    private function equipo(string $codigo, string $ip): Equipo
    {
        $clave = 'wikirace:' . $ip;
        $ahora = ($this->reloj)()->getTimestamp();
        if ($this->intentos->fallosDesde($clave, $ahora - self::VENTANA_SEGUNDOS) >= self::MAX_FALLOS) {
            throw new DemasiadosIntentos('Demasiados códigos incorrectos. Espera 15 minutos.');
        }
        $codigo = strtoupper(trim($codigo));
        $equipo = preg_match(Equipo::PATRON_CODIGO, $codigo) ? $this->repositorio->buscarEquipoPorCodigo($codigo) : null;
        if ($equipo === null) {
            $this->intentos->registrarFallo($clave, $ahora);
            throw new NoAutorizado('El código de equipo no es correcto.');
        }
        return $equipo;
    }

    private function ahoraMs(): int
    {
        return (int) ($this->reloj)()->format('Uv');
    }
}
