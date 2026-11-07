import './Solitario.css';
import logoURV from '../../assets/code_urv_logo_nobg.png';
import javaLogo from '../../assets/java-logo.png';
import pythonLogo from '../../assets/python-logo.png';
import jsLogo from '../../assets/javascript-logo.png';
import cppLogo from '../../assets/cpp-logo.png';
import { LENGUAJES, aColumna, aFundacion, desdeColumna, desdeDescarte } from '../../../dominio/solitario';
import useSolitario from '../../../aplicacion/useSolitario';
import useTamanoCartas, { SOLAPE } from './useTamanoCartas';
import useModoTactil from '../../escritorio/useModoTactil';

const ESTILO_LENGUAJE = {
    'Java': { color: '#FF6B35', logo: javaLogo },
    'Python': { color: '#3776AB', logo: pythonLogo },
    'JavaScript': { color: '#F7DF1E', logo: jsLogo },
    'C++': { color: '#00599C', logo: cppLogo },
};

const colorDe = (lenguaje) => ESTILO_LENGUAJE[lenguaje]?.color ?? '#000';
const logoDe = (lenguaje) => ESTILO_LENGUAJE[lenguaje]?.logo ?? logoURV;

function CaraCarta({ carta }) {
    return (
        <>
            <div className="card-corner card-corner-top">
                <div className="card-corner-rank">{carta.rango}</div>
            </div>
            <div className="card-center">
                <img src={logoDe(carta.lenguaje)} alt={carta.lenguaje} className="card-logo" draggable="false" />
            </div>
            <div className="card-corner card-corner-bottom">
                <div className="card-corner-rank">{carta.rango}</div>
            </div>
        </>
    );
}

function DorsoCarta() {
    return <img src={logoURV} alt="CODE URV" className="card-back-logo" draggable="false" />;
}

/** Imagen que se ve al arrastrar varias cartas de una columna. */
function crearImagenArrastre(cartas, { width, height }) {
    const separacion = Math.round(height * SOLAPE);
    const contenedor = document.createElement('div');
    Object.assign(contenedor.style, {
        position: 'absolute', top: '-9999px', left: '-9999px', pointerEvents: 'none',
        width: `${width}px`, height: `${height + (cartas.length - 1) * separacion}px`,
    });

    cartas.forEach((carta, i) => {
        const div = document.createElement('div');
        div.className = 'card card-face card-drag-preview';
        Object.assign(div.style, {
            position: 'absolute', top: `${i * separacion}px`, width: `${width}px`, height: `${height}px`,
            backgroundColor: 'white', border: `3px solid ${colorDe(carta.lenguaje)}`, borderRadius: '8px',
            boxShadow: '0 4px 8px rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', overflow: 'hidden',
        });

        const rango = document.createElement('div');
        Object.assign(rango.style, {
            position: 'absolute', top: '6px', left: '8px', fontSize: `${Math.round(height * 0.17)}px`,
            fontWeight: 'bold', fontFamily: 'Arial, sans-serif',
        });
        rango.textContent = carta.rango;

        const logo = document.createElement('img');
        logo.src = logoDe(carta.lenguaje);
        logo.draggable = false;
        Object.assign(logo.style, { width: `${Math.round(width * 0.65)}px`, height: 'auto', objectFit: 'contain' });

        div.append(rango, logo);
        contenedor.appendChild(div);
    });

    document.body.appendChild(contenedor);
    setTimeout(() => contenedor.remove(), 0);
    return contenedor;
}

