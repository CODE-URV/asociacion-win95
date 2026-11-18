import { useEffect, useState } from 'react';
import '../proyectos/GestorProyectos.css';
import './CodeOlimpiadas.css';
import { useGestorOlimpiadas } from '../../../aplicacion/useGestorOlimpiadas';
import {
  CRITERIOS_IMAGEN, ESTADOS_PRUEBA, NOTA_MAXIMA, TIPOS_PRUEBA, equipoVacio, formatearTiempo, leerNota, medalla,
  miembrosDesdeTexto, pruebaVacia, validarEquipo, validarPrueba,
} from '../../../dominio/olimpiadas';
import { articuloAleatorio } from '../../../infraestructura/wikipediaApi';
import { imagenParaSubir } from './imagenParaSubir';

function Campo({ etiqueta, error, children }) {
  return (
    <label className="gp-campo">
      <span className="gp-etiqueta">{etiqueta}</span>
      {children}
      {error && <span className="gp-error">{error}</span>}
    </label>
  );
}

/** Envía el formulario y muestra los errores del servidor campo a campo. */
function useEnvio(alGuardar) {
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const enviar = async (locales, datos) => {
    setErrores(locales);
    setErrorGeneral(null);
    if (Object.keys(locales).length > 0) return;
    setGuardando(true);
    try {
      await alGuardar(datos);
    } catch (e) {
      if (e.detalles) setErrores(e.detalles);
      setErrorGeneral(e.message);
      setGuardando(false);
    }
  };
  return { errores, errorGeneral, guardando, enviar };
}

// ---------- Equipos ----------

function FormularioEquipo({ inicial, titulo, alGuardar, alCancelar }) {
  const [campos, setCampos] = useState(inicial);
  const { errores, errorGeneral, guardando, enviar } = useEnvio(alGuardar);
  return (
    <form
      className="gp-formulario"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        enviar(validarEquipo(campos), { nombre: campos.nombre.trim(), miembros: miembrosDesdeTexto(campos.miembros) });
      }}
    >
      <div className="gp-formulario-titulo">{titulo}</div>
      <Campo etiqueta="Nombre del equipo *" error={errores.nombre}>
        <input className="gp-input" value={campos.nombre} maxLength={60} autoFocus onChange={(e) => setCampos({ ...campos, nombre: e.target.value })} />
      </Campo>
      <Campo etiqueta="Miembros (uno por línea o separados por comas)" error={errores.miembros}>
        <textarea className="gp-input gp-textarea" value={campos.miembros} onChange={(e) => setCampos({ ...campos, miembros: e.target.value })} />
      </Campo>
      {errorGeneral && <div className="gp-error-general">❌ {errorGeneral}</div>}
      <div className="gp-botones">
        <button type="button" className="win95-boton" onClick={alCancelar}>Cancelar</button>
        <button type="submit" className="win95-boton" disabled={guardando}>{guardando ? 'Guardando...' : 'Guardar'}</button>
      </div>
    </form>
  );
}

