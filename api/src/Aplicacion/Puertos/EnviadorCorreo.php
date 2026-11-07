<?php

declare(strict_types=1);

namespace CodeUrv\Aplicacion\Puertos;

interface EnviadorCorreo
{
    /**
     * Envía un correo de texto con un adjunto opcional.
     * Lanza ServicioNoDisponible si no se puede enviar (configuración, red, credenciales...).
     *
     * @param array{nombre: string, tipo: string, contenido: string}|null $adjunto
     */
    public function enviar(string $para, string $asunto, string $texto, ?array $adjunto = null): void;
}