<?php

declare(strict_types=1);

namespace CodeUrv\Dominio;

/**
 * Proyecto de la asociación. Solo se puede construir con datos válidos:
 * cualquier regla que no se cumpla lanza ErrorDeValidacion con los errores por campo.
 */
final class Proyecto
{
    public const LIMITES = [
        'nombre' => 120,
        'descripcion' => 2000,
        'responsable' => 120,
        'email' => 190,
        'repositorio' => 255,
    ];

    private const MAX_ELEMENTOS_LISTA = 20;
    private const MAX_LONGITUD_ELEMENTO = 60;

    /**
     * @param list<string> $tecnologias
     * @param list<string> $colaboradores
     */
    private function __construct(
        public readonly ?int $id,
        public readonly string $nombre,
        public readonly string $descripcion,
        public readonly string $responsable,
        public readonly string $email,
        public readonly EstadoProyecto $estado,
        public readonly int $progreso,
        public readonly array $tecnologias,
        public readonly string $repositorio,
        public readonly array $colaboradores,
    ) {
    }

    /** @param array<string, mixed> $datos */
    public static function desdeDatos(array $datos, ?int $id = null): self
    {
        $errores = [];

        $texto = static function (string $campo) use ($datos, &$errores): string {
            $valor = $datos[$campo] ?? '';
            if (!is_string($valor)) {
                $errores[$campo] = 'Debe ser texto.';
                return '';
            }
            $valor = trim($valor);
            $maximo = self::LIMITES[$campo] ?? null;
            if ($maximo !== null && mb_strlen($valor) > $maximo) {
                $errores[$campo] = "Máximo {$maximo} caracteres.";
            }
            return $valor;
        };

        $lista = static function (string $campo) use ($datos, &$errores): array {
            $valor = $datos[$campo] ?? [];
            if (!is_array($valor)) {
                $errores[$campo] = 'Debe ser una lista.';
                return [];
            }
            $elementos = [];
            foreach ($valor as $elemento) {
                if (!is_string($elemento)) {
                    $errores[$campo] = 'Cada elemento debe ser texto.';
                    return [];
                }
                $elemento = trim($elemento);
                if ($elemento !== '' && !in_array($elemento, $elementos, true)) {
                    $elementos[] = $elemento;
                }
            }
            if (count($elementos) > self::MAX_ELEMENTOS_LISTA) {
                $errores[$campo] = 'Máximo ' . self::MAX_ELEMENTOS_LISTA . ' elementos.';
            }
            foreach ($elementos as $elemento) {
                if (mb_strlen($elemento) > self::MAX_LONGITUD_ELEMENTO) {
                    $errores[$campo] = 'Cada elemento puede tener como máximo ' . self::MAX_LONGITUD_ELEMENTO . ' caracteres.';
                }
            }
            return $elementos;
        };

        $nombre = $texto('nombre');
        $descripcion = $texto('descripcion');
        $responsable = $texto('responsable');
        $email = $texto('email');
        $repositorio = $texto('repositorio');
        $tecnologias = $lista('tecnologias');
        $colaboradores = $lista('colaboradores');

        if ($nombre === '' && !isset($errores['nombre'])) {
            $errores['nombre'] = 'El nombre es obligatorio.';
        }
        if ($email !== '' && filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
            $errores['email'] = 'El email no es válido.';
        }
        if ($repositorio !== '' && !preg_match('#^https?://\S+$#i', $repositorio)) {
            $errores['repositorio'] = 'El repositorio debe ser una URL que empiece por http:// o https://';
        }

        $estado = is_string($datos['estado'] ?? null) ? EstadoProyecto::tryFrom($datos['estado']) : null;
        if ($estado === null) {
            $errores['estado'] = 'Estado no válido.';
        }

        $progreso = $datos['progreso'] ?? 0;
        if (!is_int($progreso) || $progreso < 0 || $progreso > 100) {
            $errores['progreso'] = 'El progreso es un número entero entre 0 y 100.';
            $progreso = 0;
        }

        if ($errores !== []) {
            throw new ErrorDeValidacion($errores);
        }

        return new self(
            $id,
            $nombre,
            $descripcion,
            $responsable,
            $email,
            $estado,
            $progreso,
            $tecnologias,
            $repositorio,
            $colaboradores,
        );
    }

    public function conId(int $id): self
    {
        return new self(
            $id,
            $this->nombre,
            $this->descripcion,
            $this->responsable,
            $this->email,
            $this->estado,
            $this->progreso,
            $this->tecnologias,
            $this->repositorio,
            $this->colaboradores,
        );
    }

    /** @return array<string, mixed> */
    public function aArray(): array
    {
        return [
            'id' => $this->id,
            'nombre' => $this->nombre,
            'descripcion' => $this->descripcion,
            'responsable' => $this->responsable,
            'email' => $this->email,
            'estado' => $this->estado->value,
            'progreso' => $this->progreso,
            'tecnologias' => $this->tecnologias,
            'repositorio' => $this->repositorio,
            'colaboradores' => $this->colaboradores,
        ];
    }
}
