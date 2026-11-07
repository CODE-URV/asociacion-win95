<?php

declare(strict_types=1);

namespace CodeUrv\Aplicacion\Puertos;

use CodeUrv\Dominio\Usuario;

interface RepositorioUsuarios
{
    public function buscarPorNombre(string $nombre): ?Usuario;
}
