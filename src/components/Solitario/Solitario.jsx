import React, { useState, useEffect, useRef } from 'react';
import './Solitario.css';
import logoURV from '../../assets/code_urv_logo_nobg.png';
import javaLogo from '../../assets/java-logo.png';
import pythonLogo from '../../assets/python-logo.png';
import jsLogo from '../../assets/javascript-logo.png';
import cppLogo from '../../assets/cpp-logo.png';

function Solitario() {
    // Estados del juego (sin cambios de lógica)
    const [deck, setDeck] = useState([]);
    const [stock, setStock] = useState([]);
    const [waste, setWaste] = useState([]);
    const [foundations, setFoundations] = useState([[], [], [], []]);
    const [tableaus, setTableaus] = useState([[], [], [], [], [], [], []]);
    const [selectedCard, setSelectedCard] = useState(null);
    const [draggedCard, setDraggedCard] = useState(null);
    const [moves, setMoves] = useState(0);
    const [time, setTime] = useState(0);
    const [isWinner, setIsWinner] = useState(false);
    const [isGameOver, setIsGameOver] = useState(false);
    const [isTimerRunning, setIsTimerRunning] = useState(true);

    // Responsive: tamaño dinámico de carta (también usado por drag-preview)
    const [cardSize, setCardSize] = useState({ width: 90, height: 130 });
    const containerRef = useRef(null);

    // Parámetros de diseño responsive (ajústalos si quieres)
    const columns = 7;
    const columnGap = 12; // debe coincidir con .solitario-tableaus gap en CSS
    const containerPaddingHorizontal = 32; // 16px padding left + right en .solitario-container
    const minCardWidth = 48;  // ancho mínimo en px (se puede bajar)
    const maxCardWidth = 110; // ancho máximo en px (se puede subir)
    const aspectRatio = 130 / 90; // proporción altura/ancho original

    // Inicialización del juego (sin cambios)
    useEffect(() => {
        initializeGame();
    }, []);

    useEffect(() => {
        if (!isTimerRunning) return;
        const timer = setInterval(() => setTime(t => t + 1), 1000);
        return () => clearInterval(timer);
    }, [isTimerRunning]);

    useEffect(() => {
        const totalCards = foundations.reduce((sum, f) => sum + f.length, 0);
        if (totalCards === 52 && !isWinner) {
            setIsWinner(true);
            setIsTimerRunning(false);
        }
    }, [foundations]);

    useEffect(() => {
        if (isWinner || isGameOver) return;
        const checkTimeout = setTimeout(() => {
            if (!hasAvailableMoves()) {
                setIsGameOver(true);
                setIsTimerRunning(false);
            }
        }, 500);
        return () => clearTimeout(checkTimeout);
    }, [stock, waste, foundations, tableaus, moves]);

    // ========================
    // Responsive: calcular tamaño de carta según ancho disponible
    // ========================
    useEffect(() => {
        const updateCardVars = () => {
            const container = containerRef.current;
            if (!container) return;

            // ancho disponible real dentro del contenedor (restamos padding)
            const containerWidth = Math.max(0, container.clientWidth - containerPaddingHorizontal);

            // ancho disponible para las columnas (tabla de 7 columnas)
            const totalGaps = (columns - 1) * columnGap;
            const boardAvailable = Math.max(0, containerWidth - totalGaps);

            // ancho por columna (ideal)
            let columnWidth = Math.floor(boardAvailable / columns);

            // clamp entre min y max
            let cardW = Math.max(minCardWidth, Math.min(maxCardWidth, columnWidth));

            // si el container es muy estrecho y queda espacio negativo, reducir más:
            if (cardW < minCardWidth) cardW = minCardWidth;

            const cardH = Math.round(cardW * aspectRatio);

            // Waste area width (para contener hasta 3 cartas con overlap)
            const wasteWidth = Math.round(cardW * 2.4);

            // setear variables CSS en el contenedor para que el CSS responda
            container.style.setProperty('--card-width', `${cardW}px`);
            container.style.setProperty('--card-height', `${cardH}px`);
            container.style.setProperty('--waste-width', `${wasteWidth}px`);
            container.style.setProperty('--card-logo-max', `${Math.round(cardW * 0.72)}px`);

            // actualizar estado para que las funciones JS (drag-preview, offsets) usen el tamaño
            setCardSize({ width: cardW, height: cardH });
        };

        // run immediately
        updateCardVars();

        // observar cambios de tamaño del contenedor
        let ro;
        if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
            ro = new ResizeObserver(updateCardVars);
            ro.observe(containerRef.current);
        } else {
            window.addEventListener('resize', updateCardVars);
        }

        return () => {
            if (ro && containerRef.current) ro.disconnect();
            else window.removeEventListener('resize', updateCardVars);
        };
    }, [containerRef, columns]);

    // ========== El resto de funciones del juego (sin cambiar lógica) ==========
    const initializeGame = () => {
        const languages = ['Java', 'Python', 'JavaScript', 'C++'];
        const suits = ['♠️', '♥️', '♦️', '♣️'];
        const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

        let newDeck = [];
        languages.forEach((lang, suitIdx) => {
            ranks.forEach((rank, rankIdx) => {
                newDeck.push({
                    id: `${lang}-${rank}-${Math.random().toString(36).slice(2, 9)}`,
                    language: lang,
                    suit: suits[suitIdx],
                    rank: rank,
                    rankValue: rankIdx + 1,
                    faceUp: false
                });
            });
        });

        newDeck = newDeck.sort(() => Math.random() - 0.5);

        let newTableaus = [[], [], [], [], [], [], []];
        let deckIdx = 0;
        for (let i = 0; i < 7; i++) {
            for (let j = i; j < 7; j++) {
                newTableaus[j].push({
                    ...newDeck[deckIdx],
                    faceUp: i === j
                });
                deckIdx++;
            }
        }

        setTableaus(newTableaus);
        setStock(newDeck.slice(deckIdx).map(card => ({ ...card, faceUp: false })));
        setWaste([]);
        setFoundations([[], [], [], []]);
        setSelectedCard(null);
        setDraggedCard(null);
        setMoves(0);
        setTime(0);
        setIsWinner(false);
        setIsGameOver(false);
        setIsTimerRunning(true);
    };

    const getLanguageColor = (language) => {
        const colors = {
            'Java': '#FF6B35',
            'Python': '#3776AB',
            'JavaScript': '#F7DF1E',
            'C++': '#00599C'
        };
        return colors[language] || '#000';
    };

    const getLanguageLogo = (language) => {
        const logos = {
            'Java': javaLogo,
            'Python': pythonLogo,
            'JavaScript': jsLogo,
            'C++': cppLogo
        };
        return logos[language] || logoURV;
    };

    const getFoundationPlaceholder = (idx) => {
        const logos = [javaLogo, pythonLogo, jsLogo, cppLogo];
        return logos[idx];
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // STOCK
    const handleStockClick = () => {
        if (stock.length === 0) {
            if (waste.length > 0) {
                setStock(waste.map(card => ({ ...card, faceUp: false })).reverse());
                setWaste([]);
                setMoves(moves + 1);
            }
        } else {
            const cardsToMove = Math.min(3, stock.length);
            const newWaste = [...waste];
            const newStock = [...stock];

            for (let i = 0; i < cardsToMove; i++) {
                const card = newStock.pop();
                newWaste.push({ ...card, faceUp: true });
            }

            setStock(newStock);
            setWaste(newWaste);
            setMoves(moves + 1);
        }
    };

    // VALIDACIONES
    const canMoveToFoundation = (card, foundation, foundationIdx) => {
        const foundationLanguages = ['Java', 'Python', 'JavaScript', 'C++'];
        const expectedLanguage = foundationLanguages[foundationIdx];
        if (card.language !== expectedLanguage) {
            return false;
        }
        if (foundation.length === 0) {
            return card.rank === 'A';
        }
        const topCard = foundation[foundation.length - 1];
        return card.language === topCard.language && card.rankValue === topCard.rankValue + 1;
    };

    const canMoveToTableau = (card, tableau) => {
        if (tableau.length === 0) {
            return card.rank === 'K';
        }
        let topCard = null;
        for (let i = tableau.length - 1; i >= 0; i--) {
            if (tableau[i].faceUp) {
                topCard = tableau[i];
                break;
            }
        }
        if (!topCard) return false;
        const isDifferentLanguage = card.language !== topCard.language;
        const isDescending = card.rankValue === topCard.rankValue - 1;
        return isDifferentLanguage && isDescending;
    };

    const tryAutoMoveToFoundation = (card, source, sourceIdx, cardIdx) => {
        if (source === 'tableau') {
            const sourceTableau = tableaus[sourceIdx];
            if (cardIdx !== sourceTableau.length - 1) {
                return false;
            }
        }

        const foundationLanguages = ['Java', 'Python', 'JavaScript', 'C++'];
        const foundationIdx = foundationLanguages.indexOf(card.language);
        if (foundationIdx === -1) return false;

        if (canMoveToFoundation(card, foundations[foundationIdx], foundationIdx)) {
            if (source === 'waste') {
                setWaste(waste.slice(0, -1));
            } else if (source === 'tableau') {
                const newTableaus = [...tableaus];
                newTableaus[sourceIdx] = newTableaus[sourceIdx].slice(0, -1);
                if (newTableaus[sourceIdx].length > 0) {
                    const lastCard = newTableaus[sourceIdx][newTableaus[sourceIdx].length - 1];
                    if (!lastCard.faceUp) {
                        lastCard.faceUp = true;
                    }
                }
                setTableaus(newTableaus);
            }
            const newFoundations = [...foundations];
            newFoundations[foundationIdx] = [...newFoundations[foundationIdx], card];
            setFoundations(newFoundations);
            setMoves(moves + 1);
            return true;
        }
        return false;
    };

    const hasAvailableMoves = () => {
        if (stock.length > 0) return true;
        if (waste.length > 0 && stock.length === 0) return true;

        if (waste.length > 0) {
            const wasteCard = waste[waste.length - 1];
            for (let i = 0; i < foundations.length; i++) {
                if (canMoveToFoundation(wasteCard, foundations[i], i)) return true;
            }
            for (let tableau of tableaus) {
                if (canMoveToTableau(wasteCard, tableau)) return true;
            }
        }

        for (let i = 0; i < tableaus.length; i++) {
            const tableau = tableaus[i];
            if (tableau.length === 0) continue;
            for (let j = 0; j < tableau.length; j++) {
                const card = tableau[j];
                if (!card.faceUp) continue;
                if (j === tableau.length - 1) {
                    for (let k = 0; k < foundations.length; k++) {
                        if (canMoveToFoundation(card, foundations[k], k)) return true;
                    }
                }
                for (let k = 0; k < tableaus.length; k++) {
                    if (i === k) continue;
                    if (canMoveToTableau(card, tableaus[k])) return true;
                }
            }
        }
        return false;
    };

    // RENDIRSE
    const handleSurrender = () => {
        setIsGameOver(true);
        setIsTimerRunning(false);
    };

    // DRAG & DROP (uso cardSize calculado arriba)
    const handleCardDragStart = (e, card, source, sourceIdx, cardIdx) => {
        e.stopPropagation();
        if (!card.faceUp) return;

        setDraggedCard({ card, source, sourceIdx, cardIdx });
        e.dataTransfer.effectAllowed = 'move';

        const { width: cardW, height: cardH } = cardSize;

        if (source === 'tableau') {
            const sourceTableau = tableaus[sourceIdx];
            const cardsToMove = sourceTableau.slice(cardIdx);

            if (cardsToMove.length > 0) {
                const dragPreview = document.createElement('div');
                dragPreview.style.position = 'absolute';
                dragPreview.style.top = '-9999px';
                dragPreview.style.left = '-9999px';
                dragPreview.style.pointerEvents = 'none';
                dragPreview.style.width = `${cardW}px`;

                cardsToMove.forEach((c, idx) => {
                    const cardDiv = document.createElement('div');
                    cardDiv.className = 'card card-face card-drag-preview';
                    cardDiv.style.position = 'absolute';
                    cardDiv.style.top = `${idx * Math.round(cardH * 0.22)}px`;
                    cardDiv.style.width = `${cardW}px`;
                    cardDiv.style.height = `${cardH}px`;
                    cardDiv.style.backgroundColor = 'white';
                    cardDiv.style.border = `3px solid ${getLanguageColor(c.language)}`;
                    cardDiv.style.borderRadius = '8px';
                    cardDiv.style.boxShadow = '0 4px 8px rgba(0,0,0,0.4)';
                    cardDiv.style.display = 'flex';
                    cardDiv.style.alignItems = 'center';
                    cardDiv.style.justifyContent = 'center';
                    cardDiv.style.overflow = 'hidden';

                    const logo = document.createElement('img');
                    logo.src = getLanguageLogo(c.language);
                    logo.style.width = `${Math.round(cardW * 0.65)}px`;
                    logo.style.height = 'auto';
                    logo.style.objectFit = 'contain';
                    logo.draggable = false;

                    const rankTop = document.createElement('div');
                    rankTop.style.position = 'absolute';
                    rankTop.style.top = '6px';
                    rankTop.style.left = '8px';
                    rankTop.style.fontSize = `${Math.round(cardH * 0.17)}px`;
                    rankTop.style.fontWeight = 'bold';
                    rankTop.style.fontFamily = 'Arial, sans-serif';
                    rankTop.textContent = c.rank;

                    cardDiv.appendChild(rankTop);
                    cardDiv.appendChild(logo);
                    dragPreview.appendChild(cardDiv);
                });

                const totalHeight = cardH + (cardsToMove.length - 1) * Math.round(cardH * 0.22);
                dragPreview.style.height = `${totalHeight}px`;

                document.body.appendChild(dragPreview);
                e.dataTransfer.setDragImage(dragPreview, Math.round(cardW / 2), Math.round(cardH * 0.15));

                setTimeout(() => {
                    if (dragPreview.parentNode) document.body.removeChild(dragPreview);
                }, 0);
            }
        }
    };

    const handleCardDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleTableauDragEnter = (e, targetIdx) => {
        e.preventDefault();
        e.currentTarget.classList.add('drag-over');
    };

    const handleTableauDragLeave = (e) => {
        e.currentTarget.classList.remove('drag-over');
    };

    const handleCardDoubleClick = (card, source, sourceIdx, cardIdx) => {
        if (!card.faceUp) return;
        tryAutoMoveToFoundation(card, source, sourceIdx, cardIdx);
    };

    const handleFoundationDrop = (e, foundationIdx) => {
        e.preventDefault();
        if (!draggedCard) return;
        const { card, source, sourceIdx, cardIdx } = draggedCard;

        if (source === 'tableau') {
            const sourceTableau = tableaus[sourceIdx];
            if (cardIdx !== sourceTableau.length - 1) {
                setDraggedCard(null);
                return;
            }
        }

        if (canMoveToFoundation(card, foundations[foundationIdx], foundationIdx)) {
            if (source === 'waste') {
                setWaste(waste.slice(0, -1));
            } else if (source === 'tableau') {
                const newTableaus = [...tableaus];
                newTableaus[sourceIdx] = newTableaus[sourceIdx].slice(0, -1);
                if (newTableaus[sourceIdx].length > 0) {
                    const lastCard = newTableaus[sourceIdx][newTableaus[sourceIdx].length - 1];
                    if (!lastCard.faceUp) {
                        lastCard.faceUp = true;
                    }
                }
                setTableaus(newTableaus);
            }
            const newFoundations = [...foundations];
            newFoundations[foundationIdx] = [...newFoundations[foundationIdx], card];
            setFoundations(newFoundations);
            setMoves(moves + 1);
        }

        setDraggedCard(null);
    };

    const handleTableauDrop = (e, targetIdx) => {
        e.preventDefault();
        if (!draggedCard) return;

        const { card, source, sourceIdx, cardIdx } = draggedCard;

        if (canMoveToTableau(card, tableaus[targetIdx])) {
            if (source === 'waste') {
                setWaste(waste.slice(0, -1));
                const newTableaus = [...tableaus];
                newTableaus[targetIdx] = [...newTableaus[targetIdx], card];
                setTableaus(newTableaus);
                setMoves(moves + 1);
            } else if (source === 'tableau') {
                if (sourceIdx === targetIdx) {
                    setDraggedCard(null);
                    return;
                }

                const newTableaus = [...tableaus];
                const sourceTableau = [...newTableaus[sourceIdx]];

                const cardsToMove = sourceTableau.slice(cardIdx);
                newTableaus[sourceIdx] = sourceTableau.slice(0, cardIdx);
                newTableaus[targetIdx] = [...newTableaus[targetIdx], ...cardsToMove];

                if (newTableaus[sourceIdx].length > 0) {
                    const lastCard = newTableaus[sourceIdx][newTableaus[sourceIdx].length - 1];
                    if (!lastCard.faceUp) {
                        lastCard.faceUp = true;
                    }
                }

                setTableaus(newTableaus);
                setMoves(moves + 1);
            }
        }

        setDraggedCard(null);
    };

    // ========== RENDER ==========
    if (isWinner) {
        return (
            <div className="solitario-container" ref={containerRef}>
                <div className="victory-overlay">
                    <div className="victory-modal">
                        <div className="victory-title-bar">
                            <span>Solitario - CODE URV</span>
                        </div>
                        <div className="victory-content">
                            <h2>🎉 ¡GANASTE! 🎉</h2>
                            <div className="victory-stats">
                                <p><strong>Movimientos:</strong> {moves}</p>
                                <p><strong>Tiempo:</strong> {formatTime(time)}</p>
                            </div>
                            <div className="victory-buttons">
                                <button
                                    className="win95-button"
                                    onClick={() => {
                                        setIsWinner(false);
                                        initializeGame();
                                    }}
                                >
                                    Nueva Partida
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (isGameOver) {
        return (
            <div className="solitario-container" ref={containerRef}>
                <div className="victory-overlay">
                    <div className="victory-modal gameover-modal">
                        <div className="victory-title-bar gameover-title-bar">
                            <span>Solitario - CODE URV</span>
                        </div>
                        <div className="victory-content">
                            <h2>😔 GAME OVER</h2>
                            <p className="gameover-message">No hay más movimientos posibles</p>
                            <div className="victory-stats">
                                <p><strong>Movimientos:</strong> {moves}</p>
                                <p><strong>Tiempo:</strong> {formatTime(time)}</p>
                            </div>
                            <div className="victory-buttons">
                                <button
                                    className="win95-button"
                                    onClick={() => {
                                        setIsGameOver(false);
                                        initializeGame();
                                    }}
                                >
                                    Intentar de Nuevo
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="solitario-container" ref={containerRef}>
            <div className="solitario-header">
                <div className="solitario-stats">
                    <span>Movimientos: {moves}</span>
                    <span>Tiempo: {formatTime(time)}</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="solitario-reset" onClick={initializeGame}>
                        Nueva Partida
                    </button>
                    <button className="solitario-reset" onClick={handleSurrender}>
                        Rendirse
                    </button>
                </div>
            </div>

            <div className="solitario-board">
                <div className="solitario-top">
                    <div className="solitario-pile" onClick={handleStockClick}>
                        {stock.length > 0 ? (
                            <div className="card card-back card-in-pile">
                                <img
                                    src={logoURV}
                                    alt="CODE URV"
                                    className="card-back-logo"
                                    draggable="false"
                                />
                            </div>
                        ) : (
                            <div className="card card-empty card-in-pile">
                                <span>↻</span>
                            </div>
                        )}
                        <span className="pile-count">{stock.length}</span>
                    </div>

                    <div className="solitario-waste" style={{ width: 'var(--waste-width)' }}>
                        {waste.slice(-3).map((card, idx) => {
                            const slice = waste.slice(-3);
                            const isLast = idx === slice.length - 1;
                            // left offset basado en cardSize (35% del ancho)
                            const leftOffset = Math.round(idx * (cardSize.width * 0.35));
                            return (
                                <div
                                    key={card.id}
                                    className="card card-face card-in-waste"
                                    data-language={card.language}
                                    style={{
                                        borderColor: getLanguageColor(card.language),
                                        left: `${leftOffset}px`,
                                        zIndex: idx,
                                        pointerEvents: isLast ? 'auto' : 'none'
                                    }}
                                    draggable={isLast}
                                    onDragStart={(e) => isLast && handleCardDragStart(e, card, 'waste', waste.length - 1)}
                                    onDoubleClick={() => isLast && handleCardDoubleClick(card, 'waste', waste.length - 1, 0)}
                                >
                                    <div className="card-corner card-corner-top">
                                        <div className="card-corner-rank">{card.rank}</div>
                                    </div>
                                    <div className="card-center">
                                        <img
                                            src={getLanguageLogo(card.language)}
                                            alt={card.language}
                                            className="card-logo"
                                            draggable="false"
                                        />
                                    </div>
                                    <div className="card-corner card-corner-bottom">
                                        <div className="card-corner-rank">{card.rank}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="solitario-foundations">
                        {foundations.map((foundation, idx) => (
                            <div
                                key={idx}
                                className="solitario-pile"
                                onDragOver={handleCardDragOver}
                                onDragEnter={(e) => e.currentTarget.classList.add('drag-over')}
                                onDragLeave={(e) => e.currentTarget.classList.remove('drag-over')}
                                onDrop={(e) => {
                                    e.currentTarget.classList.remove('drag-over');
                                    handleFoundationDrop(e, idx);
                                }}
                            >
                                {foundation.length > 0 ? (
                                    <div
                                        className="card card-face card-in-pile"
                                        data-language={foundation[foundation.length - 1].language}
                                        style={{ borderColor: getLanguageColor(foundation[foundation.length - 1].language) }}
                                    >
                                        <div className="card-corner card-corner-top">
                                            <div className="card-corner-rank">{foundation[foundation.length - 1].rank}</div>
                                        </div>
                                        <div className="card-center">
                                            <img
                                                src={getLanguageLogo(foundation[foundation.length - 1].language)}
                                                alt={foundation[foundation.length - 1].language}
                                                className="card-logo"
                                                draggable="false"
                                            />
                                        </div>
                                        <div className="card-corner card-corner-bottom">
                                            <div className="card-corner-rank">{foundation[foundation.length - 1].rank}</div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="card card-empty card-in-pile">
                                        <img
                                            src={getFoundationPlaceholder(idx)}
                                            alt="Foundation"
                                            className="foundation-placeholder-logo"
                                            draggable="false"
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="solitario-tableaus">
                    {tableaus.map((tableau, idx) => (
                        <div
                            key={idx}
                            className="solitario-tableau"
                            onDragOver={handleCardDragOver}
                            onDragEnter={(e) => handleTableauDragEnter(e, idx)}
                            onDragLeave={handleTableauDragLeave}
                            onDrop={(e) => {
                                e.currentTarget.classList.remove('drag-over');
                                handleTableauDrop(e, idx);
                            }}
                        >
                            {tableau.length === 0 ? (
                                <div className="card card-empty card-in-tableau"></div>
                            ) : (
                                tableau.map((card, cardIdx) => {
                                    const canDrag = card.faceUp;
                                    const topOffset = Math.round(cardIdx * (cardSize.height * 0.22));
                                    return (
                                        <div
                                            key={card.id}
                                            className={`card card-in-tableau ${card.faceUp ? 'card-face' : 'card-back'} ${selectedCard?.id === card.id ? 'selected' : ''}`}
                                            data-language={card.language}
                                            style={{
                                                borderColor: card.faceUp ? getLanguageColor(card.language) : '#000',
                                                top: `${topOffset}px`,
                                                zIndex: cardIdx,
                                                cursor: canDrag ? 'grab' : 'default',
                                                pointerEvents: canDrag ? 'auto' : 'none'
                                            }}
                                            draggable={canDrag}
                                            onDragStart={(e) => canDrag && handleCardDragStart(e, card, 'tableau', idx, cardIdx)}
                                            onDoubleClick={() => canDrag && handleCardDoubleClick(card, 'tableau', idx, cardIdx)}
                                        >
                                            {card.faceUp ? (
                                                <>
                                                    <div className="card-corner card-corner-top">
                                                        <div className="card-corner-rank">{card.rank}</div>
                                                    </div>
                                                    <div className="card-center">
                                                        <img
                                                            src={getLanguageLogo(card.language)}
                                                            alt={card.language}
                                                            className="card-logo"
                                                            draggable="false"
                                                        />
                                                    </div>
                                                    <div className="card-corner card-corner-bottom">
                                                        <div className="card-corner-rank">{card.rank}</div>
                                                    </div>
                                                </>
                                            ) : (
                                                <img
                                                    src={logoURV}
                                                    alt="CODE URV"
                                                    className="card-back-logo"
                                                    draggable="false"
                                                />
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default Solitario;