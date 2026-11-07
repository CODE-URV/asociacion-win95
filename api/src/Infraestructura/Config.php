<?php

declare(strict_types=1);

namespace CodeUrv\Infraestructura;

/**
 * Configuración (claves y conexión a la base de datos).
 * Se lee de config.php FUERA de public_html (/home/uXXXX/domains/codeurv.com/config.php)
 * o del archivo indicado en la variable de entorno CODEURV_CONFIG (desarrollo y tests).
 */
final class Config
{
    /** @param array<string, mixed> $valores */
    public function __construct(private readonly array $valores)
    {
    }

    public static function cargar(string $rutaPorDefecto): self
    {
        $ruta = getenv('CODEURV_CONFIG') ?: $rutaPorDefecto;
        $valores = is_file($ruta) ? require $ruta : [];
        return new self(is_array($valores) ? $valores : []);
    }

    public function texto(string $clave, string $porDefecto = ''): string
    {
        $valor = $this->valores[$clave] ?? getenv($clave);
        return is_string($valor) && $valor !== '' ? $valor : $porDefecto;
    }

    public function obligatorio(string $clave): string
    {
        $valor = $this->texto($clave);
        if ($valor === '') {
            throw new \RuntimeException("Falta la configuración {$clave} en config.php");
        }
        return $valor;
    }
}
