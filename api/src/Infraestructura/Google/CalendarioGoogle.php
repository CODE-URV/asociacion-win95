<?php

declare(strict_types=1);

namespace CodeUrv\Infraestructura\Google;

use CodeUrv\Aplicacion\Puertos\CalendarioEventos;
use CodeUrv\Aplicacion\ServicioNoDisponible;
use CodeUrv\Dominio\Evento;
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

        $eventos = [];
        foreach ($datos['items'] ?? [] as $item) {
            $inicio = $item['start']['dateTime'] ?? $item['start']['date'] ?? null;
            if (!is_string($inicio)) {
                continue;
            }
            $eventos[] = new Evento(
                (string) ($item['id'] ?? ''),
                (string) ($item['summary'] ?? '(Sin título)'),
                (string) ($item['description'] ?? ''),
                (string) ($item['location'] ?? ''),
                $inicio,
                !isset($item['start']['dateTime']),
            );
        }
        return $eventos;
    }
}
