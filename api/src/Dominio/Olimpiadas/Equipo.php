<?php

declare(strict_types=1);

namespace CodeUrv\Dominio\Olimpiadas;

use CodeUrv\Dominio\ErrorDeValidacion;

/** Equipo de las CodeOlimpiadas. El código sirve para jugar la Wiki Race desde la web. */
final class Equipo
{
    public const MAX_NOMBRE = 60;
    public const MAX_MIEMBRO = 80;
    public const MAX_MIEMBROS = 10;
    /** 6 caracteres sin letras que se confunden (0/O, 1/I) */
    public const PATRON_CODIGO = '/^[A-HJ-NP-Z2-9]{6}$/';

    /** @param list<string> $miembros */
    private function __construct(
        public readonly ?int $id,
        public readonly string $nombre,
        public readonly array $miembros,
        public readonly string $codigo,
    ) {
    }

    /** @param array<string, mixed> $datos */
    public static function desdeDatos(array $datos, string $codigo, ?int $id = null): self
    {
        if (!preg_match(self::PATRON_CODIGO, $codigo)) {
            throw new \InvalidArgumentException('Código de equipo no válido.');
        }

        $errores = [];
        $nombre = $datos['nombre'] ?? '';
        $nombre = is_string($nombre) ? trim($nombre) : '';
        if ($nombre === '') {
            $errores['nombre'] = 'Es obligatorio.';
        } elseif (mb_strlen($nombre) > self::MAX_NOMBRE) {
            $errores['nombre'] = 'Máximo ' . self::MAX_NOMBRE . ' caracteres.';
        }

        $miembros = [];
        $lista = $datos['miembros'] ?? [];
        if (!is_array($lista) || !array_is_list($lista)) {
            $errores['miembros'] = 'Debe ser una lista de nombres.';
        } else {
            foreach ($lista as $miembro) {
                if (!is_string($miembro)) {
                    $errores['miembros'] = 'Cada miembro debe ser texto.';
                    break;
                }
                $miembro = trim($miembro);
                if ($miembro === '') {
                    continue;
                }
                if (mb_strlen($miembro) > self::MAX_MIEMBRO) {
                    $errores['miembros'] = 'Cada nombre tiene como máximo ' . self::MAX_MIEMBRO . ' caracteres.';
                    break;
                }
                $miembros[] = $miembro;
            }
            if (!isset($errores['miembros']) && count($miembros) > self::MAX_MIEMBROS) {
                $errores['miembros'] = 'Máximo ' . self::MAX_MIEMBROS . ' miembros.';
            }
        }

        if ($errores !== []) {
            throw new ErrorDeValidacion($errores);
        }
        return new self($id, $nombre, $miembros, $codigo);
    }

    public function conId(int $id): self
    {
        return new self($id, $this->nombre, $this->miembros, $this->codigo);
    }

    /** @return array<string, mixed> el código solo lo ve el admin */
    public function aArray(bool $conCodigo = false): array
    {
        $datos = ['id' => $this->id, 'nombre' => $this->nombre, 'miembros' => $this->miembros];
        if ($conCodigo) {
            $datos['codigo'] = $this->codigo;
        }
        return $datos;
    }
}