function FinDePartida({ resultado, movimientos, tiempo, alReiniciar }) {
    const ganada = resultado === 'ganada';
    return (
        <div className="victory-overlay">
            <div className={`victory-modal ${ganada ? '' : 'gameover-modal'}`}>
                <div className={`victory-title-bar ${ganada ? '' : 'gameover-title-bar'}`}>
                    <span>Solitario - CODE URV</span>
                </div>
                <div className="victory-content">
                    <h2>{ganada ? '🎉 ¡GANASTE! 🎉' : '😔 GAME OVER'}</h2>
                    {!ganada && <p className="gameover-message">No hay más movimientos posibles</p>}
                    <div className="victory-stats">
                        <p><strong>Movimientos:</strong> {movimientos}</p>
                        <p><strong>Tiempo:</strong> {tiempo}</p>
                    </div>
                    <div className="victory-buttons">
                        <button className="win95-button" onClick={alReiniciar}>
                            {ganada ? 'Nueva Partida' : 'Intentar de Nuevo'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Solitario() {
    const juego = useSolitario();
    const { contenedorRef, tamano } = useTamanoCartas();
    const tactil = useModoTactil(); // en móvil: tocar carta y tocar destino (arrastrar no funciona con el dedo)
    const { mazo, descarte, fundaciones, columnas, movimientos } = juego.partida;
    const { seleccion } = juego;

    const descarteSeleccionado = seleccion?.tipo === 'descarte';
    const columnaSeleccionada = (indice, posicion) =>
        seleccion?.tipo === 'columna' && seleccion.indice === indice && posicion >= seleccion.posicion;

    const alTocarCarta = (origen) => (e) => {
        e.stopPropagation();
        juego.tocarCarta(origen);
    };

    const permitirSoltar = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };
    const resaltar = (e) => {
        e.preventDefault();
        e.currentTarget.classList.add('drag-over');
    };
    const quitarResaltado = (e) => e.currentTarget.classList.remove('drag-over');

    const empezarArrastre = (e, origen, cartasArrastradas) => {
        e.stopPropagation();
        e.dataTransfer.effectAllowed = 'move';
        juego.empezarArrastre(origen);
        if (cartasArrastradas) {
            const imagen = crearImagenArrastre(cartasArrastradas, tamano);
            e.dataTransfer.setDragImage(imagen, Math.round(tamano.width / 2), Math.round(tamano.height * 0.15));
        }
    };

    if (juego.resultado) {
        return (
            <div className="solitario-container" ref={contenedorRef}>
                <FinDePartida
                    resultado={juego.resultado}
                    movimientos={movimientos}
                    tiempo={juego.tiempo}
                    alReiniciar={juego.nuevaPartida}
                />
            </div>
        );
    }

    const visiblesDescarte = descarte.slice(-3);

    return (
        <div className="solitario-container" ref={contenedorRef}>
            <div className="solitario-header">
                <div className="solitario-stats">
                    <span>Movimientos: {movimientos}</span>
                    <span>Tiempo: {juego.tiempo}</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="solitario-reset" onClick={juego.nuevaPartida}>Nueva Partida</button>
                    <button className="solitario-reset" onClick={juego.rendirse}>Rendirse</button>
                </div>
            </div>

            <div className="solitario-board">
                <div className="solitario-top">
                    {/* Mazo */}
                    <div className="solitario-pile" onClick={juego.robar}>
                        {mazo.length > 0 ? (
                            <div className="card card-back card-in-pile"><DorsoCarta /></div>
                        ) : (
                            <div className="card card-empty card-in-pile"><span>↻</span></div>
                        )}
                        <span className="pile-count">{mazo.length}</span>
                    </div>

                    {/* Descarte: se ven las 3 últimas, solo se mueve la de arriba */}
                    <div className="solitario-waste" style={{ width: 'var(--waste-width)' }}>
                        {visiblesDescarte.map((carta, i) => {
                            const esLaDeArriba = i === visiblesDescarte.length - 1;
                            return (
                                <div
                                    key={carta.id}
                                    className={`card card-face card-in-waste ${esLaDeArriba && descarteSeleccionado ? 'seleccionada' : ''}`}
                                    data-language={carta.lenguaje}
                                    style={{
                                        borderColor: colorDe(carta.lenguaje),
                                        left: `${Math.round(i * tamano.width * 0.35)}px`,
                                        zIndex: i,
                                        pointerEvents: esLaDeArriba ? 'auto' : 'none',
                                    }}
                                    draggable={!tactil && esLaDeArriba}
                                    onDragStart={(e) => esLaDeArriba && empezarArrastre(e, desdeDescarte())}
                                    onDoubleClick={tactil ? undefined : () => esLaDeArriba && juego.moverAutomatico(desdeDescarte())}
                                    onClick={tactil && esLaDeArriba ? alTocarCarta(desdeDescarte()) : undefined}
                                >
                                    <CaraCarta carta={carta} />
                                </div>
                            );
                        })}
                    </div>

                    {/* Fundaciones: una por lenguaje */}
                    <div className="solitario-foundations">
                        {fundaciones.map((fundacion, i) => {
                            const arriba = fundacion[fundacion.length - 1];
                            return (
                                <div
                                    key={LENGUAJES[i]}
                                    className="solitario-pile"
                                    onClick={tactil ? () => juego.tocarDestino(aFundacion(i)) : undefined}
                                    onDragOver={permitirSoltar}
                                    onDragEnter={resaltar}
                                    onDragLeave={quitarResaltado}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        quitarResaltado(e);
                                        juego.soltarEnFundacion(i);
                                    }}
                                >
                                    {arriba ? (
                                        <div className="card card-face card-in-pile" data-language={arriba.lenguaje} style={{ borderColor: colorDe(arriba.lenguaje) }}>
                                            <CaraCarta carta={arriba} />
                                        </div>
                                    ) : (
                                        <div className="card card-empty card-in-pile">
                                            <img src={logoDe(LENGUAJES[i])} alt={LENGUAJES[i]} className="foundation-placeholder-logo" draggable="false" />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Columnas */}
                <div className="solitario-tableaus">
                    {columnas.map((columna, indice) => (
                        <div
                            key={indice}
                            className="solitario-tableau"
                            onClick={tactil ? () => juego.tocarDestino(aColumna(indice)) : undefined}
                            onDragOver={permitirSoltar}
                            onDragEnter={resaltar}
                            onDragLeave={quitarResaltado}
                            onDrop={(e) => {
                                e.preventDefault();
                                quitarResaltado(e);
                                juego.soltarEnColumna(indice);
                            }}
                        >
                            {columna.length === 0 ? (
                                <div className="card card-empty card-in-tableau" />
                            ) : (
                                columna.map((carta, posicion) => (
                                    <div
                                        key={carta.id}
                                        className={`card card-in-tableau ${carta.bocaArriba ? 'card-face' : 'card-back'} ${columnaSeleccionada(indice, posicion) ? 'seleccionada' : ''}`}
                                        data-language={carta.lenguaje}
                                        style={{
                                            borderColor: carta.bocaArriba ? colorDe(carta.lenguaje) : '#000',
                                            top: `${Math.round(posicion * tamano.height * SOLAPE)}px`,
                                            zIndex: posicion,
                                            cursor: carta.bocaArriba ? 'grab' : 'default',
                                            pointerEvents: carta.bocaArriba ? 'auto' : 'none',
                                        }}
                                        draggable={!tactil && carta.bocaArriba}
                                        onDragStart={(e) =>
                                            carta.bocaArriba &&
                                            empezarArrastre(e, desdeColumna(indice, posicion), columna.slice(posicion))
                                        }
                                        onDoubleClick={tactil ? undefined : () => carta.bocaArriba && juego.moverAutomatico(desdeColumna(indice, posicion))}
                                        onClick={tactil && carta.bocaArriba ? alTocarCarta(desdeColumna(indice, posicion)) : undefined}
                                    >
                                        {carta.bocaArriba ? <CaraCarta carta={carta} /> : <DorsoCarta />}
                                    </div>
                                ))
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default Solitario;
