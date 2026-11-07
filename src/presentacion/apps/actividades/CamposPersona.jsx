import { CURSOS, GRADOS, OTRO_GRADO } from '../../../dominio/actividad';

function Campo({ etiqueta, error, children }) {
  return (
    <label className="act-campo">
      <span className="act-etiqueta">{etiqueta}</span>
      {children}
      {error && <span className="act-error">{error}</span>}
    </label>
  );
}

function Casilla({ marcada, alCambiar, error, children }) {
  return (
    <div className="act-campo">
      <label className="act-casilla">
        <input type="checkbox" checked={marcada} onChange={(e) => alCambiar(e.target.checked)} />
        <span>{children}</span>
      </label>
      {error && <span className="act-error">{error}</span>}
    </div>
  );
}

/** Campos de la persona que se apunta (inscripción y registro en la puerta). */
export default function CamposPersona({ persona, cambiar, errores = {}, conEmail = true }) {
  const texto = (campo) => (e) => cambiar(campo, e.target.value);

  return (
    <>
      {conEmail && (
        <Campo etiqueta="Correo electrónico *" error={errores.email}>
          <input className="act-input" type="email" autoComplete="email" value={persona.email} onChange={texto('email')} placeholder="nom.cognom@estudiants.urv.cat" />
        </Campo>
      )}

      <div className="act-fila">
        <Campo etiqueta="Nombre *" error={errores.nombre}>
          <input className="act-input" autoComplete="given-name" value={persona.nombre} onChange={texto('nombre')} />
        </Campo>
        <Campo etiqueta="Apellidos *" error={errores.apellidos}>
          <input className="act-input" autoComplete="family-name" value={persona.apellidos} onChange={texto('apellidos')} />
        </Campo>
      </div>

      <Campo etiqueta="¿Qué estudias? *" error={errores.grado}>
        <select className="act-input" value={persona.grado} onChange={texto('grado')}>
          {GRADOS.map((g) => <option key={g} value={g}>{g}</option>)}
          <option value={OTRO_GRADO}>Otro...</option>
        </select>
      </Campo>
      {persona.grado === OTRO_GRADO && (
        <Campo etiqueta="Escribe qué estudias *">
          <input className="act-input" value={persona.otroGrado} onChange={texto('otroGrado')} />
        </Campo>
      )}

      <Campo etiqueta="Curso (aprox.) *" error={errores.curso}>
        <select className="act-input" value={persona.curso} onChange={texto('curso')}>
          {CURSOS.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </Campo>

      <Casilla marcada={persona.confirmaAsistencia} alCambiar={(v) => cambiar('confirmaAsistencia', v)} error={errores.confirmaAsistencia}>
        Confirmo que asistiré.
      </Casilla>
      <Casilla marcada={persona.aceptaPrivacidad} alCambiar={(v) => cambiar('aceptaPrivacidad', v)} error={errores.aceptaPrivacidad}>
        Acepto que CODE URV guarde estos datos para gestionar la actividad y enviarme el certificado
        de asistencia. No se ceden a terceros y puedes pedir que se borren escribiendo a codeurv@urv.cat.
      </Casilla>
    </>
  );
}
