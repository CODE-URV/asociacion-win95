<?php

declare(strict_types=1);

namespace CodeUrv\Aplicacion;

/** Un servicio externo (Google, Apps Script, base de datos...) no responde bien. */
final class ServicioNoDisponible extends \RuntimeException
{
}
