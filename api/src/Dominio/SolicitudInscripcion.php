<?php

declare(strict_types=1);

namespace CodeUrv\Dominio;

/**
 * Solicitud para hacerse socio. Los valores de "socioAnterior" están en catalán
 * porque se guardan tal cual en la hoja de inscripciones.
 */
final class SolicitudInscripcion
{
    public const SOCIO_NUEVO = 'NO vaig ser soci i VULL la samarreta (8€)';
    public const SOCIO_ANTERIOR = 'Vaig ser soci i ja tinc la samarreta (5€)';
    public const TALLAS = ['S', 'M', 'L', 'XL'];
    private const LONGITUD_MAXIMA = 200;

    private function __construct(
        public readonly string $socioAnterior,
        public readonly string $grado,
        public readonly string $curso,
        public readonly string $talla,
        public readonly string $nombre,
        public readonly string $correo,
        public readonly string $telefono,
    ) {
    }

    /** @param array<string, mixed> $datos */
    public static function desdeDatos(array $datos): self
    {
        $errores = [];
        $campo = static function (string $nombre, string $mensajeVacio) use ($datos, &$errores): string {
            $valor = $datos[$nombre] ?? '';
            $valor = is_string($valor) ? trim($valor) : '';
            if ($valor === '') {
                $errores[$nombre] = $mensajeVacio;
            } elseif (mb_strlen($valor) > self::LONGITUD_MAXIMA) {
                $errores[$nombre] = 'Máximo ' . self::LONGITUD_MAXIMA . ' caracteres.';
            }
            return $valor;
        };

        $nombre = $campo('nombre', 'El nombre y apellidos es obligatorio.');
        $grado = $campo('grado', 'Indica el grado que estudias.');
        $curso = $campo('curso', 'Indica tu curso actual.');
        $correo = $campo('correo', 'El correo electrónico es obligatorio.');
        $telefono = $campo('telefono', 'El número de teléfono es obligatorio.');

        $socioAnterior = $datos['socioAnterior'] ?? '';
        if (!in_array($socioAnterior, [self::SOCIO_NUEVO, self::SOCIO_ANTERIOR], true)) {
            $errores['socioAnterior'] = 'Indica si fuiste socio el año pasado.';
        }

        if ($correo !== '' && !isset($errores['correo']) && filter_var($correo, FILTER_VALIDATE_EMAIL) === false) {
            $errores['correo'] = 'El correo electrónico no es válido.';
        }

        $talla = is_string($datos['talla'] ?? null) ? trim($datos['talla']) : '';
        if ($socioAnterior === self::SOCIO_ANTERIOR) {
            $talla = ''; // ya tiene camiseta
        } elseif (!in_array($talla, self::TALLAS, true)) {
            $errores['talla'] = 'Selecciona una talla de camiseta.';
        }

        if ($errores !== []) {
            throw new ErrorDeValidacion($errores);
        }

        return new self($socioAnterior, $grado, $curso, $talla, $nombre, $correo, $telefono);
    }

    /** Formato que espera la hoja de inscripciones. @return array<string, string> */
    public function aArray(): array
    {
        return [
            'socioAnterior' => $this->socioAnterior,
            'grado' => $this->grado,
            'curso' => $this->curso,
            'talla' => $this->talla,
            'nombre' => $this->nombre,
            'correo' => $this->correo,
            'telefono' => $this->telefono,
        ];
    }
}
