<?php

declare(strict_types=1);

namespace CodeUrv\Dominio\Olimpiadas;

use CodeUrv\Dominio\ErrorDeValidacion;

/** Una prueba de las CodeOlimpiadas. La Wiki Race lleva artículo de salida y de llegada. */
final class Prueba
{
    public const MAX_NOMBRE = 100;
    public const MAX_DESCRIPCION = 2000;
    public const MAX_ARTICULO = 255;

    private function __construct(
        public readonly ?int $id,
        public readonly string $nombre,
        public readonly TipoPrueba $tipo,
        public readonly string $descripcion,
        public readonly EstadoPrueba $estado,
        public readonly string $origen,
        public readonly string $destino,
    ) {
    }

    /** @param array<string, mixed> $datos */
    public static function desdeDatos(array $datos, ?int $id = null): self
    {
        $errores = [];
        $texto = static function (string $campo, int $maximo, bool $obligatorio) use ($datos, &$errores): string {
            $valor = $datos[$campo] ?? '';
            if (!is_string($valor)) {
                $errores[$campo] = 'Debe ser texto.';
                return '';
            }
            $valor = trim($valor);
            if ($obligatorio && $valor === '') {
                $errores[$campo] = 'Es obligatorio.';
            } elseif (mb_strlen($valor) > $maximo) {
                $errores[$campo] = 'Máximo ' . $maximo . ' caracteres.';
            }
            return $valor;
        };

        $tipo = is_string($datos['tipo'] ?? null) ? TipoPrueba::tryFrom($datos['tipo']) : null;
        if ($tipo === null) {
            $errores['tipo'] = 'Tipo no válido.';
        }
        $estado = EstadoPrueba::Preparacion;
        if (array_key_exists('estado', $datos)) {
            $estado = is_string($datos['estado']) ? EstadoPrueba::tryFrom($datos['estado']) : null;
            if ($estado === null) {
                $errores['estado'] = 'Estado no válido.';
            }
        }

        $nombre = $texto('nombre', self::MAX_NOMBRE, true);
        $descripcion = $texto('descripcion', self::MAX_DESCRIPCION, false);
        $esWiki = $tipo === TipoPrueba::WikiRace;
        $origen = $esWiki ? self::normalizarArticulo($texto('origen', self::MAX_ARTICULO, true)) : '';
        $destino = $esWiki ? self::normalizarArticulo($texto('destino', self::MAX_ARTICULO, true)) : '';
        if ($esWiki && $origen !== '' && $origen === $destino) {
            $errores['destino'] = 'Tiene que ser distinto del artículo de salida.';
        }

        if ($errores !== []) {
            throw new ErrorDeValidacion($errores);
        }
        return new self($id, $nombre, $tipo, $descripcion, $estado, $origen, $destino);
    }

    /** "inteligencia_artificial" → "Inteligencia artificial" (como lo escribe Wikipedia). */
    public static function normalizarArticulo(string $titulo): string
    {
        $titulo = trim(preg_replace('/\s+/u', ' ', str_replace('_', ' ', $titulo)) ?? '');
        return $titulo === '' ? '' : mb_strtoupper(mb_substr($titulo, 0, 1)) . mb_substr($titulo, 1);
    }

    public function conId(int $id): self
    {
        return new self($id, $this->nombre, $this->tipo, $this->descripcion, $this->estado, $this->origen, $this->destino);
    }

    /** Con los títulos tal como los devuelve Wikipedia (siguiendo redirecciones). */
    public function conArticulos(string $origen, string $destino): self
    {
        return new self($this->id, $this->nombre, $this->tipo, $this->descripcion, $this->estado, $origen, $destino);
    }

    public function esVisible(): bool
    {
        return $this->estado !== EstadoPrueba::Preparacion;
    }

    public function finalizada(): bool
    {
        return $this->estado === EstadoPrueba::Finalizada;
    }

    public function mismosArticulos(self $otra): bool
    {
        return $this->origen === $otra->origen && $this->destino === $otra->destino;
    }

    /** @return array<string, mixed> los artículos de la Wiki Race solo se ven al jugar o al terminar */
    public function aArray(bool $admin = false): array
    {
        $datos = [
            'id' => $this->id,
            'nombre' => $this->nombre,
            'tipo' => $this->tipo->value,
            'descripcion' => $this->descripcion,
            'estado' => $this->estado->value,
        ];
        if ($this->tipo === TipoPrueba::WikiRace && ($admin || $this->finalizada())) {
            $datos['origen'] = $this->origen;
            $datos['destino'] = $this->destino;
        }
        return $datos;
    }
}
