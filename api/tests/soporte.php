<?php

declare(strict_types=1);

// Aserciones y dobles de prueba (implementaciones en memoria de los puertos).

namespace CodeUrv\Tests;

use CodeUrv\Aplicacion\Puertos\RegistroIntentos;
use CodeUrv\Aplicacion\Puertos\RepositorioUsuarios;
use CodeUrv\Aplicacion\Puertos\Sesion;
use CodeUrv\Dominio\Usuario;

final class FalloDeAsercion extends \RuntimeException
{
}

function afirmar(bool $condicion, string $mensaje = 'La condición no se cumple'): void
{
    if (!$condicion) {
        throw new FalloDeAsercion($mensaje);
    }
}

function igual(mixed $esperado, mixed $real, string $contexto = ''): void
{
    if ($esperado !== $real) {
        throw new FalloDeAsercion(trim($contexto . ' Esperado ' . var_export($esperado, true) . ', obtenido ' . var_export($real, true)));
    }
}

/** @return \Throwable la excepción lanzada */
function lanza(string $clase, callable $codigo): \Throwable
{
    try {
        $codigo();
    } catch (\Throwable $e) {
        if ($e instanceof $clase) {
            return $e;
        }
        throw new FalloDeAsercion("Se esperaba {$clase}, se lanzó " . get_class($e) . ': ' . $e->getMessage());
    }
    throw new FalloDeAsercion("Se esperaba {$clase} y no se lanzó nada");
}

/** Controlador de actividades con SQLite y un reloj controlable desde el test. */
function montarActividades(\PDO $pdo, \Closure $autenticacion, \Closure $reloj): \CodeUrv\Presentacion\Controladores\ActividadesControlador
{
    $actividades = new \CodeUrv\Infraestructura\BaseDeDatos\RepositorioActividadesPdo($pdo);
    $inscripciones = new \CodeUrv\Infraestructura\BaseDeDatos\RepositorioInscripcionesPdo($pdo);
    $ajustes = new \CodeUrv\Infraestructura\BaseDeDatos\AjustesPdo($pdo);
    return new \CodeUrv\Presentacion\Controladores\ActividadesControlador(
        static fn () => new \CodeUrv\Aplicacion\CasosDeUso\ParticiparEnActividades(
            $actividades, $inscripciones, $ajustes, $reloj, static fn () => strtoupper(bin2hex(random_bytes(6))),
        ),
        static fn () => new \CodeUrv\Aplicacion\CasosDeUso\GestionarActividades($actividades, $inscripciones, $ajustes, $reloj),
        $autenticacion,
    );
}

function pdoSqlite(): \PDO
{
    $pdo = new \PDO('sqlite::memory:', null, null, [
        \PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION,
        \PDO::ATTR_DEFAULT_FETCH_MODE => \PDO::FETCH_ASSOC,
    ]);
    $pdo->exec((string) file_get_contents(__DIR__ . '/../sql/sqlite.sql'));
    return $pdo;
}

final class SesionEnMemoria implements Sesion
{
    public ?string $usuario = null;
    public ?string $csrf = null;

    public function usuarioActual(): ?string
    {
        return $this->usuario;
    }

    public function iniciar(string $nombreUsuario): string
    {
        $this->usuario = $nombreUsuario;
        return $this->csrf = bin2hex(random_bytes(8));
    }

    public function cerrar(): void
    {
        $this->usuario = $this->csrf = null;
    }

    public function tokenCsrf(): ?string
    {
        return $this->csrf;
    }
}

final class UsuariosEnMemoria implements RepositorioUsuarios
{
    /** @var array<string, Usuario> */
    private array $usuarios = [];

    public function agregar(string $nombre, string $contrasena): void
    {
        $this->usuarios[$nombre] = new Usuario(count($this->usuarios) + 1, $nombre, password_hash($contrasena, PASSWORD_DEFAULT));
    }

    public function buscarPorNombre(string $nombre): ?Usuario
    {
        return $this->usuarios[$nombre] ?? null;
    }
}

final class IntentosEnMemoria implements RegistroIntentos
{
    /** @var array<string, list<int>> */
    public array $fallos = [];

    public function fallosDesde(string $clave, int $desdeTimestamp): int
    {
        return count(array_filter($this->fallos[$clave] ?? [], static fn ($t) => $t >= $desdeTimestamp));
    }

    public function registrarFallo(string $clave, int $timestamp): void
    {
        $this->fallos[$clave][] = $timestamp;
    }

    public function limpiar(string $clave): void
    {
        unset($this->fallos[$clave]);
    }
}
