import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import QRCode from 'qrcode';
import './ProyectorQr.css';
import logoURV from '../../assets/code_urv_logo_nobg.png';
import { useCodigoQr } from '../../../aplicacion/useGestorActividades';
import { urlAsistencia } from '../../../dominio/actividad';

/**
 * Pantalla para proyectar en la sala: QR que cambia cada 30 s, cuenta atrás
 * y número de asistentes registrados. Ocupa toda la pantalla, por encima del escritorio.
 */
export default function ProyectorQr({ actividad, alCerrar }) {
  const { codigo, caducaEn, asistentes, error } = useCodigoQr(actividad.id);
  const [imagen, setImagen] = useState(null);
  const [ahora, setAhora] = useState(() => Date.now());

  useEffect(() => {
    if (!codigo) return;
    QRCode.toDataURL(urlAsistencia(window.location.origin, actividad.id, codigo), {
      width: 800,
      margin: 2,
      errorCorrectionLevel: 'M',
    }).then(setImagen);
  }, [codigo, actividad.id]);

  useEffect(() => {
    const t = setInterval(() => setAhora(Date.now()), 250);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const alPulsar = (e) => e.key === 'Escape' && alCerrar();
    window.addEventListener('keydown', alPulsar);
    return () => window.removeEventListener('keydown', alPulsar);
  }, [alCerrar]);

  const restante = caducaEn ? Math.max(0, caducaEn - ahora) : 0;
  const porcentaje = Math.min(100, (restante / 30000) * 100);

  const pantallaCompleta = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen?.();
  };

  return createPortal(
    <div className="pqr">
      <div className="pqr-barra">
        <button className="win95-boton" onClick={pantallaCompleta}>⛶ Pantalla completa</button>
        <button className="win95-boton" onClick={alCerrar}>✕ Cerrar</button>
      </div>

      <div className="pqr-contenido">
        <img src={logoURV} alt="" className="pqr-logo" />
        <h1 className="pqr-titulo">{actividad.titulo}</h1>
        <p className="pqr-instrucciones">
          Escaneja el codi per registrar l'assistència i rebre el certificat
          <span>Escanea el código para registrar tu asistencia y recibir el certificado</span>
        </p>

        <div className="pqr-qr">
          {imagen ? <img src={imagen} alt="Código QR de asistencia" /> : <div className="pqr-cargando">⏳</div>}
          <div className="pqr-progreso"><div style={{ width: `${porcentaje}%` }} /></div>
        </div>

        <div className="pqr-pie">
          {error ? <span className="pqr-error">⚠️ {error} — reintentando...</span> : (
            <>
              <span>El código cambia cada 30 segundos</span>
              {asistentes !== null && <strong>👥 {asistentes} asistente(s)</strong>}
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
