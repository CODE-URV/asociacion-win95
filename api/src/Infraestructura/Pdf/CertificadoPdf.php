<?php

declare(strict_types=1);

namespace CodeUrv\Infraestructura\Pdf;

use CodeUrv\Aplicacion\Puertos\GeneradorCertificados;
use CodeUrv\Dominio\Certificado;

/**
 * Genera el certificado en PDF sin librerías externas, imitando la plantilla de la asociación:
 * A4 apaisado, marco azul, panel gris claro, logo arriba, textos en monoespaciada (Courier)
 * y dos firmas abajo (ponente y presidente).
 *
 * Usa las fuentes estándar del PDF (Courier) con codificación WinAnsi, que incluye
 * todos los caracteres del catalán (à, è, ç, l·l, ’, «»...).
 */
final class CertificadoPdf implements GeneradorCertificados
{
    private const ANCHO = 842.0; // A4 apaisado en puntos
    private const ALTO = 595.0;
    private const MARGEN = 12.0;
    private const ANCHO_UTIL = 760.0;
    private const AZUL = '0 0 0.9';
    private const GRIS = '0.937 0.937 0.937';

    public function __construct(private readonly string $rutaLogoJpeg)
    {
    }

    public function generar(Certificado $c): string
    {
        $contenido = [];

        // Fondo azul y los dos paneles grises (contenido y firmas)
        $contenido[] = self::AZUL . ' rg 0 0 ' . self::ANCHO . ' ' . self::ALTO . ' re f';
        $contenido[] = self::GRIS . ' rg ' . self::MARGEN . ' 134 ' . (self::ANCHO - 2 * self::MARGEN) . ' ' . (self::ALTO - 134 - self::MARGEN) . ' re f';
        $contenido[] = self::GRIS . ' rg ' . self::MARGEN . ' ' . self::MARGEN . ' ' . (self::ANCHO - 2 * self::MARGEN) . ' 110 re f';

        // Logo centrado arriba
        $contenido[] = 'q 82 0 0 82 ' . (self::ANCHO / 2 - 41) . ' 482 cm /Logo Do Q';

        $contenido[] = '0 0 0 rg';
        $contenido[] = $this->centrado('Certificat d’assistència', 'F1', 36, 438);
        $contenido[] = $this->centrado('CodeURV certifica que', 'F1', 22, 392);
        $contenido[] = $this->centrado($c->nombre, 'F2', $this->tamanoQueCabe($c->nombre, 30, self::ANCHO_UTIL), 322);

        // "va assistir a la xerrada “TÍTOL”": si no cabe en una línea, título en la siguiente
        $frase = $c->frase() . ' “' . mb_strtoupper($c->titulo) . '”';
        $y = 250;
        if ($this->anchoTexto($frase, 20) <= self::ANCHO_UTIL) {
            $contenido[] = $this->centrado($frase, 'F1', 20, $y);
        } else {
            $contenido[] = $this->centrado($c->frase(), 'F1', 20, $y + 14);
            $titulo = '“' . mb_strtoupper($c->titulo) . '”';
            $y -= 14;
            $contenido[] = $this->centrado($titulo, 'F1', $this->tamanoQueCabe($titulo, 20, self::ANCHO_UTIL), $y);
        }
        $contenido[] = $this->centrado($c->textoFecha(), 'F1', 20, $y - 34);

        // Firmas
        $izquierda = self::ANCHO / 4 + 3;
        $derecha = self::ANCHO * 3 / 4 - 3;
        if ($c->ponente !== '') {
            $contenido[] = $this->centrado($c->ponente, 'F1', $this->tamanoQueCabe($c->ponente, 15, 360), 76, $izquierda);
            $contenido[] = $this->centrado('PONENT INVITAT', 'F1', 15, 48, $izquierda);
        }
        if ($c->presidente !== '') {
            $contenido[] = $this->centrado($c->presidente, 'F1', $this->tamanoQueCabe($c->presidente, 15, 360), 76, $derecha);
            $contenido[] = $this->centrado('PRESIDENT', 'F1', 15, 48, $derecha);
        }

        return $this->documento(implode("\n", $contenido));
    }

    /** Ancho de un texto en Courier: todos los caracteres miden 0,6 em. */
    private function anchoTexto(string $texto, float $tamano): float
    {
        return mb_strlen($texto) * 0.6 * $tamano;
    }

    private function tamanoQueCabe(string $texto, float $maximo, float $ancho): float
    {
        $largo = max(1, mb_strlen($texto));
        return max(9.0, min($maximo, $ancho / ($largo * 0.6)));
    }

    private function centrado(string $texto, string $fuente, float $tamano, float $y, ?float $centroX = null): string
    {
        $x = ($centroX ?? self::ANCHO / 2) - $this->anchoTexto($texto, $tamano) / 2;
        return sprintf('BT /%s %.2F Tf %.2F %.2F Td (%s) Tj ET', $fuente, $tamano, $x, $y, $this->cadenaPdf($texto));
    }

    /** UTF-8 → WinAnsi (Windows-1252) y escapado de \ ( ) */
    private function cadenaPdf(string $texto): string
    {
        $winAnsi = mb_convert_encoding($texto, 'Windows-1252', 'UTF-8');
        return strtr($winAnsi, ['\\' => '\\\\', '(' => '\\(', ')' => '\\)', "\r" => '', "\n" => ' ']);
    }

    private function documento(string $contenido): string
    {
        $jpeg = (string) file_get_contents($this->rutaLogoJpeg);
        $info = getimagesizefromstring($jpeg) ?: [600, 600];

        $objetos = [
            1 => '<< /Type /Catalog /Pages 2 0 R >>',
            2 => '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
            3 => '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' . self::ANCHO . ' ' . self::ALTO . ']'
                . ' /Resources << /Font << /F1 5 0 R /F2 6 0 R >> /XObject << /Logo 7 0 R >> >> /Contents 4 0 R >>',
            4 => '<< /Length ' . strlen($contenido) . " >>\nstream\n{$contenido}\nendstream",
            5 => '<< /Type /Font /Subtype /Type1 /BaseFont /Courier /Encoding /WinAnsiEncoding >>',
            6 => '<< /Type /Font /Subtype /Type1 /BaseFont /Courier-Bold /Encoding /WinAnsiEncoding >>',
            7 => "<< /Type /XObject /Subtype /Image /Width {$info[0]} /Height {$info[1]} /ColorSpace /DeviceRGB"
                . ' /BitsPerComponent 8 /Filter /DCTDecode /Length ' . strlen($jpeg) . " >>\nstream\n{$jpeg}\nendstream",
        ];

        $pdf = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n";
        $posiciones = [];
        foreach ($objetos as $numero => $objeto) {
            $posiciones[$numero] = strlen($pdf);
            $pdf .= "{$numero} 0 obj\n{$objeto}\nendobj\n";
        }

        $inicioXref = strlen($pdf);
        $pdf .= 'xref' . "\n0 " . (count($objetos) + 1) . "\n0000000000 65535 f \n";
        foreach ($posiciones as $posicion) {
            $pdf .= sprintf("%010d 00000 n \n", $posicion);
        }
        $pdf .= 'trailer << /Size ' . (count($objetos) + 1) . " /Root 1 0 R >>\nstartxref\n{$inicioXref}\n%%EOF\n";
        return $pdf;
    }
}
