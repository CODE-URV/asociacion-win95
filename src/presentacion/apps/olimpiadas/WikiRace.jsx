import { useEffect, useMemo, useRef, useState } from 'react';
import { useWikiRace } from '../../../aplicacion/useOlimpiadas';
import { articuloDesdeEnlace, formatearTiempo } from '../../../dominio/olimpiadas';

/** Quita del HTML de Wikipedia lo que no debe ejecutarse ni salir de la ventana. */
function limpiarHtml(html) {
  const documento = new DOMParser().parseFromString(html, 'text/html');
  documento.querySelectorAll('script, iframe, object, embed, form, link, meta, .mw-editsection').forEach((n) => n.remove());
  documento.querySelectorAll('*').forEach((nodo) => {
    [...nodo.attributes].forEach((atributo) => {
      if (atributo.name.startsWith('on') || (atributo.name === 'href' && /^\s*javascript:/i.test(atributo.value))) {
        nodo.removeAttribute(atributo.name);
      }
    });
  });
  documento.querySelectorAll('img').forEach((img) => img.setAttribute('loading', 'lazy'));
  return documento.body.innerHTML;
}

function Cronometro({ estado, recibidoEn }) {
  const [ahora, setAhora] = useState(() => Date.now());
  const terminada = estado.partida.terminada;
  useEffect(() => {
    if (terminada) return undefined;
    const intervalo = setInterval(() => setAhora(Date.now()), 250);
    return () => clearInterval(intervalo);
  }, [terminada]);
  const ms = terminada ? estado.partida.tiempoMs : estado.transcurridoMs + Math.max(0, ahora - recibidoEn);
  return <span className="ol-crono">⏱ {formatearTiempo(ms)}</span>;
}

function EntrarConCodigo({ prueba, alEntrar, ocupado, error, codigoInicial }) {
  const [codigo, setCodigo] = useState(codigoInicial);
  return (
    <form
      className="ol-codigo"
      onSubmit={(e) => {
        e.preventDefault();
        if (codigo.trim()) alEntrar(codigo);
      }}
    >
      <div className="ol-codigo-icono">🌐</div>
      <h3>{prueba.nombre}</h3>
      <p>
        Tenéis que llegar de un artículo de Wikipedia a otro <strong>solo con los enlaces</strong> del propio
        artículo. Gana quien llegue antes; si empatáis, quien haga menos clics. No se puede volver atrás
        y no se puede usar Ctrl+F.
      </p>
      <p>El cronómetro empieza en cuanto entréis con el código de vuestro equipo.</p>
      <label className="ol-codigo-campo">
        Código del equipo
        <input
          className="win95-input"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value.toUpperCase())}
          maxLength={6}
          autoComplete="off"
          autoCapitalize="characters"
          placeholder="ABC234"
          autoFocus
        />
      </label>
      {error && <div className="ol-error">❌ {error}</div>}
      <button type="submit" className="win95-boton" disabled={ocupado || codigo.trim().length !== 6}>
        {ocupado ? 'Entrando...' : '▶ Empezar'}
      </button>
    </form>
  );
}

function Meta({ estado }) {
  const { partida, prueba, equipo } = estado;
  return (
    <div className="ol-meta">
      <div className="ol-meta-icono">🏁</div>
      <h3>¡{equipo.nombre} ha llegado a «{prueba.destino}»!</h3>
      <div className="ol-meta-datos">
        <div><strong>{formatearTiempo(partida.tiempoMs, { decimas: true })}</strong><span>tiempo</span></div>
        <div><strong>{partida.clics}</strong><span>clics</span></div>
      </div>
      <ol className="ol-ruta">
        {partida.ruta.map((paso, i) => <li key={`${i}-${paso}`}>{paso}</li>)}
      </ol>
      <p>Los resultados se publican cuando termine la prueba.</p>
    </div>
  );
}

