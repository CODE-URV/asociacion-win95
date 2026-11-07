<?php

declare(strict_types=1);

namespace CodeUrv\Dominio;

/**
 * Códigos para registrar la asistencia con el QR proyectado en la sala.
 *
 * - El QR muestra un código que cambia cada 30 s (HMAC del id de la actividad y el periodo).
 *   Una foto pasada por WhatsApp deja de servir en ~1 minuto.
 * - Al escanear, el código se cambia por un "pase" válido 15 min, para que la persona
 *   tenga tiempo de rellenar el formulario aunque el QR ya haya cambiado.
 */
final class CodigoAsistencia
{
    public const PERIODO_SEGUNDOS = 30;
    public const PERIODOS_TOLERADOS = 2; // el actual y los 2 anteriores (~60-90 s)
    public const VALIDEZ_PASE_SEGUNDOS = 900;

    public static function generar(string $secreto, int $actividadId, int $ahora): string
    {
        return self::firmar($secreto, "qr:{$actividadId}:" . intdiv($ahora, self::PERIODO_SEGUNDOS), 10);
    }

    /** Momento en que el código actual deja de mostrarse. */
    public static function cambiaEn(int $ahora): int
    {
        return (intdiv($ahora, self::PERIODO_SEGUNDOS) + 1) * self::PERIODO_SEGUNDOS;
    }

    public static function esValido(string $secreto, int $actividadId, string $codigo, int $ahora): bool
    {
        $codigo = strtoupper(trim($codigo));
        for ($i = 0; $i <= self::PERIODOS_TOLERADOS; $i++) {
            $esperado = self::generar($secreto, $actividadId, $ahora - $i * self::PERIODO_SEGUNDOS);
            if (hash_equals($esperado, $codigo)) {
                return true;
            }
        }
        return false;
    }

    public static function crearPase(string $secreto, int $actividadId, int $ahora): string
    {
        $caduca = $ahora + self::VALIDEZ_PASE_SEGUNDOS;
        return "{$actividadId}.{$caduca}." . self::firmar($secreto, "pase:{$actividadId}:{$caduca}", 32);
    }

    public static function paseValido(string $secreto, int $actividadId, string $pase, int $ahora): bool
    {
        $partes = explode('.', $pase);
        if (count($partes) !== 3 || (int) $partes[0] !== $actividadId || !ctype_digit($partes[1])) {
            return false;
        }
        $caduca = (int) $partes[1];
        if ($caduca < $ahora) {
            return false;
        }
        return hash_equals(self::firmar($secreto, "pase:{$actividadId}:{$caduca}", 32), $partes[2]);
    }

    private static function firmar(string $secreto, string $mensaje, int $longitud): string
    {
        return strtoupper(substr(hash_hmac('sha256', $mensaje, $secreto), 0, $longitud));
    }
}
