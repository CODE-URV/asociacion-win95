<?php

declare(strict_types=1);

namespace CodeUrv\Dominio\Olimpiadas;

enum TipoPrueba: string
{
    /** Los equipos entregan una imagen hecha con IA y el jurado la puntúa con tres criterios. */
    case Imagen = 'imagen';
    /** Ir de un artículo de Wikipedia a otro solo con enlaces, lo más rápido posible. */
    case WikiRace = 'wikirace';
}
