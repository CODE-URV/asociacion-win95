<?php

declare(strict_types=1);

namespace CodeUrv\Presentacion\Http;

/** Router mínimo: rutas como '/proyectos/{id}' con parámetros numéricos. */
final class Router
{
    /** @var list<array{metodo: string, patron: string, accion: callable}> */
    private array $rutas = [];

    public function agregar(string $metodo, string $ruta, callable $accion): self
    {
        $patron = '#^' . preg_replace('#\{(\w+)\}#', '(?P<$1>\d+)', $ruta) . '$#';
        $this->rutas[] = ['metodo' => $metodo, 'patron' => $patron, 'accion' => $accion];
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
            $parametros = array_map('intval', array_filter($coincidencias, 'is_string', ARRAY_FILTER_USE_KEY));
            return ($ruta['accion'])($peticion, $parametros);
        }

        if ($metodosPermitidos !== []) {
            return Respuesta::error(405, 'Método no permitido.')
                ->conCabecera('Allow', implode(', ', array_unique($metodosPermitidos)));
        }
        return Respuesta::error(404, 'No existe esta ruta de la API.');
    }
}
