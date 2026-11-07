<?php

declare(strict_types=1);

namespace CodeUrv\Aplicacion;

/** No se permite (p. ej. un QR caducado o fuera del horario de la actividad). */
final class AccesoDenegado extends \RuntimeException
{
}