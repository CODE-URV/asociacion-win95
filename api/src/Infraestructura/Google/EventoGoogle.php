<?php

declare(strict_types=1);

namespace CodeUrv\Infraestructura\Google;

use CodeUrv\Dominio\Evento;

/** Traduce entre el formato de la API de Google Calendar y el Evento del dominio. */
final class EventoGoogle
{
    public const ZONA = 'Europe/Madrid';

    /** @param array<string, mixed> $item */
    public static function desdeApi(array $item): ?Evento
    {
        $zona = new \DateTimeZone(self::ZONA);
        $todoElDia = isset($item['start']['date']);

        if ($todoElDia) {
            $inicio = (string) $item['start']['date'];
            // En Google el fin de un evento de día completo es el día SIGUIENTE (exclusivo)
            $finExclusivo = (string) ($item['end']['date'] ?? $inicio);
            $fin = (new \DateTimeImmutable($finExclusivo))->modify('-1 day')->format('Y-m-d');
            if ($fin < $inicio) {
                $fin = $inicio;
            }
        } elseif (isset($item['start']['dateTime'])) {
            $local = static fn (string $v) => (new \DateTimeImmutable($v))->setTimezone($zona)->format('Y-m-d\TH:i');
            $inicio = $local((string) $item['start']['dateTime']);
            $fin = $local((string) ($item['end']['dateTime'] ?? $item['start']['dateTime']));
        } else {
            return null;
        }

        return new Evento(
            (string) ($item['id'] ?? ''),
            (string) ($item['summary'] ?? '(Sin título)'),
            (string) ($item['description'] ?? ''),
            (string) ($item['location'] ?? ''),
            $inicio,
            $todoElDia,
            $fin,
        );
    }

    /** @return array<string, mixed> cuerpo para crear/actualizar en la API */
    public static function aApi(Evento $evento): array
    {
        if ($evento->todoElDia) {
            $finExclusivo = (new \DateTimeImmutable($evento->fin))->modify('+1 day')->format('Y-m-d');
            $inicio = ['date' => $evento->inicio];
            $fin = ['date' => $finExclusivo];
        } else {
            $inicio = ['dateTime' => $evento->inicio . ':00', 'timeZone' => self::ZONA];
            $fin = ['dateTime' => $evento->fin . ':00', 'timeZone' => self::ZONA];
        }
        return [
            'summary' => $evento->titulo,
            'description' => $evento->descripcion,
            'location' => $evento->lugar,
            'start' => $inicio,
            'end' => $fin,
        ];
    }
}
