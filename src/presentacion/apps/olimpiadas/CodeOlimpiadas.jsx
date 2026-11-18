import { useState } from 'react';
import './CodeOlimpiadas.css';
import { useOlimpiadas } from '../../../aplicacion/useOlimpiadas';
import { CRITERIOS_IMAGEN, ESTADOS_PRUEBA, TIPOS_PRUEBA, formatearTiempo, medalla } from '../../../dominio/olimpiadas';
import { urlImagen } from '../../../infraestructura/olimpiadasApi';
import WikiRace from './WikiRace';

function Ranking({ datos }) {
  const { ranking, equipos, pruebas } = datos;
  const finalizadas = pruebas.filter((p) => p.estado === 'finalizada').length;
  if (equipos.length === 0) {
    return <div className="ol-vacio">Todavía no hay equipos. ¡Pronto empiezan las CodeOlimpiadas!</div>;
  }
  const miembros = Object.fromEntries(equipos.map((e) => [e.id, e.miembros]));
  return (
    <div className="ol-panel">
      <div className="ol-marco">
        <table className="ol-tabla">
          <thead>
            <tr>
              <th className="ol-col-pos">#</th>
              <th>Equipo</th>
              <th className="ol-col-num">Puntos</th>
            </tr>
          </thead>
          <tbody>
            {ranking.map((fila) => (
              <tr key={fila.equipoId} className={fila.posicion <= 3 && fila.puntos > 0 ? 'ol-podio' : ''}>
                <td className="ol-col-pos">{fila.puntos > 0 ? medalla(fila.posicion) : '—'}</td>
                <td>
                  <strong>{fila.nombre}</strong>
                  {miembros[fila.equipoId]?.length > 0 && <div className="ol-miembros">{miembros[fila.equipoId].join(', ')}</div>}
                </td>
                <td className="ol-col-num"><strong>{fila.puntos}</strong></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="ol-nota">
        {finalizadas === 0
          ? 'Aún no ha terminado ninguna prueba.'
          : `${finalizadas} prueba(s) terminada(s).`}{' '}
        En cada prueba el 1º suma {datos.puntosPorPosicion.slice(0, 3).join(', ')}… puntos según la posición.
      </div>
    </div>
  );
}

function DetalleResultado({ prueba, fila }) {
  const d = fila.detalle;
  if (prueba.tipo === 'wikirace') {
    return (
      <span title={d.ruta.join(' → ')}>
        ⏱ {formatearTiempo(d.tiempoMs, { decimas: true })} · 🖱️ {d.clics} clics
      </span>
    );
  }
  return <span>{d.total} / 30</span>;
}

function Resultados({ prueba }) {
  const [ampliada, setAmpliada] = useState(null);
  if (!prueba.clasificacion?.length) {
    return <div className="ol-vacio">No hay resultados en esta prueba.</div>;
  }
  return (
    <>
      {prueba.tipo === 'wikirace' && (
        <div className="ol-nota">🌐 De «{prueba.origen}» a «{prueba.destino}». Pasa el ratón por el tiempo para ver la ruta.</div>
      )}
      {prueba.tipo === 'imagen' ? (
        <div className="ol-galeria">
          {prueba.clasificacion.map((fila) => (
            <figure key={fila.equipoId} className="ol-obra">
              <button className="ol-obra-imagen" onClick={() => setAmpliada(fila)} title="Ver en grande">
                <img src={urlImagen(prueba.id, fila.equipoId)} alt={`Imagen de ${fila.nombre}`} loading="lazy" />
              </button>
              <figcaption>
                <div className="ol-obra-titulo">{medalla(fila.posicion)} {fila.nombre} <span>+{fila.puntos}</span></div>
                {Object.entries(CRITERIOS_IMAGEN).map(([clave, nombre]) => (
                  <div key={clave} className="ol-obra-nota">{nombre}: <strong>{fila.detalle[clave]}</strong></div>
                ))}
                <div className="ol-obra-nota">Total: <strong>{fila.detalle.total} / 30</strong></div>
              </figcaption>
            </figure>
          ))}
        </div>
      ) : (
        <div className="ol-marco">
          <table className="ol-tabla">
            <thead>
              <tr>
                <th className="ol-col-pos">#</th>
                <th>Equipo</th>
                <th>Resultado</th>
                <th className="ol-col-num">Puntos</th>
              </tr>
            </thead>
            <tbody>
              {prueba.clasificacion.map((fila) => (
                <tr key={fila.equipoId}>
                  <td className="ol-col-pos">{medalla(fila.posicion)}</td>
                  <td>{fila.nombre}</td>
                  <td><DetalleResultado prueba={prueba} fila={fila} /></td>
                  <td className="ol-col-num">+{fila.puntos}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {ampliada && (
        <button className="ol-visor" onClick={() => setAmpliada(null)} title="Cerrar">
          <img src={urlImagen(prueba.id, ampliada.equipoId)} alt={`Imagen de ${ampliada.nombre}`} />
          <span>{ampliada.nombre} — {ampliada.detalle.total} / 30 · toca para cerrar</span>
        </button>
      )}
    </>
  );
}

function Pruebas({ datos, alJugar }) {
  const [abierta, setAbierta] = useState(null);
  if (datos.pruebas.length === 0) {
    return <div className="ol-vacio">Todavía no hay pruebas. Atentos…</div>;
  }
  return (
    <div className="ol-panel ol-pruebas">
      {datos.pruebas.map((prueba) => {
        const enCurso = prueba.estado === 'en_curso';
        const desplegada = abierta === prueba.id;
        return (
          <div key={prueba.id} className="ol-prueba">
            <div className="ol-prueba-cabecera">
              <span className="ol-tipo">{prueba.tipo === 'wikirace' ? '🌐' : '🎨'} {TIPOS_PRUEBA[prueba.tipo]}</span>
              <span className={`ol-estado ol-estado-${prueba.estado}`}>{ESTADOS_PRUEBA[prueba.estado]}</span>
            </div>
            <div className="ol-prueba-nombre">{prueba.nombre}</div>
            {prueba.descripcion && <p className="ol-prueba-descripcion">{prueba.descripcion}</p>}
            {prueba.tipo === 'imagen' && (
              <div className="ol-nota">Criterios: {Object.values(CRITERIOS_IMAGEN).join(', ')} (de 0 a 10 cada uno).</div>
            )}
            {enCurso && prueba.tipo === 'wikirace' && (
              <div className="ol-prueba-acciones">
                <button className="win95-boton ol-boton-jugar" onClick={() => alJugar(prueba)}>▶ Jugar</button>
                <span>{prueba.llegados} equipo(s) han llegado · {prueba.jugando} jugando</span>
              </div>
            )}
            {prueba.estado === 'finalizada' && (
              <>
                <button className="win95-boton" onClick={() => setAbierta(desplegada ? null : prueba.id)}>
                  {desplegada ? '▲ Ocultar resultados' : '▼ Ver resultados'}
                </button>
                {desplegada && <Resultados prueba={prueba} />}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function CodeOlimpiadas() {
  const { datos, cargando, error } = useOlimpiadas();
  const [pestana, setPestana] = useState('ranking');
  const [jugando, setJugando] = useState(null);

  if (jugando) {
    return (
      <div className="ol">
        <WikiRace prueba={jugando} alVolver={() => setJugando(null)} />
      </div>
    );
  }

  return (
    <div className="ol">
      <div className="ol-cabecera">🏅 CODEOLIMPIADAS - CODE URV</div>
      {datos && !datos.visibles && (
        <div className="ol-oculto">🙈 Ocultas al público: solo las veis los admins. Actívalas en Panel de control → CodeOlimpiadas.</div>
      )}
      <div className="ol-pestanas" role="tablist">
        {[['ranking', '🏆 Ranking'], ['pruebas', '📋 Pruebas']].map(([id, texto]) => (
          <button key={id} role="tab" aria-selected={pestana === id} className={`ol-pestana ${pestana === id ? 'ol-pestana-activa' : ''}`} onClick={() => setPestana(id)}>
            {texto}
          </button>
        ))}
      </div>
      <div className="ol-contenido">
        {cargando && <div className="ol-vacio">⏳ Cargando...</div>}
        {error && !datos && <div className="ol-vacio ol-error">❌ {error}</div>}
        {datos && pestana === 'ranking' && <Ranking datos={datos} />}
        {datos && pestana === 'pruebas' && <Pruebas datos={datos} alJugar={setJugando} />}
      </div>
    </div>
  );
}
