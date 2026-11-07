<?php

declare(strict_types=1);

namespace CodeUrv\Infraestructura\Google;

use CodeUrv\Aplicacion\Puertos\CalendarioEventos;
use CodeUrv\Aplicacion\ServicioNoDisponible;
use CodeUrv\Infraestructura\Http\ClienteHttp;

/** Eventos desde la API de Google Calendar (la API key nunca sale del servidor). */
final class CalendarioGoogle implements CalendarioEventos
{
    public function __construct(
        private readonly ClienteHttp $http,
        private readonly string $apiKey,
        private readonly string $idCalendario,
    ) {
    }

    public function entre(\DateTimeImmutable $desde, \DateTimeImmutable $hasta): array
    {
        $url = 'https://www.googleapis.com/calendar/v3/calendars/' . rawurlencode($this->idCalendario) . '/events?'
            . http_build_query([
                'key' => $this->apiKey,
                'singleEvents' => 'true',
                'orderBy' => 'startTime',
                'timeMin' => $desde->format(\DATE_RFC3339),
                'timeMax' => $hasta->format(\DATE_RFC3339),
                'maxResults' => 250,
            ]);

        [$estado, $cuerpo] = $this->http->get($url);
        $datos = json_decode($cuerpo, true);

        if ($estado < 200 || $estado >= 300 || !is_array($datos)) {
            $detalle = is_array($datos) ? ($datos['error']['message'] ?? '') : '';
            throw new ServicioNoDisponible("Google Calendar respondió {$estado}. {$detalle}");
        }

        return array_values(array_filter(array_map(
            static fn ($item) => is_array($item) ? EventoGoogle::desdeApi($item) : null,
            $datos['items'] ?? [],
        )));
    }
}
