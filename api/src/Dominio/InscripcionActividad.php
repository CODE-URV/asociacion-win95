<?php

declare(strict_types=1);

namespace CodeUrv\Dominio;

/** Persona apuntada a una actividad, con su asistencia y certificado. */
final class InscripcionActividad
{
    public const CURSOS = ['1er', '2n', '3er', '4t', '5e (Dobles graus)', 'No soc estudiant'];
    private const MAX_NOMBRE = 80;
    private const MAX_GRADO = 150;

    private function __construct(
        public readonly ?int $id,
        public readonly int $actividadId,
        public readonly string $email,
        public readonly string $nombre,
        public readonly string $apellidos,
        public readonly string $grado,
        public readonly string $curso,
        /** Código público del certificado (codeurv.com/?verificar=CODIGO) */
        public readonly string $codigo,
        public readonly \DateTimeImmutable $inscritoEn,
        public readonly ?\DateTimeImmutable $asistioEn,
        public readonly ?\DateTimeImmutable $certificadoEnviadoEn,
    ) {
    }

    /** @param array<string, mixed> $datos */
    public static function nueva(int $actividadId, array $datos, string $codigo, \DateTimeImmutable $ahora): self
    {
        $errores = [];
        $texto = static function (string $campo, string $mensaje, int $maximo) use ($datos, &$errores): string {
            $valor = is_string($datos[$campo] ?? null) ? trim($datos[$campo]) : '';
            if ($valor === '') {
                $errores[$campo] = $mensaje;
            } elseif (mb_strlen($valor) > $maximo) {
                $errores[$campo] = "Máximo {$maximo} caracteres.";
            }
            return $valor;
        };

        $email = self::normalizarEmail(is_string($datos['email'] ?? null) ? $datos['email'] : '');
        if (filter_var($email, FILTER_VALIDATE_EMAIL) === false || mb_strlen($email) > 190) {
            $errores['email'] = 'El correo electrónico no es válido.';
        }
        $nombre = $texto('nombre', 'El nombre es obligatorio.', self::MAX_NOMBRE);
        $apellidos = $texto('apellidos', 'Los apellidos son obligatorios.', self::MAX_NOMBRE);
        $grado = $texto('grado', 'Indica qué estudias.', self::MAX_GRADO);
        $curso = is_string($datos['curso'] ?? null) ? $datos['curso'] : '';
        if (!in_array($curso, self::CURSOS, true)) {
            $errores['curso'] = 'Indica tu curso.';
        }
        if (($datos['confirmaAsistencia'] ?? false) !== true) {
            $errores['confirmaAsistencia'] = 'Tienes que confirmar que asistirás.';
        }
        if (($datos['aceptaPrivacidad'] ?? false) !== true) {
            $errores['aceptaPrivacidad'] = 'Tienes que aceptar el uso de tus datos.';
        }

        if ($errores !== []) {
            throw new ErrorDeValidacion($errores);
        }

        return new self(null, $actividadId, $email, $nombre, $apellidos, $grado, $curso, $codigo, $ahora, null, null);
    }

    /** Reconstruye una inscripción guardada. */
    public static function desdeAlmacen(
        int $id,
        int $actividadId,
        string $email,
        string $nombre,
        string $apellidos,
        string $grado,
        string $curso,
        string $codigo,
        \DateTimeImmutable $inscritoEn,
        ?\DateTimeImmutable $asistioEn,
        ?\DateTimeImmutable $certificadoEnviadoEn,
    ): self {
        return new self($id, $actividadId, $email, $nombre, $apellidos, $grado, $curso, $codigo, $inscritoEn, $asistioEn, $certificadoEnviadoEn);
    }

    public static function normalizarEmail(string $email): string
    {
        return mb_strtolower(trim($email));
    }

    public function conId(int $id): self
    {
        return new self($id, $this->actividadId, $this->email, $this->nombre, $this->apellidos, $this->grado, $this->curso, $this->codigo, $this->inscritoEn, $this->asistioEn, $this->certificadoEnviadoEn);
    }

    public function conAsistencia(?\DateTimeImmutable $momento): self
    {
        return new self($this->id, $this->actividadId, $this->email, $this->nombre, $this->apellidos, $this->grado, $this->curso, $this->codigo, $this->inscritoEn, $momento, $this->certificadoEnviadoEn);
    }

    public function conCertificadoEnviado(\DateTimeImmutable $momento): self
    {
        return new self($this->id, $this->actividadId, $this->email, $this->nombre, $this->apellidos, $this->grado, $this->curso, $this->codigo, $this->inscritoEn, $this->asistioEn, $momento);
    }

    public function nombreCompleto(): string
    {
        return $this->nombre . ' ' . $this->apellidos;
    }

    /** @return array<string, mixed> */
    public function aArray(): array
    {
        $fecha = static fn (?\DateTimeImmutable $f) => $f?->format('Y-m-d\TH:i:s');
        return [
            'id' => $this->id,
            'email' => $this->email,
            'nombre' => $this->nombre,
            'apellidos' => $this->apellidos,
            'grado' => $this->grado,
            'curso' => $this->curso,
            'codigo' => $this->codigo,
            'inscritoEn' => $fecha($this->inscritoEn),
            'asistioEn' => $fecha($this->asistioEn),
            'certificadoEnviadoEn' => $fecha($this->certificadoEnviadoEn),
        ];
    }
}
