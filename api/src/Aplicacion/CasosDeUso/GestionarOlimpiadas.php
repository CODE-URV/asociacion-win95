<?php

declare(strict_types=1);

namespace CodeUrv\Aplicacion\CasosDeUso;

use CodeUrv\Aplicacion\Conflicto;
use CodeUrv\Aplicacion\Puertos\RepositorioOlimpiadas;
use CodeUrv\Aplicacion\Puertos\Wikipedia;
use CodeUrv\Dominio\ErrorDeValidacion;
use CodeUrv\Dominio\NoEncontrado;
use CodeUrv\Dominio\Olimpiadas\Equipo;
use CodeUrv\Dominio\Olimpiadas\Prueba;
use CodeUrv\Dominio\Olimpiadas\PuntuacionImagen;
use CodeUrv\Dominio\Olimpiadas\TipoPrueba;

/** Administración de las CodeOlimpiadas (solo admin). */
final class GestionarOlimpiadas
{
    public const MAX_IMAGEN = 4 * 1024 * 1024;
    private const TIPOS_IMAGEN = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

    /** @param \Closure(): string $generarCodigo código de equipo de 6 caracteres */
    public function __construct(
        private readonly RepositorioOlimpiadas $repositorio,
        private readonly Wikipedia $wikipedia,
        private readonly \Closure $generarCodigo,
        private readonly ?VisibilidadOlimpiadas $visibilidad = null,
    ) {
    }

    /** Mostrar u ocultar las CodeOlimpiadas en el escritorio del público. */
    public function cambiarVisibilidad(bool $visibles): void
    {
        ($this->visibilidad ?? throw new \LogicException('Sin visibilidad configurada.'))->cambiar($visibles);
    }

    // ---------- Equipos ----------

    /** @param array<string, mixed> $datos */
    public function crearEquipo(array $datos): Equipo
    {
        $equipo = Equipo::desdeDatos($datos, $this->codigoLibre());
        $this->exigirNombreLibre($equipo->nombre);
        return $this->repositorio->guardarEquipo($equipo);
    }

    /** @param array<string, mixed> $datos */
    public function actualizarEquipo(int $id, array $datos): Equipo
    {
        $anterior = $this->equipo($id);
        $equipo = Equipo::desdeDatos($datos, $anterior->codigo, $id);
        $this->exigirNombreLibre($equipo->nombre, $id);
        return $this->repositorio->guardarEquipo($equipo);
    }

    public function eliminarEquipo(int $id): void
    {
        $this->equipo($id);
        $this->repositorio->eliminarEquipo($id);
    }

    // ---------- Pruebas ----------

    /** @param array<string, mixed> $datos */
    public function crearPrueba(array $datos): Prueba
    {
        $prueba = Prueba::desdeDatos($datos);
        if ($prueba->tipo === TipoPrueba::WikiRace) {
            $prueba = $this->comprobarArticulos($prueba);
        }
        return $this->repositorio->guardarPrueba($prueba);
    }

    /** @param array<string, mixed> $datos */
    public function actualizarPrueba(int $id, array $datos): Prueba
    {
        $anterior = $this->prueba($id);
        $prueba = Prueba::desdeDatos($datos, $id);

        $hayResultados = $this->repositorio->puntuaciones($id) !== [] || $this->repositorio->partidas($id) !== [];
        if ($prueba->tipo !== $anterior->tipo && $hayResultados) {
            throw new Conflicto('No se puede cambiar el tipo de una prueba que ya tiene resultados.');
        }
        if ($prueba->tipo === TipoPrueba::WikiRace && !$prueba->mismosArticulos($anterior)) {
            if ($this->repositorio->partidas($id) !== []) {
                throw new Conflicto('Ya hay equipos que han jugado esta Wiki Race: no se pueden cambiar los artículos.');
            }
            $prueba = $this->comprobarArticulos($prueba);
        }
        return $this->repositorio->guardarPrueba($prueba);
    }

    public function eliminarPrueba(int $id): void
    {
        $this->prueba($id);
        $this->repositorio->eliminarPrueba($id);
    }

    // ---------- Prueba de imagen ----------

