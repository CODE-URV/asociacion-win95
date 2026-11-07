<?php

declare(strict_types=1);

namespace CodeUrv\Dominio;

/** Datos que no cumplen las reglas del dominio. Lleva los errores por campo. */
final class ErrorDeValidacion extends \DomainException
{
    /** @param array<string, string> $errores */
    public function __construct(public readonly array $errores, string $mensaje = 'Hay datos que no son válidos.')
    {
        parent::__construct($mensaje);
    }
}