/** La Wiki Race se juega aquí dentro: los enlaces no abren Wikipedia, avanzan la partida. */
export default function WikiRace({ prueba, alVolver }) {
  const juego = useWikiRace(prueba.id);
  const { estado, articulo, ocupado, error, aviso } = juego;
  const marco = useRef(null);
  const html = useMemo(() => (articulo ? limpiarHtml(articulo.html) : ''), [articulo]);

  // El artículo se pinta a mano y React no vuelve a tocarlo. Con dangerouslySetInnerHTML,
  // al pulsar un enlace la ventana se enfoca (mousedown), React volvía a poner el HTML y el
  // enlace pulsado desaparecía antes del mouseup: el navegador no llegaba a lanzar el clic.
  const terminada = estado?.partida.terminada ?? false;
  useEffect(() => {
    if (!marco.current) return;
    marco.current.innerHTML = html;
    marco.current.scrollTo(0, 0); // cada artículo nuevo se lee desde arriba
  }, [html, terminada]);

  // Que el aviso de "ese enlace no cuenta" no se quede para siempre
  const { setAviso } = juego;

  // Sin buscar en la página mientras se juega (Ctrl+F, Cmd+F, F3, Ctrl+G)
  const jugando = Boolean(estado) && !terminada;
  useEffect(() => {
    if (!jugando) return undefined;
    const alPulsar = (e) => {
      const tecla = e.key.toLowerCase();
      const buscar = ((e.ctrlKey || e.metaKey) && (tecla === 'f' || tecla === 'g')) || e.key === 'F3';
      if (buscar) {
        e.preventDefault();
        e.stopPropagation();
        setAviso('Buscar en la página (Ctrl+F) no está permitido en la Wiki Race.');
      }
    };
    window.addEventListener('keydown', alPulsar, true);
    return () => window.removeEventListener('keydown', alPulsar, true);
  }, [jugando, setAviso]);
  useEffect(() => {
    if (!aviso) return undefined;
    const t = setTimeout(() => setAviso(null), 4000);
    return () => clearTimeout(t);
  }, [aviso, setAviso]);

  const alHacerClic = (e) => {
    const enlace = e.target.closest('a');
    if (!enlace) return;
    const href = enlace.getAttribute('href') || '';
    e.preventDefault();
    if (href.startsWith('#')) {
      // Notas y referencias: dentro del mismo artículo
      const destino = marco.current?.querySelector(`[id="${CSS.escape(decodeURIComponent(href.slice(1)))}"]`);
      destino?.scrollIntoView({ block: 'center' });
      return;
    }
    const titulo = articuloDesdeEnlace(href);
    if (!titulo) {
      setAviso('Ese enlace no lleva a un artículo: no cuenta.');
      return;
    }
    juego.irA(titulo);
  };

  if (!estado) {
    return (
      <div className="ol-wiki">
        <div className="ol-barra">
          <button className="win95-boton" onClick={alVolver}>◀ Volver</button>
        </div>
        <EntrarConCodigo
          prueba={prueba}
          alEntrar={juego.empezar}
          ocupado={ocupado}
          error={error}
          codigoInicial={juego.codigo}
        />
      </div>
    );
  }

  const { partida } = estado;
  return (
    <div className="ol-wiki">
      <div className="ol-barra">
        <button className="win95-boton" onClick={alVolver} title="La partida sigue: el tiempo no se para">◀</button>
        <span className="ol-equipo">👥 {estado.equipo.nombre}</span>
        <span className="ol-objetivo">🎯 {estado.prueba.destino}</span>
        <span className="ol-clics">🖱️ {partida.clics}</span>
        <Cronometro estado={estado} recibidoEn={juego.recibidoEn} />
      </div>

      {partida.terminada ? (
        <Meta estado={estado} />
      ) : (
        <>
          <div className="ol-barra ol-barra-articulo">
            <span className="ol-actual">📍 {partida.actual}</span>
            {ocupado && <span className="ol-cargando">⏳</span>}
          </div>
          {aviso && <div className="ol-aviso">⚠️ {aviso}</div>}
          {error && (
            <div className="ol-error ol-error-barra">
              ❌ {error} <button className="win95-boton" onClick={juego.reintentar}>Reintentar</button>
            </div>
          )}
          <div
            ref={marco}
            className={`ol-articulo ${ocupado ? 'ol-articulo-ocupado' : ''}`}
            onClick={alHacerClic}
          />
        </>
      )}
    </div>
  );
}
