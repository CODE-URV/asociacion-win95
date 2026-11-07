import { useState } from 'react';
import { TIPOS, validarActividad } from '../../../dominio/actividad';

function Campo({ etiqueta, error, children }) {
  return (
    <label className="gp-campo">
      <span className="gp-etiqueta">{etiqueta}</span>
      {children}
      {error && <span className="gp-error">{error}</span>}
    </label>
  );
}

/** Alta y edición de una actividad (Panel de control). */
export default function FormularioActividad({ inicial, titulo, alGuardar, alCancelar }) {
  const [campos, setCampos] = useState({ ...inicial, plazas: inicial.plazas ?? '' });
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const cambiar = (campo) => (e) =>
    setCampos((p) => ({ ...p, [campo]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const alEnviar = async (e) => {
    e.preventDefault();
    const datos = {
      titulo: campos.titulo.trim(),
      tipo: campos.tipo,
      descripcion: campos.descripcion.trim(),
      informacionExtra: campos.informacionExtra.trim(),
      lugar: campos.lugar.trim(),
      inicio: campos.inicio,
      fin: campos.fin,
      ponente: campos.ponente.trim(),
      plazas: String(campos.plazas).trim() === '' ? null : Number(campos.plazas),
      publicada: campos.publicada,
      inscripcionesAbiertas: campos.inscripcionesAbiertas,
    };

    const locales = validarActividad(datos);
    setErrores(locales);
    setErrorGeneral(null);
    if (Object.keys(locales).length > 0) return;

    setGuardando(true);
    try {
      await alGuardar(datos);
    } catch (error) {
      if (error.detalles) setErrores(error.detalles);
      setErrorGeneral(error.message);
      setGuardando(false);
    }
  };

  return (
    <form className="gp-formulario" onSubmit={alEnviar} noValidate>
      <div className="gp-formulario-titulo">{titulo}</div>

      <Campo etiqueta="Título *" error={errores.titulo}>
        <input className="gp-input" value={campos.titulo} onChange={cambiar('titulo')} maxLength={150} autoFocus placeholder="Install Party DEIM x CodeURV" />
      </Campo>

      <div className="gp-fila">
        <Campo etiqueta="Tipo" error={errores.tipo}>
          <select className="gp-input" value={campos.tipo} onChange={cambiar('tipo')}>
            {TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </Campo>
        <Campo etiqueta="Lugar *" error={errores.lugar}>
          <input className="gp-input" value={campos.lugar} onChange={cambiar('lugar')} maxLength={150} placeholder="Planta baixa CRAI" />
        </Campo>
      </div>

      <div className="gp-fila">
        <Campo etiqueta="Empieza *" error={errores.inicio}>
          <input className="gp-input" type="datetime-local" value={campos.inicio} onChange={cambiar('inicio')} />
        </Campo>
        <Campo etiqueta="Acaba *" error={errores.fin}>
          <input className="gp-input" type="datetime-local" value={campos.fin} onChange={cambiar('fin')} />
        </Campo>
      </div>

      <div className="gp-fila">
        <Campo etiqueta="Ponente (sale en el certificado)" error={errores.ponente}>
          <input className="gp-input" value={campos.ponente} onChange={cambiar('ponente')} maxLength={120} placeholder="Jordi Duch" />
        </Campo>
        <Campo etiqueta="Plazas (vacío = sin límite)" error={errores.plazas}>
          <input className="gp-input" type="number" min="1" max="2000" step="1" value={campos.plazas} onChange={cambiar('plazas')} />
        </Campo>
      </div>

      <Campo etiqueta="Descripción" error={errores.descripcion}>
        <textarea className="gp-input gp-textarea" value={campos.descripcion} onChange={cambiar('descripcion')} maxLength={5000} />
      </Campo>

      <Campo etiqueta="Información adicional (qué traer, requisitos...)" error={errores.informacionExtra}>
        <textarea className="gp-input gp-textarea" value={campos.informacionExtra} onChange={cambiar('informacionExtra')} maxLength={5000} />
      </Campo>

      <label className="gp-casilla">
        <input type="checkbox" checked={campos.publicada} onChange={cambiar('publicada')} />
        Publicada (se ve en la web)
      </label>
      <label className="gp-casilla">
        <input type="checkbox" checked={campos.inscripcionesAbiertas} onChange={cambiar('inscripcionesAbiertas')} />
        Inscripciones abiertas
      </label>

      {errorGeneral && <div className="gp-error-general">❌ {errorGeneral}</div>}

      <div className="gp-botones">
        <button type="submit" className="win95-boton" disabled={guardando}>{guardando ? 'Guardando...' : 'Aceptar'}</button>
        <button type="button" className="win95-boton" onClick={alCancelar} disabled={guardando}>Cancelar</button>
      </div>
    </form>
  );
}
