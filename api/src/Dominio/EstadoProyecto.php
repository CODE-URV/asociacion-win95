<?php

declare(strict_types=1);

namespace CodeUrv\Dominio;

enum EstadoProyecto: string
{
    case Planificacion = 'Planificación';
    case EnProgreso = 'En Progreso';
    case Completado = 'Completado';
    case Pausado = 'Pausado';
    case Cancelado = 'Cancelado';
}
