import { useState } from 'react';
import './Actividades.css';
import useActividades from '../../../aplicacion/useActividades';
import { estadoPublico, personaVacia, textoHorario, validarPersona } from '../../../dominio/actividad';
import CamposPersona from './CamposPersona';

function Cabecera() {
  return <div className="act-cabecera">🎤 CHARLAS Y TALLERES - CODE URV</div>;
}

function FormularioInscripcion({ actividad, alInscribirse }) {
  const [persona, setPersona] = useState(personaVacia);
  const [errores, setErrores] = useState({});
  const [mensaje, setMensaje] = useState(null);
  const [estado, setEstado] = useState('editando'); // editando | enviando | hecho

  const cambiar = (campo, valor) => setPersona((p) => ({ ...p, [campo]: valor }));

  const alEnviar = async (e) => {
    e.preventDefault();
    const locales = validarPersona(persona);
    setErrores(locales);
    setMensaje(null);
    if (Object.keys(locales).length > 0) return;

    setEstado('enviando');
    const r = await alInscribirse(actividad.id, persona);
    if (r.ok) {
      setEstado('hecho');
    } else {
      setErrores(r.detalles ?? {});
      setMensaje(r.error);
      setEstado('editando');
    }
  };

  if (estado === 'hecho') {
    return (
      <div className="act-exito">
        <div className="act-exito-icono">✅</div>
        <h3>¡Te has apuntado, {persona.nombre}!</h3>
        <p>
          El día de la actividad escanea el código QR que se mostrará en la sala para registrar tu
          asistencia. Después te enviaremos el certificado a <strong>{persona.email.trim()}</strong>.
        </p>
      </div>
    );
  }

  return (
    <form className="act-formulario" onSubmit={alEnviar} noValidate>
      <div className="act-formulario-titulo">Formulario de inscripción</div>
      <CamposPersona persona={persona} cambiar={cambiar} errores={errores} />
      {mensaje && <div className="act-error-general">❌ {mensaje}</div>}
      <div className="act-botones">
        <button type="submit" className="win95-boton act-boton-principal" disabled={estado === 'enviando'}>
          {estado === 'enviando' ? 'Enviando...' : '✉️ Apuntarme'}
        </button>
      </div>
    </form>
  );
}

function Detalle({ actividad, alVolver, alInscribirse }) {
  const estado = estadoPublico(actividad);
  return (
    <div className="act-detalle">
      <button className="win95-boton act-volver" onClick={alVolver}>◀ Todas las actividades</button>

      <div className="act-ficha">
        <div className="act-ficha-cabecera">
          <span className="act-tipo">{actividad.tipo}</span>
          <span className={`act-estado act-estado-${estado.clase}`}>{estado.texto}</span>
        </div>
        <h2 className="act-titulo">{actividad.titulo}</h2>
        <ul className="act-datos">
          <li>📅 <span className="act-capitalizar">{textoHorario(actividad)}</span></li>
          <li>📍 {actividad.lugar}</li>
          {actividad.ponente && <li>🎙️ {actividad.ponente}</li>}
          {actividad.plazasLibres !== null && !actividad.terminada && (
            <li>👥 {actividad.plazasLibres} plaza(s) libre(s) de {actividad.plazas}</li>
          )}
        </ul>
        {actividad.descripcion && <p className="act-descripcion">{actividad.descripcion}</p>}
        {actividad.informacionExtra && (
          <div className="act-extra">
            <div className="act-extra-titulo">ℹ️ Información adicional</div>
            <p className="act-descripcion">{actividad.informacionExtra}</p>
          </div>
        )}
      </div>

      {actividad.motivoCerrada ? (
        <div className="act-aviso">{actividad.motivoCerrada}</div>
      ) : (
        <FormularioInscripcion actividad={actividad} alInscribirse={alInscribirse} />
      )}
    </div>
  );
}

function Tarjeta({ actividad, alAbrir }) {
  const estado = estadoPublico(actividad);
  return (
    <button className="act-tarjeta" onClick={() => alAbrir(actividad.id)}>
      <div className="act-ficha-cabecera">
        <span className="act-tipo">{actividad.tipo}</span>
        <span className={`act-estado act-estado-${estado.clase}`}>{estado.texto}</span>
      </div>
      <div className="act-tarjeta-titulo">{actividad.titulo}</div>
      <div className="act-tarjeta-datos act-capitalizar">📅 {textoHorario(actividad)}</div>
      <div className="act-tarjeta-datos">📍 {actividad.lugar}</div>
    </button>
  );
}

function Actividades() {
  const { actividades, cargando, error, inscribirse } = useActividades();
  const [seleccionadaId, setSeleccionadaId] = useState(null);
  const seleccionada = actividades.find((a) => a.id === seleccionadaId);

  if (cargando && actividades.length === 0) {
    return <div className="act"><Cabecera /><div className="act-mensaje">⏳ Cargando actividades...</div></div>;
  }
  if (error) {
    return <div className="act"><Cabecera /><div className="act-mensaje act-error-general">❌ {error}</div></div>;
  }

  if (seleccionada) {
    return (
      <div className="act">
        <Cabecera />
        <Detalle actividad={seleccionada} alVolver={() => setSeleccionadaId(null)} alInscribirse={inscribirse} />
      </div>
    );
  }

  const proximas = actividades.filter((a) => !a.terminada);
  const pasadas = actividades.filter((a) => a.terminada).reverse();

  return (
    <div className="act">
      <Cabecera />
      <div className="act-lista">
        {proximas.length === 0 && (
          <div className="act-mensaje">📭 Ahora mismo no hay actividades programadas. ¡Vuelve pronto!</div>
        )}
        {proximas.map((a) => <Tarjeta key={a.id} actividad={a} alAbrir={setSeleccionadaId} />)}

        {pasadas.length > 0 && (
          <>
            <div className="act-separador">Actividades recientes</div>
            {pasadas.map((a) => <Tarjeta key={a.id} actividad={a} alAbrir={setSeleccionadaId} />)}
          </>
        )}
      </div>
    </div>
  );
}

export default Actividades;