    /** @param array<string, mixed> $notas */
    public function puntuar(int $pruebaId, int $equipoId, array $notas): PuntuacionImagen
    {
        $this->pruebaDeImagen($pruebaId);
        $this->equipo($equipoId);
        $puntuacion = ($this->repositorio->buscarPuntuacion($pruebaId, $equipoId) ?? PuntuacionImagen::vacia($pruebaId, $equipoId))
            ->conNotas($notas);
        $this->repositorio->guardarPuntuacion($puntuacion);
        return $puntuacion;
    }

    public function subirImagen(int $pruebaId, int $equipoId, string $contenido): PuntuacionImagen
    {
        $this->pruebaDeImagen($pruebaId);
        $this->equipo($equipoId);
        if ($contenido === '' || strlen($contenido) > self::MAX_IMAGEN) {
            throw new ErrorDeValidacion(['imagen' => 'La imagen tiene que ocupar como máximo 4 MB.']);
        }
        $info = @getimagesizefromstring($contenido);
        $tipo = is_array($info) ? ($info['mime'] ?? '') : '';
        if (!in_array($tipo, self::TIPOS_IMAGEN, true)) {
            throw new ErrorDeValidacion(['imagen' => 'Tiene que ser una imagen JPG, PNG, WebP o GIF.']);
        }
        $this->repositorio->guardarImagen($pruebaId, $equipoId, $contenido, $tipo);
        return $this->repositorio->buscarPuntuacion($pruebaId, $equipoId) ?? throw new \LogicException('No se ha guardado la imagen.');
    }

    public function eliminarImagen(int $pruebaId, int $equipoId): void
    {
        $this->pruebaDeImagen($pruebaId);
        $this->repositorio->guardarImagen($pruebaId, $equipoId, null, null);
    }

    /** @return array{contenido: string, tipo: string} */
    public function imagen(int $pruebaId, int $equipoId): array
    {
        return $this->repositorio->imagen($pruebaId, $equipoId) ?? throw new NoEncontrado('Este equipo no tiene imagen.');
    }

    // ---------- Wiki Race ----------

    /** Por si un equipo ha tenido un problema: puede volver a empezar desde cero. */
    public function reiniciarPartida(int $pruebaId, int $equipoId): void
    {
        $this->prueba($pruebaId);
        $this->repositorio->eliminarPartida($pruebaId, $equipoId);
    }

    // ---------- Auxiliares ----------

    private function comprobarArticulos(Prueba $prueba): Prueba
    {
        $errores = [];
        $origen = $this->wikipedia->articulo($prueba->origen);
        $destino = $this->wikipedia->articulo($prueba->destino);
        if ($origen === null) {
            $errores['origen'] = 'Este artículo no existe en Wikipedia en español.';
        }
        if ($destino === null) {
            $errores['destino'] = 'Este artículo no existe en Wikipedia en español.';
        }
        if ($origen !== null && $origen === $destino) {
            $errores['destino'] = 'Lleva al mismo artículo que el de salida.';
        }
        if ($errores !== []) {
            throw new ErrorDeValidacion($errores);
        }
        return $prueba->conArticulos($origen, $destino);
    }

    private function codigoLibre(): string
    {
        for ($intento = 0; $intento < 20; $intento++) {
            $codigo = ($this->generarCodigo)();
            if ($this->repositorio->buscarEquipoPorCodigo($codigo) === null) {
                return $codigo;
            }
        }
        throw new \RuntimeException('No se ha podido generar un código de equipo libre.');
    }

    private function exigirNombreLibre(string $nombre, ?int $exceptoId = null): void
    {
        if ($this->repositorio->existeNombreEquipo($nombre, $exceptoId)) {
            throw new ErrorDeValidacion(['nombre' => 'Ya hay un equipo con este nombre.']);
        }
    }

    private function equipo(int $id): Equipo
    {
        return $this->repositorio->buscarEquipo($id) ?? throw new NoEncontrado('El equipo no existe.');
    }

    private function prueba(int $id): Prueba
    {
        return $this->repositorio->buscarPrueba($id) ?? throw new NoEncontrado('La prueba no existe.');
    }

    private function pruebaDeImagen(int $id): Prueba
    {
        $prueba = $this->prueba($id);
        if ($prueba->tipo !== TipoPrueba::Imagen) {
            throw new Conflicto('Esta prueba no es de imagen.');
        }
        return $prueba;
    }
}
