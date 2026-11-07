<?php

declare(strict_types=1);

namespace CodeUrv\Dominio;

/**
 * Datos y textos del certificado de asistencia (siempre en catalán, como la plantilla).
 */
final class Certificado
{
    private const MESES = [
        1 => 'gener', 'febrer', 'març', 'abril', 'maig', 'juny',
        'juliol', 'agost', 'setembre', 'octubre', 'novembre', 'desembre',
    ];

    public function __construct(
        public readonly string $nombre,
        public readonly string $titulo,
        public readonly TipoActividad $tipo,
        public readonly \DateTimeImmutable $fecha,
        public readonly string $ponente,
        public readonly string $presidente,
    ) {
    }

    public static function para(InscripcionActividad $inscripcion, Actividad $actividad, string $presidente): self
    {
        return new self(
            $inscripcion->nombreCompleto(),
            $actividad->titulo,
            $actividad->tipo,
            $actividad->inicio,
            $actividad->ponente,
            $presidente,
        );
    }

    /** "va assistir a la xerrada" / "al taller" / "a l’activitat" */
    public function frase(): string
    {
        return match ($this->tipo) {
            TipoActividad::Charla => 'va assistir a la xerrada',
            TipoActividad::Taller => 'va assistir al taller',
            TipoActividad::Otro => 'va assistir a l’activitat',
        };
    }

    /** "el 2 d’octubre de 2025" (con «d’» delante de vocal) */
    public function textoFecha(): string
    {
        $mes = self::MESES[(int) $this->fecha->format('n')];
        $de = in_array($mes[0], ['a', 'e', 'i', 'o', 'u'], true) ? 'd’' : 'de ';
        return 'el ' . $this->fecha->format('j') . " {$de}{$mes} de " . $this->fecha->format('Y');
    }

    /** Nombre de archivo sin acentos ni espacios: certificat-ana-perez.pdf */
    public function nombreArchivo(): string
    {
        $sinAcentos = strtr(mb_strtolower($this->nombre), [
            'à' => 'a', 'á' => 'a', 'è' => 'e', 'é' => 'e', 'í' => 'i', 'ï' => 'i', 'ò' => 'o', 'ó' => 'o',
            'ú' => 'u', 'ü' => 'u', 'ç' => 'c', 'ñ' => 'n', '·' => '',
        ]);
        $base = trim((string) preg_replace('/[^a-z0-9]+/', '-', $sinAcentos), '-');
        return 'certificat-' . ($base !== '' ? $base : 'assistent') . '.pdf';
    }

    public function asuntoCorreo(): string
    {
        return "Certificat d’assistència – {$this->titulo}";
    }

    public function textoCorreo(string $nombrePila): string
    {
        return "Hola {$nombrePila},\n\n"
            . "Gràcies per venir a «{$this->titulo}» {$this->textoFecha()}.\n"
            . "T’adjuntem el teu certificat d’assistència en PDF.\n\n"
            . "Fins aviat!\n"
            . "CODE URV\n"
            . "https://codeurv.com\n";
    }
}
