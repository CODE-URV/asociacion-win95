<?php

declare(strict_types=1);

namespace CodeUrv\Infraestructura\Google;

use CodeUrv\Aplicacion\Puertos\CalendarioEditable;
use CodeUrv\Aplicacion\ServicioNoDisponible;
use CodeUrv\Dominio\Evento;
use CodeUrv\Infraestructura\Http\ClienteHttp;

/** Lee y escribe en el Google Calendar de la asociación con la cuenta de servicio. */
final class CalendarioGoogleEditable implements CalendarioEditable
{
    private const API = 'https://www.googleapis.com/calendar/v3/calendars/';

    public function __construct(
        private readonly ClienteHttp $http,
        private readonly TokenCuentaServicio $token,
        private readonly string $idCalendario,
    ) {
    }

    public function entre(\DateTimeImmutable $desde, \DateTimeImmutable $hasta): array
    {
        $datos = $this->llamar('GET', '/events?' . http_build_query([
            'singleEvents' => 'true',
            'orderBy' => 'startTime',
            'timeMin' => $desde->format(\DATE_RFC3339),
            'timeMax' => $hasta->format(\DATE_RFC3339),
            'maxResults' => 250,
        ]));
        return array_values(array_filter(array_map(EventoGoogle::desdeApi(...), $datos['items'] ?? [])));
    }

    public function crear(Evento $evento): Evento
    {
        $creado = $this->llamar('POST', '/events', EventoGoogle::aApi($evento));
        return $evento->conId((string) ($creado['id'] ?? ''));
    }

    public function actualizar(Evento $evento): Evento
    {
        $this->llamar('PUT', '/events/' . rawurlencode($evento->id), EventoGoogle::aApi($evento));
        return $evento;
    }

    public function eliminar(string $id): void
    {
        $this->llamar('DELETE', '/events/' . rawurlencode($id), null, [404, 410]);
    }

    /**
     * @param array<string, mixed>|null $cuerpo
     * @param list<int> $estadosIgnorados  p. ej. 404/410 al borrar algo que ya no existe
     * @return array<string, mixed>
     */
    private function llamar(string $metodo, string $ruta, ?array $cuerpo = null, array $estadosIgnorados = []): array
    {
        if ($this->idCalendario === '') {
            throw new ServicioNoDisponible('Falta GOOGLE_CALENDAR_ID en config.php.');
        }
        $cabeceras = ['Authorization: Bearer ' . $this->token->obtener()];
        if ($cuerpo !== null) {
            $cabeceras[] = 'Content-Type: application/json';
        }

        [$estado, $respuesta] = $this->http->peticion(
            $metodo,
            self::API . rawurlencode($this->idCalendario) . $ruta,
            $cabeceras,
            $cuerpo === null ? null : json_encode($cuerpo, JSON_UNESCAPED_UNICODE),
        );

        if (in_array($estado, $estadosIgnorados, true)) {
            return [];
        }
        $datos = json_decode($respuesta, true);
        if ($estado < 200 || $estado >= 300) {
            $detalle = is_array($datos) ? ($datos['error']['message'] ?? '') : '';
            $pista = $estado === 403 || $estado === 404
                ? ' ¿Has compartido el calendario con la cuenta de servicio con permiso para hacer cambios?'
                : '';
            throw new ServicioNoDisponible("Google Calendar respondió {$estado}. {$detalle}{$pista}");
        }
        return is_array($datos) ? $datos : [];
    }
}