function Equipos({ gestor }) {
  const { equipos } = gestor.datos;
  const [seleccionadoId, setSeleccionadoId] = useState(null);
  const [edicion, setEdicion] = useState(null);
  const [aviso, setAviso] = useState(null);
  const seleccionado = equipos.find((e) => e.id === seleccionadoId) ?? null;

  if (edicion) {
    const nuevo = edicion === 'nuevo';
    return (
      <FormularioEquipo
        inicial={nuevo ? equipoVacio() : { nombre: edicion.nombre, miembros: edicion.miembros.join('\n') }}
        titulo={nuevo ? 'Nuevo equipo' : `Editar: ${edicion.nombre}`}
        alCancelar={() => setEdicion(null)}
        alGuardar={async (datos) => {
          const { equipo } = nuevo ? await gestor.crearEquipo(datos) : await gestor.actualizarEquipo(edicion.id, datos);
          setSeleccionadoId(equipo.id);
          setAviso(nuevo ? `Equipo "${equipo.nombre}" creado. Su código para la Wiki Race es ${equipo.codigo}.` : `Equipo "${equipo.nombre}" guardado.`);
          setEdicion(null);
        }}
      />
    );
  }

  const borrar = async () => {
    if (!window.confirm(`¿Eliminar el equipo "${seleccionado.nombre}"? Se borran también sus notas, imágenes y partidas.`)) return;
    try {
      await gestor.eliminarEquipo(seleccionado.id);
      setAviso(`Equipo "${seleccionado.nombre}" eliminado.`);
      setSeleccionadoId(null);
    } catch (e) {
      setAviso(`No se ha podido eliminar: ${e.message}`);
    }
  };

  return (
    <div className="gp">
      <div className="gp-barra">
        <button className="win95-boton" onClick={() => { setAviso(null); setEdicion('nuevo'); }}>➕ Nuevo</button>
        <button className="win95-boton" disabled={!seleccionado} onClick={() => { setAviso(null); setEdicion(seleccionado); }}>✏️ Editar</button>
        <button className="win95-boton" disabled={!seleccionado} onClick={borrar}>🗑️ Eliminar</button>
      </div>
      {aviso && <div className="gp-aviso">{aviso}</div>}
      <div className="gp-tabla-marco">
        {equipos.length === 0 ? (
          <div className="gp-mensaje">Todavía no hay equipos.</div>
        ) : (
          <table className="gp-tabla">
            <thead>
              <tr><th>Equipo</th><th>Código</th><th>Miembros</th></tr>
            </thead>
            <tbody>
              {equipos.map((e) => (
                <tr key={e.id} className={e.id === seleccionadoId ? 'gp-fila-seleccionada' : ''} onClick={() => setSeleccionadoId(e.id)} onDoubleClick={() => setEdicion(e)}>
                  <td>{e.nombre}</td>
                  <td><code className="go-codigo">{e.codigo}</code></td>
                  <td>{e.miembros.join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div className="gp-estado">{equipos.length} equipo(s) — el código sirve para jugar la Wiki Race desde la web</div>
    </div>
  );
}

// ---------- Pruebas ----------

function FormularioPrueba({ inicial, titulo, alGuardar, alCancelar }) {
  const [campos, setCampos] = useState(inicial);
  const [buscando, setBuscando] = useState(null);
  const { errores, errorGeneral, guardando, enviar } = useEnvio(alGuardar);
  const cambiar = (campo) => (e) => setCampos({ ...campos, [campo]: e.target.value });

  const alAzar = async (campo) => {
    setBuscando(campo);
    try {
      const titulo = await articuloAleatorio();
      setCampos((c) => ({ ...c, [campo]: titulo }));
    } catch (e) {
      window.alert(e.message);
    } finally {
      setBuscando(null);
    }
  };

  const campoArticulo = (campo, etiqueta) => (
    <Campo etiqueta={etiqueta} error={errores[campo]}>
      <div className="go-articulo">
        <input className="gp-input" value={campos[campo]} onChange={cambiar(campo)} maxLength={255} placeholder="Título del artículo en es.wikipedia.org" />
        <button type="button" className="win95-boton" title="Artículo al azar" disabled={buscando !== null} onClick={() => alAzar(campo)}>
          {buscando === campo ? '⏳' : '🎲'}
        </button>
      </div>
    </Campo>
  );

  return (
    <form
      className="gp-formulario"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        const datos = { ...campos, nombre: campos.nombre.trim(), descripcion: campos.descripcion.trim(), origen: campos.origen.trim(), destino: campos.destino.trim() };
        enviar(validarPrueba(datos), datos);
      }}
    >
      <div className="gp-formulario-titulo">{titulo}</div>
      <Campo etiqueta="Nombre *" error={errores.nombre}>
        <input className="gp-input" value={campos.nombre} onChange={cambiar('nombre')} maxLength={100} autoFocus placeholder="La mejor imagen hecha con IA" />
      </Campo>
      <div className="gp-fila">
        <Campo etiqueta="Tipo" error={errores.tipo}>
          <select className="gp-input" value={campos.tipo} onChange={cambiar('tipo')}>
            {Object.entries(TIPOS_PRUEBA).map(([valor, texto]) => <option key={valor} value={valor}>{texto}</option>)}
          </select>
        </Campo>
        <Campo etiqueta="Estado" error={errores.estado}>
          <select className="gp-input" value={campos.estado} onChange={cambiar('estado')}>
            {Object.entries(ESTADOS_PRUEBA).map(([valor, texto]) => <option key={valor} value={valor}>{texto}</option>)}
          </select>
        </Campo>
      </div>
      <Campo etiqueta={campos.tipo === 'imagen' ? 'Qué tienen que hacer (el tema de la imagen)' : 'Descripción'} error={errores.descripcion}>
        <textarea className="gp-input gp-textarea" value={campos.descripcion} onChange={cambiar('descripcion')} maxLength={2000} />
      </Campo>
      {campos.tipo === 'wikirace' && (
        <div className="gp-fila">
          {campoArticulo('origen', 'Artículo de salida *')}
          {campoArticulo('destino', 'Artículo de llegada *')}
        </div>
      )}
      <div className="gp-nota-formulario">
        En preparación solo la veis vosotros. En curso se ve (y la Wiki Race se puede jugar). Al finalizarla se publican
        los resultados y suman en el ranking.
      </div>
      {errorGeneral && <div className="gp-error-general">❌ {errorGeneral}</div>}
      <div className="gp-botones">
        <button type="button" className="win95-boton" onClick={alCancelar}>Cancelar</button>
        <button type="submit" className="win95-boton" disabled={guardando}>{guardando ? 'Guardando...' : 'Guardar'}</button>
      </div>
    </form>
  );
}

const datosDePrueba = (p) => ({
  nombre: p.nombre, tipo: p.tipo, descripcion: p.descripcion, estado: p.estado, origen: p.origen ?? '', destino: p.destino ?? '',
});

function FilaImagen({ gestor, prueba, equipo, puntuacion, version, alCambiar }) {
  const notasIniciales = () => Object.fromEntries(Object.keys(CRITERIOS_IMAGEN).map((c) => [c, puntuacion?.[c] ?? '']));
  const [notas, setNotas] = useState(notasIniciales);
  const [estado, setEstado] = useState(null);
  const [errores, setErrores] = useState({});
  const tieneImagen = puntuacion?.tieneImagen ?? false;

  const guardarNotas = async () => {
    const leidas = {};
    const nuevosErrores = {};
    Object.keys(CRITERIOS_IMAGEN).forEach((c) => {
      const r = leerNota(notas[c]);
      if (r.error) nuevosErrores[c] = r.error;
      else leidas[c] = r.nota;
    });
    setErrores(nuevosErrores);
    if (Object.keys(nuevosErrores).length > 0) return;
    setEstado('Guardando...');
    try {
      await gestor.puntuar(prueba.id, equipo.id, leidas);
      setEstado('✔ Guardado');
    } catch (e) {
      setEstado(`❌ ${e.message}`);
    }
  };

  const subir = async (e) => {
    const archivo = e.target.files?.[0];
    e.target.value = '';
    if (!archivo) return;
    setEstado('Subiendo imagen...');
    try {
      await gestor.subirImagen(prueba.id, equipo.id, await imagenParaSubir(archivo));
      alCambiar();
      setEstado('✔ Imagen subida');
    } catch (error) {
      setEstado(`❌ ${error.message}`);
    }
  };

  const quitar = async () => {
    if (!window.confirm(`¿Quitar la imagen de "${equipo.nombre}"?`)) return;
    try {
      await gestor.eliminarImagen(prueba.id, equipo.id);
      setEstado('Imagen quitada');
    } catch (error) {
      setEstado(`❌ ${error.message}`);
    }
  };

  const total = Object.values(notas).reduce((suma, n) => suma + (leerNota(n).nota ?? 0), 0);

  return (
    <div className="go-fila-imagen">
      <div className="go-miniatura">
        {tieneImagen ? (
          <a href={`${gestor.urlImagen(prueba.id, equipo.id)}?v=${version}`} target="_blank" rel="noreferrer" title="Abrir en grande">
            <img src={`${gestor.urlImagen(prueba.id, equipo.id)}?v=${version}`} alt={`Imagen de ${equipo.nombre}`} />
          </a>
        ) : (
          <span>Sin imagen</span>
        )}
      </div>
      <div className="go-fila-datos">
        <div className="go-fila-titulo">
          <strong>{equipo.nombre}</strong>
          <span>Total: {total} / 30</span>
        </div>
        <div className="go-notas">
          {Object.entries(CRITERIOS_IMAGEN).map(([clave, nombre]) => (
            <label key={clave} className="go-nota">
              <span>{nombre}</span>
              <input
                className="gp-input"
                type="number"
                min={0}
                max={NOTA_MAXIMA}
                inputMode="numeric"
                value={notas[clave]}
                onChange={(e) => setNotas({ ...notas, [clave]: e.target.value })}
              />
              {errores[clave] && <span className="gp-error">{errores[clave]}</span>}
            </label>
          ))}
        </div>
        <div className="go-acciones">
          <button className="win95-boton" onClick={guardarNotas}>💾 Guardar notas</button>
          <label className="win95-boton go-subir">
            🖼️ {tieneImagen ? 'Cambiar imagen' : 'Subir imagen'}
            <input type="file" accept="image/*" onChange={subir} hidden />
          </label>
          {tieneImagen && <button className="win95-boton" onClick={quitar}>Quitar</button>}
          {estado && <span className="go-estado-fila">{estado}</span>}
        </div>
      </div>
    </div>
  );
}

function DetalleImagen({ gestor, prueba }) {
  const { equipos } = gestor.datos;
  const [version, setVersion] = useState(() => Date.now());
  const puntuaciones = Object.fromEntries((prueba.puntuaciones ?? []).map((p) => [p.equipoId, p]));
  if (equipos.length === 0) return <div className="gp-mensaje">Primero crea los equipos.</div>;
  return (
    <div className="go-lista">
      <div className="ol-nota">
        Notas de 0 a {NOTA_MAXIMA}. Solo cuentan los equipos con imagen y las tres notas puestas.
      </div>
      {equipos.map((equipo) => (
        <FilaImagen
          key={equipo.id}
          gestor={gestor}
          prueba={prueba}
          equipo={equipo}
          puntuacion={puntuaciones[equipo.id]}
          version={version}
          alCambiar={() => setVersion(Date.now())}
        />
      ))}
    </div>
  );
}

function DetalleWikiRace({ gestor, prueba }) {
  const { equipos } = gestor.datos;
  const { recargar } = gestor;
  const partidas = Object.fromEntries((prueba.partidas ?? []).map((p) => [p.equipoId, p]));
  const enCurso = prueba.estado === 'en_curso';

  // Mientras se juega, la tabla se actualiza sola
  useEffect(() => {
    if (!enCurso) return undefined;
    const intervalo = setInterval(recargar, 5000);
    return () => clearInterval(intervalo);
  }, [enCurso, recargar]);

  const reiniciar = async (equipo) => {
    if (!window.confirm(`¿Borrar la partida de "${equipo.nombre}"? Podrán volver a empezar desde cero.`)) return;
    try {
      await gestor.reiniciarPartida(prueba.id, equipo.id);
    } catch (e) {
      window.alert(e.message);
    }
  };

  return (
    <div className="go-lista">
      <div className="ol-nota">🌐 De «{prueba.origen}» a «{prueba.destino}».{enCurso && ' Se actualiza cada 5 segundos.'}</div>
      <div className="gp-tabla-marco go-tabla-partidas">
        <table className="gp-tabla">
          <thead>
            <tr><th>Equipo</th><th>Estado</th><th>Clics</th><th>Tiempo</th><th /></tr>
          </thead>
          <tbody>
            {equipos.map((equipo) => {
              const partida = partidas[equipo.id];
              return (
                <tr key={equipo.id} title={partida ? partida.ruta.join(' → ') : ''}>
                  <td>{equipo.nombre}</td>
                  <td>{!partida ? 'Sin empezar' : partida.terminada ? '🏁 Ha llegado' : `📍 ${partida.actual}`}</td>
                  <td>{partida?.clics ?? '—'}</td>
                  <td>{partida?.terminada ? formatearTiempo(partida.tiempoMs, { decimas: true }) : '—'}</td>
                  <td>{partida && <button className="gp-boton-mini" onClick={() => reiniciar(equipo)} title="Reiniciar partida">↺</button>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Clasificacion({ prueba }) {
  if (!prueba.clasificacion?.length) return null;
  return (
    <div className="ol-nota">
      Clasificación{prueba.estado !== 'finalizada' && ' (provisional, aún no es pública)'}:{' '}
      {prueba.clasificacion.map((f) => `${medalla(f.posicion)} ${f.nombre} (+${f.puntos})`).join(' · ')}
    </div>
  );
}

function DetallePrueba({ gestor, pruebaId, alVolver, alEditar }) {
  const prueba = gestor.datos.pruebas.find((p) => p.id === pruebaId);
  const [aviso, setAviso] = useState(null);
  if (!prueba) return null;

  const cambiarEstado = async (estado) => {
    setAviso(null);
    try {
      await gestor.actualizarPrueba(prueba.id, { ...datosDePrueba(prueba), estado });
      setAviso(`Ahora está: ${ESTADOS_PRUEBA[estado]}.`);
    } catch (e) {
      setAviso(`❌ ${e.message}`);
    }
  };

  return (
    <div className="gp">
      <div className="gp-barra">
        <button className="win95-boton" onClick={alVolver}>◀ Pruebas</button>
        <button className="win95-boton" onClick={alEditar}>✏️ Editar</button>
        {prueba.estado === 'preparacion' && <button className="win95-boton" onClick={() => cambiarEstado('en_curso')}>▶ Empezar</button>}
        {prueba.estado === 'en_curso' && <button className="win95-boton" onClick={() => cambiarEstado('finalizada')}>🏁 Finalizar y publicar</button>}
        {prueba.estado === 'finalizada' && <button className="win95-boton" onClick={() => cambiarEstado('en_curso')}>↩ Volver a abrir</button>}
      </div>
      <div className="go-cabecera-prueba">
        <strong>{prueba.nombre}</strong> · {TIPOS_PRUEBA[prueba.tipo]} · <span className={`ol-estado ol-estado-${prueba.estado}`}>{ESTADOS_PRUEBA[prueba.estado]}</span>
      </div>
      {aviso && <div className="gp-aviso">{aviso}</div>}
      <div className="go-detalle">
        <Clasificacion prueba={prueba} />
        {prueba.tipo === 'imagen' ? <DetalleImagen gestor={gestor} prueba={prueba} /> : <DetalleWikiRace gestor={gestor} prueba={prueba} />}
      </div>
    </div>
  );
}

function Pruebas({ gestor }) {
  const { pruebas } = gestor.datos;
  const [seleccionadaId, setSeleccionadaId] = useState(null);
  const [edicion, setEdicion] = useState(null);
  const [detalleId, setDetalleId] = useState(null);
  const [aviso, setAviso] = useState(null);
  const seleccionada = pruebas.find((p) => p.id === seleccionadaId) ?? null;

  if (edicion) {
    const nueva = edicion === 'nueva';
    return (
      <FormularioPrueba
        inicial={nueva ? pruebaVacia() : datosDePrueba(edicion)}
        titulo={nueva ? 'Nueva prueba' : `Editar: ${edicion.nombre}`}
        alCancelar={() => setEdicion(null)}
        alGuardar={async (datos) => {
          const { prueba } = nueva ? await gestor.crearPrueba(datos) : await gestor.actualizarPrueba(edicion.id, datos);
          setSeleccionadaId(prueba.id);
          setAviso(`Prueba "${prueba.nombre}" guardada.`);
          setEdicion(null);
        }}
      />
    );
  }

  if (detalleId !== null) {
    return (
      <DetallePrueba
        gestor={gestor}
        pruebaId={detalleId}
        alVolver={() => setDetalleId(null)}
        alEditar={() => {
          setEdicion(pruebas.find((p) => p.id === detalleId));
          setDetalleId(null);
        }}
      />
    );
  }

  const borrar = async () => {
    if (!window.confirm(`¿Eliminar la prueba "${seleccionada.nombre}" con todas sus notas, imágenes y partidas?`)) return;
    try {
      await gestor.eliminarPrueba(seleccionada.id);
      setAviso(`Prueba "${seleccionada.nombre}" eliminada.`);
      setSeleccionadaId(null);
    } catch (e) {
      setAviso(`No se ha podido eliminar: ${e.message}`);
    }
  };

  return (
    <div className="gp">
      <div className="gp-barra">
        <button className="win95-boton" onClick={() => { setAviso(null); setEdicion('nueva'); }}>➕ Nueva</button>
        <button className="win95-boton" disabled={!seleccionada} onClick={() => setDetalleId(seleccionada.id)}>📊 Resultados</button>
        <button className="win95-boton" disabled={!seleccionada} onClick={() => { setAviso(null); setEdicion(seleccionada); }}>✏️ Editar</button>
        <button className="win95-boton" disabled={!seleccionada} onClick={borrar}>🗑️ Eliminar</button>
      </div>
      {aviso && <div className="gp-aviso">{aviso}</div>}
      <div className="gp-tabla-marco">
        {pruebas.length === 0 ? (
          <div className="gp-mensaje">Todavía no hay pruebas.</div>
        ) : (
          <table className="gp-tabla">
            <thead>
              <tr><th>Prueba</th><th>Tipo</th><th>Estado</th></tr>
            </thead>
            <tbody>
              {pruebas.map((p) => (
                <tr key={p.id} className={p.id === seleccionadaId ? 'gp-fila-seleccionada' : ''} onClick={() => setSeleccionadaId(p.id)} onDoubleClick={() => setDetalleId(p.id)}>
                  <td>{p.nombre}</td>
                  <td>{TIPOS_PRUEBA[p.tipo]}</td>
                  <td>{ESTADOS_PRUEBA[p.estado]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div className="gp-estado">{pruebas.length} prueba(s) — doble clic para puntuar o ver la partida</div>
    </div>
  );
}

/** Interruptor para que el público vea (o no) CodeOlimpiadas en el escritorio. */
function Visibilidad({ gestor }) {
  const [guardando, setGuardando] = useState(false);
  const visibles = gestor.datos.visibles;
  const cambiar = async (e) => {
    const valor = e.target.checked;
    setGuardando(true);
    try {
      await gestor.cambiarVisibilidad(valor);
    } catch (error) {
      window.alert(error.message);
    } finally {
      setGuardando(false);
    }
  };
  return (
    <label className={`go-visibilidad ${visibles ? 'go-visibilidad-activa' : ''}`}>
      <input type="checkbox" checked={visibles} onChange={cambiar} disabled={guardando} />
      <span>
        {visibles
          ? '👁️ Visibles: todo el mundo ve CodeOlimpiadas en el escritorio'
          : '🙈 Ocultas: solo los admins ven CodeOlimpiadas. Márcalo para mostrarlas a todos'}
      </span>
    </label>
  );
}

/** Panel de control → CodeOlimpiadas. */
export default function GestorOlimpiadas() {
  const gestor = useGestorOlimpiadas();
  const [pestana, setPestana] = useState('pruebas');

  if (gestor.cargando) return <div className="gp-mensaje">⏳ Cargando...</div>;
  if (!gestor.datos) return <div className="gp-mensaje gp-error-general">❌ {gestor.error}</div>;

  return (
    <div className="go">
      <Visibilidad gestor={gestor} />
      <div className="ol-pestanas" role="tablist">
        {[['pruebas', '📋 Pruebas'], ['equipos', '👥 Equipos']].map(([id, texto]) => (
          <button key={id} role="tab" aria-selected={pestana === id} className={`ol-pestana ${pestana === id ? 'ol-pestana-activa' : ''}`} onClick={() => setPestana(id)}>
            {texto}
          </button>
        ))}
      </div>
      <div className="go-contenido">
        {pestana === 'pruebas' ? <Pruebas gestor={gestor} /> : <Equipos gestor={gestor} />}
      </div>
    </div>
  );
}
