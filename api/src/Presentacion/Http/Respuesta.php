<?php

declare(strict_types=1);

namespace CodeUrv\Presentacion\Http;

final class Respuesta
{
    /** @param array<string, string> $cabeceras */
    public function __construct(
        public readonly int $estado,
        public readonly ?array $datos = null,
        public readonly array $cabeceras = [],
        public readonly ?string $binario = null,
    ) {
    }

    /** Un archivo (p. ej. un PDF) para ver en el navegador. */
    public static function archivo(string $contenido, string $tipo, string $nombre): self
    {
        $nombre = str_replace(['"', "\r", "\n"], '', $nombre);
        return new self(200, null, [
            'Content-Type' => $tipo,
            'Content-Disposition' => "inline; filename=\"{$nombre}\"",
        ], $contenido);
    }

    /** @param array<string, mixed> $datos */
    public static function json(array $datos, int $estado = 200): self
    {
        return new self($estado, $datos);
    }

    public static function error(int $estado, string $mensaje, ?array $detalles = null): self
    {
        $datos = ['error' => $mensaje];
        if ($detalles !== null) {
            $datos['detalles'] = $detalles;
        }
        return new self($estado, $datos);
    }

    public static function sinContenido(): self
    {
        return new self(204);
    }

    public function conCabecera(string $nombre, string $valor): self
    {
        return new self($this->estado, $this->datos, [$nombre => $valor] + $this->cabeceras, $this->binario);
    }

    public function enviar(): void
    {
        http_response_code($this->estado);
        header('Content-Type: application/json; charset=utf-8');
        // Las respuestas de la API no se cachean (ni en el navegador ni en el CDN de Hostinger)
        header('Cache-Control: no-store');
        header('X-Content-Type-Options: nosniff');
        foreach ($this->cabeceras as $nombre => $valor) {
            header("{$nombre}: {$valor}");
        }
        if ($this->binario !== null) {
            echo $this->binario;
        } elseif ($this->datos !== null) {
            echo json_encode($this->datos, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        }
    }
}
