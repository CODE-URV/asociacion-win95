import { useState } from 'react';
import { ESTADOS, LIMITES, listaDesdeTexto, textoDesdeLista, validar } from '../../../dominio/proyecto';

function CampoFormulario({ etiqueta, error, children }) {
  return (
    <label className="gp-campo">
      <span className="gp-etiqueta">{etiqueta}</span>
      {children}
      {error && <span className="gp-error">{error}</span>}
    </label>
  );
}

/** Formulario de alta/edición de un proyecto (Panel de control). */
export default function FormularioProyecto({ inicial, titulo, alGuardar, alCancelar }) {
  const [campos, setCampos] = useState({
    ...inicial,
    tecnologias: textoDesdeLista(inicial.tecnologias),
    colaboradores: textoDesdeLista(inicial.colaboradores),
  });
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const cambiar = (campo) => (e) => setCampos((previo) => ({ ...previo, [campo]: e.target.value }));

  const alEnviar = async (e) => {
    e.preventDefault();
    const datos = {
      nombre: campos.nombre.trim(),
      descripcion: campos.descripcion.trim(),
      responsable: campos.responsable.trim(),
      email: campos.email.trim(),
      estado: campos.estado,
      progreso: Number(campos.progreso),
      tecnologias: listaDesdeTexto(campos.tecnologias),
      repositorio: campos.repositorio.trim(),
      colaboradores: listaDesdeTexto(campos.colaboradores),
    };

    const erroresLocales = validar(datos);
    setErrores(erroresLocales);
    setErrorGeneral(null);
    if (Object.keys(erroresLocales).length > 0) return;

    setGuardando(true);
    try {
      await alGuardar(datos);
    } catch (error) {
      // El servidor devuelve los errores por campo en `detalles` (422)
      if (error.detalles) setErrores(error.detalles);
      setErrorGeneral(error.message);
      setGuardando(false);
    }
  };

  return (
    <form className="gp-formulario" onSubmit={alEnviar} noValidate>
      <div className="gp-formulario-titulo">{titulo}</div>

      <CampoFormulario error={errores.nombre} etiqueta="Nombre *">
        <input className="gp-input" value={campos.nombre} onChange={cambiar('nombre')} maxLength={LIMITES.nombre} autoFocus />
      </CampoFormulario>

      <CampoFormulario error={errores.descripcion} etiqueta="Descripción">
        <textarea className="gp-input gp-textarea" value={campos.descripcion} onChange={cambiar('descripcion')} maxLength={LIMITES.descripcion} />
      </CampoFormulario>

      <div className="gp-fila">
        <CampoFormulario error={errores.responsable} etiqueta="Responsable">
          <input className="gp-input" value={campos.responsable} onChange={cambiar('responsable')} maxLength={LIMITES.responsable} />
        </CampoFormulario>
        <CampoFormulario error={errores.email} etiqueta="Email">
          <input className="gp-input" type="email" value={campos.email} onChange={cambiar('email')} maxLength={LIMITES.email} />
        </CampoFormulario>
      </div>

      <div className="gp-fila">
        <CampoFormulario error={errores.estado} etiqueta="Estado">
          <select className="gp-input" value={campos.estado} onChange={cambiar('estado')}>
            {ESTADOS.map((estado) => (
              <option key={estado} value={estado}>{estado}</option>
            ))}
          </select>
        </CampoFormulario>
        <CampoFormulario error={errores.progreso} etiqueta="Progreso (%)">
          <input className="gp-input" type="number" min="0" max="100" step="1" value={campos.progreso} onChange={cambiar('progreso')} />
        </CampoFormulario>
      </div>

      <CampoFormulario error={errores.tecnologias} etiqueta="Tecnologías (separadas por comas)">
        <input className="gp-input" value={campos.tecnologias} onChange={cambiar('tecnologias')} placeholder="React, PHP, MySQL" />
      </CampoFormulario>

      <CampoFormulario error={errores.colaboradores} etiqueta="Colaboradores (separados por comas)">
        <input className="gp-input" value={campos.colaboradores} onChange={cambiar('colaboradores')} placeholder="Pau, Laia, Marc" />
      </CampoFormulario>

      <CampoFormulario error={errores.repositorio} etiqueta="Repositorio (URL)">
        <input className="gp-input" type="url" value={campos.repositorio} onChange={cambiar('repositorio')} maxLength={LIMITES.repositorio} placeholder="https://github.com/..." />
      </CampoFormulario>

      {errorGeneral && <div className="gp-error-general">❌ {errorGeneral}</div>}

      <div className="gp-botones">
        <button type="submit" className="win95-boton" disabled={guardando}>
          {guardando ? 'Guardando...' : 'Aceptar'}
        </button>
        <button type="button" className="win95-boton" onClick={alCancelar} disabled={guardando}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
