<?php

declare(strict_types=1);

namespace CodeUrv\Presentacion\Http;

/** Petición mal formada (cuerpo que no es JSON, demasiado grande...). */
final class PeticionInvalida extends \RuntimeException
{
}
