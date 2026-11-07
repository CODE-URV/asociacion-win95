<?php

declare(strict_types=1);

namespace CodeUrv\Infraestructura\Http;

use CodeUrv\Aplicacion\ServicioNoDisponible;

/** Peticiones HTTP salientes con cURL. Sigue redirecciones (Google redirige siempre). */
class ClienteHttp
{
    /** @return array{0: int, 1: string} [código de estado, cuerpo] */
    public function get(string $url): array
    {
        return $this->ejecutar($url, null);
    }

    /** @return array{0: int, 1: string} */
    public function postJson(string $url, string $json): array
    {
        return $this->ejecutar($url, $json);
    }

    /** @return array{0: int, 1: string} */
    private function ejecutar(string $url, ?string $json): array
    {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_MAXREDIRS => 5,
            CURLOPT_CONNECTTIMEOUT => 10,
            CURLOPT_TIMEOUT => 25,
        ]);
        if ($json !== null) {
            curl_setopt_array($ch, [
                CURLOPT_POST => true,
                CURLOPT_POSTFIELDS => $json,
                CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
            ]);
        }

        $cuerpo = curl_exec($ch);
        $estado = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
        // Sin curl_close(): no hace nada desde PHP 8.0 y está deprecated en PHP 8.5

        if ($cuerpo === false) {
            throw new ServicioNoDisponible('cURL: ' . curl_error($ch));
        }
        return [$estado, (string) $cuerpo];
    }
}
