<?php

declare(strict_types=1);

namespace CodeUrv\Aplicacion\CasosDeUso;

use CodeUrv\Aplicacion\Puertos\CalendarioEventos;
use CodeUrv\Dominio\ErrorDeValidacion;
use CodeUrv\Dominio\Evento;

final class ConsultarEventos
{
    private const MAX_DIAS = 400;

    public function __construct(private readonly CalendarioEventos $calendario)
    {
    }

    /** @return list<Evento> */
    public function entre(string $desde, string $hasta): array
    {
        $inicio = self::fecha($desde, 'desde');
        $fin = self::fecha($hasta, 'hasta');

        if ($fin < $inicio) {
            throw new ErrorDeValidacion(['hasta' => 'La fecha final es anterior a la inicial.']);
        }
        if ($inicio->diff($fin)->days > self::MAX_DIAS) {
            throw new ErrorDeValidacion(['hasta' => 'El rango de fechas es demasiado grande.']);
        }

        return $this->calendario->entre($inicio, $fin);
    }

    private static function fecha(string $valor, string $campo): \DateTimeImmutable
    {
        try {
            return new \DateTimeImmutable($valor);
        } catch (\Exception) {
            throw new ErrorDeValidacion([$campo => 'Fecha no válida.']);
        }
    }
}
