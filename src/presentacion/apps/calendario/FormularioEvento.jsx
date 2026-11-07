import { useState } from 'react';
import { cambiarTodoElDia, validarEvento } from '../../../dominio/calendario';

function Campo({ etiqueta, error, children }) {
  return (
    <label className="gp-campo">
      <span className="gp-etiqueta">{etiqueta}</span>
      {children}
      {error && <span className="gp-error">{error}</span>}
    </label>
  );
}

/** Alta y edición de un evento del calendario. */
export default function FormularioEvento({ inicial, titulo, alGuardar, alCancelar }) {
  const [evento, setEvento] = useState(inicial);
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const cambiar = (campo) => (e) => setEvento((ev) => ({ ...ev, [campo]: e.target.value }));
  const tipoFecha = evento.todoElDia ? 'date' : 'datetime-local';

  const alEnviar = async (e) => {
    e.preventDefault();
    const datos = { ...evento, titulo: evento.titulo.trim(), descripcion: evento.descripcion.trim(), lugar: evento.lugar.trim() };
    const locales = validarEvento(datos);
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
        <input className="gp-input" value={evento.titulo} onChange={cambiar('titulo')} maxLength={200} autoFocus />
      </Campo>

      <label className="gp-casilla">
        <input type="checkbox" checked={evento.todoElDia} onChange={(e) => setEvento((ev) => cambiarTodoElDia(ev, e.target.checked))} />
        Todo el día
      </label>

      <div className="gp-fila">
        <Campo etiqueta="Empieza *" error={errores.inicio}>
          <input className="gp-input" type={tipoFecha} value={evento.inicio} onChange={cambiar('inicio')} />
        </Campo>
        <Campo etiqueta={evento.todoElDia ? 'Último día *' : 'Acaba *'} error={errores.fin}>
          <input className="gp-input" type={tipoFecha} value={evento.fin} onChange={cambiar('fin')} />
        </Campo>
      </div>

      <Campo etiqueta="Lugar" error={errores.lugar}>
        <input className="gp-input" value={evento.lugar} onChange={cambiar('lugar')} maxLength={200} />
      </Campo>

      <Campo etiqueta="Descripción" error={errores.descripcion}>
        <textarea className="gp-input gp-textarea" value={evento.descripcion} onChange={cambiar('descripcion')} maxLength={5000} />
      </Campo>

      {errorGeneral && <div className="gp-error-general">❌ {errorGeneral}</div>}

      <div className="gp-botones">
        <button type="submit" className="win95-boton" disabled={guardando}>{guardando ? 'Guardando...' : 'Aceptar'}</button>
        <button type="button" className="win95-boton" onClick={alCancelar} disabled={guardando}>Cancelar</button>
      </div>
    </form>
  );
}
