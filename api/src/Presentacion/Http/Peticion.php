<?php

declare(strict_types=1);

namespace CodeUrv\Presentacion\Http;

/** Petición HTTP entrante, independiente de las superglobales para poder probarla. */
final class Peticion
{
    private const MAX_CUERPO = 64 * 1024;

    /**
     * @param array<string, string> $consulta
     * @param array<string, string> $cabeceras  nombres en minúsculas
     */
    public function __construct(
        public readonly string $metodo,
        public readonly string $ruta,
        public readonly array $consulta = [],
        public readonly array $cabeceras = [],
        public readonly string $cuerpo = '',
        public readonly string $ip = '',
    ) {
    }

    /** @param string $base prefijo de la API en la URL (normalmente /api) */
    public static function desdeGlobales(string $base): self
    {
        $ruta = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
        if ($base !== '' && str_starts_with($ruta, $base)) {
            $ruta = substr($ruta, strlen($base));
        }

        $cabeceras = [];
        foreach ($_SERVER as $clave => $valor) {
            if (str_starts_with($clave, 'HTTP_')) {
                $cabeceras[strtolower(str_replace('_', '-', substr($clave, 5)))] = (string) $valor;
            }
        }
        if (isset($_SERVER['CONTENT_TYPE'])) {
            $cabeceras['content-type'] = (string) $_SERVER['CONTENT_TYPE'];
        }

        $consulta = array_filter($_GET, 'is_string');

        return new self(
            strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET'),
            '/' . trim($ruta, '/'),
            $consulta,
            $cabeceras,
            (string) file_get_contents('php://input', false, null, 0, self::MAX_CUERPO + 1),
            (string) ($_SERVER['REMOTE_ADDR'] ?? ''),
        );
    }

    public function cabecera(string $nombre): ?string
    {
        return $this->cabeceras[strtolower($nombre)] ?? null;
    }

    public function consulta(string $clave): string
    {
        return $this->consulta[$clave] ?? '';
    }

    /** @return array<string, mixed> */
    public function json(): array
    {
        if (strlen($this->cuerpo) > self::MAX_CUERPO) {
            throw new PeticionInvalida('El cuerpo de la petición es demasiado grande.');
        }
        // Exigir JSON obliga a los navegadores a hacer "preflight" en peticiones de otros dominios
        if (!str_starts_with(strtolower($this->cabecera('content-type') ?? ''), 'application/json')) {
            throw new PeticionInvalida('Content-Type debe ser application/json.');
        }
        $datos = json_decode($this->cuerpo, true);
        if (!is_array($datos)) {
            throw new PeticionInvalida('El cuerpo no es JSON válido.');
        }
        return $datos;
    }

    public function modificaDatos(): bool
    {
        return !in_array($this->metodo, ['GET', 'HEAD', 'OPTIONS'], true);
    }
}
