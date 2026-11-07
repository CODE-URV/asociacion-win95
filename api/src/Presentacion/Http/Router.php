<?php

declare(strict_types=1);

namespace CodeUrv\Presentacion\Http;

/**
 * Router mínimo. Parámetros en la ruta:
 *   {id}          número  → int
 *   {id:texto}    letras, números, _ y -  → string (p. ej. ids de Google Calendar)
 */
final class Router
{
    /** @var list<array{metodo: string, patron: string, textos: list<string>, accion: callable}> */
    private array $rutas = [];

    public function agregar(string $metodo, string $ruta, callable $accion): self
    {
        $textos = [];
        $patron = preg_replace_callback('#\{(\w+)(:texto)?\}#', static function (array $m) use (&$textos) {
            if (($m[2] ?? '') !== '') {
                $textos[] = $m[1];
                return "(?P<{$m[1]}>[A-Za-z0-9_-]+)";
            }
            return "(?P<{$m[1]}>\\d+)";
        }, $ruta);

        $this->rutas[] = ['metodo' => $metodo, 'patron' => '#^' . $patron . '$#', 'textos' => $textos, 'accion' => $accion];
        return $this;
    }

    public function despachar(Peticion $peticion): Respuesta
    {
        $metodosPermitidos = [];
        foreach ($this->rutas as $ruta) {
            if (!preg_match($ruta['patron'], $peticion->ruta, $coincidencias)) {
                continue;
            }
            if ($ruta['metodo'] !== $peticion->metodo) {
                $metodosPermitidos[] = $ruta['metodo'];
                continue;
            }
            $parametros = [];
            foreach (array_filter($coincidencias, 'is_string', ARRAY_FILTER_USE_KEY) as $nombre => $valor) {
                $parametros[$nombre] = in_array($nombre, $ruta['textos'], true) ? $valor : (int) $valor;
            }
            return ($ruta['accion'])($peticion, $parametros);
        }

        if ($metodosPermitidos !== []) {
            return Respuesta::error(405, 'Método no permitido.')
                ->conCabecera('Allow', implode(', ', array_unique($metodosPermitidos)));
        }
        return Respuesta::error(404, 'No existe esta ruta de la API.');
    }
}
