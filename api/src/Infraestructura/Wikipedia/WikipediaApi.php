<?php

declare(strict_types=1);

namespace CodeUrv\Infraestructura\Wikipedia;

use CodeUrv\Aplicacion\Puertos\Wikipedia;
use CodeUrv\Aplicacion\ServicioNoDisponible;
use CodeUrv\Infraestructura\Http\ClienteHttp;

/** API de MediaWiki de es.wikipedia.org (sin clave). */
final class WikipediaApi implements Wikipedia
{
    // Wikimedia pide identificar a los clientes automáticos con un User-Agent propio
    private const AGENTE = 'User-Agent: CodeURV-Olimpiadas/1.0 (https://codeurv.com)';

    public function __construct(
        private readonly ClienteHttp $http,
        private readonly string $url = 'https://es.wikipedia.org/w/api.php',
    ) {
    }

    public function articulo(string $titulo): ?string
    {
        if (!self::tituloValido($titulo)) {
            return null;
        }
        $consulta = $this->consultar(['titles' => $titulo]);
        $real = self::resolver($consulta, $titulo);
        $pagina = self::pagina($consulta, $real);
        return $pagina === null ? null : $real;
    }

    public function seguirEnlace(string $desde, string $enlace): ?string
    {
        if (!self::tituloValido($desde) || !self::tituloValido($enlace)) {
            return null;
        }
        // Los enlaces de $desde que apuntan a $enlace (tal como está escrito, aunque sea una redirección)
        $consulta = $this->consultar([
            'titles' => $desde . '|' . $enlace,
            'prop' => 'links',
            'plnamespace' => '0',
            'pllimit' => 'max',
            'pltitles' => $enlace,
        ]);

        $paginaDesde = self::pagina($consulta, self::resolver($consulta, $desde));
        $enlaceNormalizado = self::normalizado($consulta, $enlace);
        $enlaza = false;
        foreach ($paginaDesde['links'] ?? [] as $link) {
            if (($link['title'] ?? null) === $enlaceNormalizado) {
                $enlaza = true;
                break;
            }
        }
        if (!$enlaza) {
            return null;
        }

        $real = self::resolver($consulta, $enlace);
        return self::pagina($consulta, $real) === null ? null : $real;
    }

    /**
     * @param array<string, string> $parametros
     * @return array<string, mixed> el objeto "query" de la respuesta
     */
    private function consultar(array $parametros): array
    {
        $url = $this->url . '?' . http_build_query([
            'action' => 'query',
            'format' => 'json',
            'formatversion' => '2',
            'redirects' => '1',
        ] + $parametros);
        [$estado, $cuerpo] = $this->http->get($url, [self::AGENTE]);
        $datos = json_decode($cuerpo, true);
        if ($estado !== 200 || !is_array($datos) || !is_array($datos['query'] ?? null)) {
            throw new ServicioNoDisponible("Wikipedia ha respondido {$estado}.");
        }
        return $datos['query'];
    }

    /** @param array<string, mixed> $consulta */
    private static function normalizado(array $consulta, string $titulo): string
    {
        foreach ($consulta['normalized'] ?? [] as $n) {
            if (($n['from'] ?? null) === $titulo) {
                return (string) $n['to'];
            }
        }
        return $titulo;
    }

    /** Título final: normalizado y siguiendo la redirección si la hay. */
    private static function resolver(array $consulta, string $titulo): string
    {
        $titulo = self::normalizado($consulta, $titulo);
        foreach ($consulta['redirects'] ?? [] as $r) {
            if (($r['from'] ?? null) === $titulo) {
                return (string) $r['to'];
            }
        }
        return $titulo;
    }

    /** @return array<string, mixed>|null la página si existe y es un artículo */
    private static function pagina(array $consulta, string $titulo): ?array
    {
        foreach ($consulta['pages'] ?? [] as $pagina) {
            if (($pagina['title'] ?? null) === $titulo) {
                $existe = !isset($pagina['missing']) && !isset($pagina['invalid']) && ($pagina['ns'] ?? -1) === 0;
                return $existe ? $pagina : null;
            }
        }
        return null;
    }

    private static function tituloValido(string $titulo): bool
    {
        return $titulo !== '' && strlen($titulo) <= 512 && !preg_match('/[|#<>\[\]{}\x00-\x1f]/', $titulo);
    }
}
