<?php

declare(strict_types=1);

namespace CodeUrv\Aplicacion\Puertos;

/** Valores internos de la aplicación guardados en la base de datos (p. ej. secretos generados). */
interface Ajustes
{
    /** Devuelve el valor; si no existe, lo crea con $generar() y lo guarda. */
    public function obtenerOCrear(string $clave, callable $generar): string;
}