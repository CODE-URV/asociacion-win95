<?php

declare(strict_types=1);

use CodeUrv\Dominio\ErrorDeValidacion;
use CodeUrv\Dominio\EstadoProyecto;
use CodeUrv\Dominio\Proyecto;
use CodeUrv\Dominio\SolicitudInscripcion;

use function CodeUrv\Tests\afirmar;
use function CodeUrv\Tests\igual;
use function CodeUrv\Tests\lanza;

$proyecto = static fn (array $cambios = []) => array_merge([
    'nombre' => 'Web de la asociación',
    'descripcion' => 'Escritorio Win95',
    'responsable' => 'Gaizka',
    'email' => 'codeurv@urv.cat',
    'estado' => 'En Progreso',
    'progreso' => 60,
    'tecnologias' => ['React', ' PHP ', 'React', ''],
    'repositorio' => 'https://github.com/CODE-URV/asociacion-win95',
    'colaboradores' => [],
], $cambios);

$inscripcion = static fn (array $cambios = []) => array_merge([
    'socioAnterior' => SolicitudInscripcion::SOCIO_NUEVO,
    'grado' => 'Grau en Enginyeria Informàtica',
    'curso' => '1er',
    'talla' => 'M',
    'nombre' => 'Ana Pérez',
    'correo' => 'ana@estudiants.urv.cat',
    'telefono' => '600000000',
], $cambios);

return [
    'un proyecto válido normaliza las listas (recorta, quita vacíos y duplicados)' => static function () use ($proyecto) {
        $p = Proyecto::desdeDatos($proyecto());
        igual(EstadoProyecto::EnProgreso, $p->estado);
        igual(['React', 'PHP'], $p->tecnologias);
        igual(null, $p->id);
        igual(7, $p->conId(7)->id);
    },

    'un proyecto inválido devuelve todos los errores por campo' => static function () use ($proyecto) {
        $e = lanza(ErrorDeValidacion::class, static fn () => Proyecto::desdeDatos($proyecto([
            'nombre' => '   ',
            'estado' => 'Inventado',
            'progreso' => 101,
            'email' => 'nope',
            'repositorio' => 'javascript:alert(1)',
        ])));
        $campos = array_keys($e->errores);
        sort($campos);
        igual(['email', 'estado', 'nombre', 'progreso', 'repositorio'], $campos);
    },

    'el progreso tiene que ser entero (no vale "50")' => static function () use ($proyecto) {
        lanza(ErrorDeValidacion::class, static fn () => Proyecto::desdeDatos($proyecto(['progreso' => '50'])));
    },

    'los textos demasiado largos se rechazan' => static function () use ($proyecto) {
        $e = lanza(ErrorDeValidacion::class, static fn () => Proyecto::desdeDatos($proyecto(['nombre' => str_repeat('ñ', 121)])));
        afirmar(isset($e->errores['nombre']));
    },

    'inscripción de socio anterior: no lleva talla aunque se envíe' => static function () use ($inscripcion) {
        $s = SolicitudInscripcion::desdeDatos($inscripcion(['socioAnterior' => SolicitudInscripcion::SOCIO_ANTERIOR, 'talla' => 'XL']));
        igual('', $s->talla);
        igual(['socioAnterior', 'grado', 'curso', 'talla', 'nombre', 'correo', 'telefono'], array_keys($s->aArray()));
    },

    'inscripción: socio nuevo sin talla, correo inválido y opción desconocida' => static function () use ($inscripcion) {
        $e = lanza(ErrorDeValidacion::class, static fn () => SolicitudInscripcion::desdeDatos($inscripcion([
            'talla' => '',
            'correo' => 'no-es-un-correo',
            'socioAnterior' => 'quizás',
        ])));
        $campos = array_keys($e->errores);
        sort($campos);
        igual(['correo', 'socioAnterior', 'talla'], $campos);
    },
];
