<?php

declare(strict_types=1);

namespace CodeUrv\Infraestructura\Http;

use CodeUrv\Aplicacion\ServicioNoDisponible;

/** Peticiones HTTP salientes con cURL. Sigue redirecciones (Google redirige siempre). */
class ClienteHttp
{
    /** @return array{0: int, 1: string} [código de estado, cuerpo] */
    public function get(string $url, array $cabeceras = []): array
    {
        return $this->peticion('GET', $url, $cabeceras);
    }

    /** @return array{0: int, 1: string} */
    public function postJson(string $url, string $json): array
    {
        return $this->peticion('POST', $url, ['Content-Type: application/json'], $json);
    }

    /**
     * @param list<string> $cabeceras
     * @return array{0: int, 1: string}
     */
    public function peticion(string $metodo, string $url, array $cabeceras = [], ?string $cuerpo = null): array
    {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_MAXREDIRS => 5,
            CURLOPT_CONNECTTIMEOUT => 10,
            CURLOPT_TIMEOUT => 25,
            CURLOPT_HTTPHEADER => $cabeceras,
        ]);
        if ($metodo === 'POST') {
            // CURLOPT_POST (y no CUSTOMREQUEST) para que, si Apps Script redirige con 302,
            // la siguiente petición sea GET como hace el navegador
            curl_setopt($ch, CURLOPT_POST, true);
        } elseif ($metodo !== 'GET') {
            curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $metodo);
        }
        if ($cuerpo !== null) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, $cuerpo);
        }

        $respuesta = curl_exec($ch);
        $estado = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
        // Sin curl_close(): no hace nada desde PHP 8.0 y está deprecated en PHP 8.5

        if ($respuesta === false) {
            throw new ServicioNoDisponible('cURL: ' . curl_error($ch));
        }
        return [$estado, (string) $respuesta];
    }
}
