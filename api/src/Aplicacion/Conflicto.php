<?php

declare(strict_types=1);

namespace CodeUrv\Aplicacion;

/** La operación no se puede hacer en el estado actual (inscripción cerrada, ya inscrito...). */
final class Conflicto extends \RuntimeException
{
}