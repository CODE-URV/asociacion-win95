<?php

declare(strict_types=1);

namespace CodeUrv\Infraestructura\Correo;

/** Construye un correo MIME (texto UTF-8 + adjunto) listo para enviar por SMTP. */
final class MensajeMime
{
    /**
     * @param array{nombre: string, tipo: string, contenido: string}|null $adjunto
     */
    public static function construir(
        string $remitente,
        string $nombreRemitente,
        string $para,
        string $asunto,
        string $texto,
        ?array $adjunto,
        ?string $frontera = null,
        ?\DateTimeImmutable $fecha = null,
    ): string {
        $frontera ??= 'codeurv-' . bin2hex(random_bytes(12));
        $fecha ??= new \DateTimeImmutable();
        $dominio = substr((string) strrchr($remitente, '@'), 1) ?: 'codeurv.com';

        $cabeceras = [
            'From: ' . self::codificar($nombreRemitente) . " <{$remitente}>",
            "To: <{$para}>",
            'Subject: ' . self::codificar($asunto),
            'Date: ' . $fecha->format(\DATE_RFC2822),
            'Message-ID: <' . bin2hex(random_bytes(16)) . "@{$dominio}>",
            'MIME-Version: 1.0',
        ];

        $cuerpoTexto = chunk_split(base64_encode($texto), 76, "\r\n");

        if ($adjunto === null) {
            $cabeceras[] = 'Content-Type: text/plain; charset=UTF-8';
            $cabeceras[] = 'Content-Transfer-Encoding: base64';
            return implode("\r\n", $cabeceras) . "\r\n\r\n" . $cuerpoTexto;
        }

        $cabeceras[] = "Content-Type: multipart/mixed; boundary=\"{$frontera}\"";
        $nombreArchivo = str_replace('"', '', $adjunto['nombre']);

        return implode("\r\n", $cabeceras) . "\r\n\r\n"
            . "--{$frontera}\r\n"
            . "Content-Type: text/plain; charset=UTF-8\r\n"
            . "Content-Transfer-Encoding: base64\r\n\r\n"
            . $cuerpoTexto
            . "--{$frontera}\r\n"
            . "Content-Type: {$adjunto['tipo']}; name=\"{$nombreArchivo}\"\r\n"
            . "Content-Transfer-Encoding: base64\r\n"
            . "Content-Disposition: attachment; filename=\"{$nombreArchivo}\"\r\n\r\n"
            . chunk_split(base64_encode($adjunto['contenido']), 76, "\r\n")
            . "--{$frontera}--\r\n";
    }

    /** Cabecera con acentos: =?UTF-8?B?...?= */
    private static function codificar(string $texto): string
    {
        return preg_match('/[^\x20-\x7E]/', $texto) ? '=?UTF-8?B?' . base64_encode($texto) . '?=' : $texto;
    }
}
