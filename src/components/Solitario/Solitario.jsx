import React, { useState, useEffect } from 'react';
import './Solitario.css';
import logoURV from '../../assets/code_urv_logo_nobg.png';
import javaLogo from '../../assets/java-logo.png';
import pythonLogo from '../../assets/python-logo.png';
import jsLogo from '../../assets/javascript-logo.png';
import cppLogo from '../../assets/cpp-logo.png';

function Solitario() {
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

    useEffect(() => {
        initializeGame();
    }, []);

    // Timer que se detiene cuando ganas o pierdes
    useEffect(() => {
        if (!isTimerRunning) return;
        
        const timer = setInterval(() => setTime(t => t + 1), 1000);
        return () => clearInterval(timer);
    }, [isTimerRunning]);

    // Detectar victoria
    useEffect(() => {
        const totalCards = foundations.reduce((sum, foundation) => sum + foundation.length, 0);
        if (totalCards === 52 && !isWinner) {
            setIsWinner(true);
            setIsTimerRunning(false); // Detener el timer
        }
    }, [foundations]);

    // Detectar derrota (sin movimientos posibles)
    useEffect(() => {
        if (isWinner || isGameOver) return;
        
        // Esperar un poco después de cada movimiento para verificar
        const checkTimeout = setTimeout(() => {
            if (!hasAvailableMoves()) {
                setIsGameOver(true);
                setIsTimerRunning(false); // Detener el timer
            }
        }, 500);
        
        return () => clearTimeout(checkTimeout);
    }, [stock, waste, foundations, tableaus, moves]);

    const initializeGame = () => {
        const languages = ['Java', 'Python', 'JavaScript', 'C++'];
        const suits = ['♠️', '♥️', '♦️', '♣️'];
        const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

        let newDeck = [];
        languages.forEach((lang, suitIdx) => {
            ranks.forEach((rank, rankIdx) => {
                newDeck.push({
                    id: `${lang}-${rank}`,
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
        setIsTimerRunning(true); // Reiniciar el timer
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

    const handleStockClick = () => {
        if (stock.length === 0) {
            // Reciclar waste a stock
            if (waste.length > 0) {
                setStock(waste.map(card => ({ ...card, faceUp: false })).reverse());
                setWaste([]);
                setMoves(moves + 1);
            }
        } else {
            // Sacar 3 cartas (o las que queden)
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

    // Validar si se puede mover a foundation
    const canMoveToFoundation = (card, foundation) => {
        if (foundation.length === 0) {
            return card.rank === 'A';
        }
        const topCard = foundation[foundation.length - 1];
        return card.language === topCard.language && card.rankValue === topCard.rankValue + 1;
    };

    // Validar si se puede mover a tableau
    const canMoveToTableau = (card, tableau) => {
        // Si el tableau está vacío, solo acepta Rey
        if (tableau.length === 0) {
            return card.rank === 'K';
        }
        
        // Buscar la última carta boca arriba
        let topCard = null;
        for (let i = tableau.length - 1; i >= 0; i--) {
            if (tableau[i].faceUp) {
                topCard = tableau[i];
                break;
            }
        }
        
        // Si no hay cartas boca arriba, no se puede mover
        if (!topCard) return false;
        
        // Diferente lenguaje y valor descendente (K=13, Q=12, ..., A=1)
        const isDifferentLanguage = card.language !== topCard.language;
        const isDescending = card.rankValue === topCard.rankValue - 1;
        
        return isDifferentLanguage && isDescending;
    };

    // Verificar si hay movimientos disponibles
    const hasAvailableMoves = () => {
        // 1. Verificar si hay cartas en el stock
        if (stock.length > 0) return true;
        
        // 2. Verificar si se puede reciclar el waste
        if (waste.length > 0 && stock.length === 0) return true;
        
        // 3. Verificar si la última carta del waste puede moverse
        if (waste.length > 0) {
            const wasteCard = waste[waste.length - 1];
            
            // ¿Puede ir a alguna foundation?
            for (let foundation of foundations) {
                if (canMoveToFoundation(wasteCard, foundation)) return true;
            }
            
            // ¿Puede ir a algún tableau?
            for (let tableau of tableaus) {
                if (canMoveToTableau(wasteCard, tableau)) return true;
            }
        }
        
        // 4. Verificar cartas en tableaus
        for (let i = 0; i < tableaus.length; i++) {
            const tableau = tableaus[i];
            if (tableau.length === 0) continue;
            
            // Buscar todas las cartas boca arriba que se pueden mover
            for (let j = 0; j < tableau.length; j++) {
                const card = tableau[j];
                if (!card.faceUp) continue;
                
                // ¿Puede ir a alguna foundation? (solo la última carta)
                if (j === tableau.length - 1) {
                    for (let foundation of foundations) {
                        if (canMoveToFoundation(card, foundation)) return true;
                    }
                }
                
                // ¿Puede ir a otro tableau?
                for (let k = 0; k < tableaus.length; k++) {
                    if (i === k) continue; // No mover a la misma columna
                    if (canMoveToTableau(card, tableaus[k])) return true;
                }
            }
        }
        
        // No hay movimientos disponibles
        return false;
    };

    const handleCardDragStart = (e, card, source, sourceIdx) => {
        e.stopPropagation();
        if (!card.faceUp) return;
        
        setDraggedCard({ card, source, sourceIdx });
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleCardDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleFoundationDrop = (e, foundationIdx) => {
        e.preventDefault();
        if (!draggedCard) return;

        const { card, source, sourceIdx } = draggedCard;
        
        // Solo se puede mover una carta a la vez a foundation
        if (canMoveToFoundation(card, foundations[foundationIdx])) {
            // Remover carta del origen
            if (source === 'waste') {
                setWaste(waste.slice(0, -1));
            } else if (source === 'tableau') {
                const newTableaus = [...tableaus];
                newTableaus[sourceIdx] = newTableaus[sourceIdx].slice(0, -1);
                
                // Voltear la última carta si existe
                if (newTableaus[sourceIdx].length > 0) {
                    const lastCard = newTableaus[sourceIdx][newTableaus[sourceIdx].length - 1];
                    if (!lastCard.faceUp) {
                        lastCard.faceUp = true;
                    }
                }
                setTableaus(newTableaus);
            }

            // Añadir a foundation
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

        const { card, source, sourceIdx } = draggedCard;
        
        if (canMoveToTableau(card, tableaus[targetIdx])) {
            // Remover carta del origen
            if (source === 'waste') {
                setWaste(waste.slice(0, -1));
                
                // Añadir a tableau
                const newTableaus = [...tableaus];
                newTableaus[targetIdx] = [...newTableaus[targetIdx], card];
                setTableaus(newTableaus);
                setMoves(moves + 1);
            } else if (source === 'tableau') {
                // No mover a la misma columna
                if (sourceIdx === targetIdx) {
                    setDraggedCard(null);
                    return;
                }

                const newTableaus = [...tableaus];
                const sourceTableau = [...newTableaus[sourceIdx]];
                
                // Encontrar el índice de la carta arrastrada
                const cardIndex = sourceTableau.findIndex(c => c.id === card.id);
                
                // Mover la carta y todas las que están encima
                const cardsToMove = sourceTableau.slice(cardIndex);
                newTableaus[sourceIdx] = sourceTableau.slice(0, cardIndex);
                newTableaus[targetIdx] = [...newTableaus[targetIdx], ...cardsToMove];
                
                // Voltear la última carta del origen si existe
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

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Modal de Victoria
    if (isWinner) {
        return (
            <div className="solitario-container">
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

    // Modal de Derrota
    if (isGameOver) {
        return (
            <div className="solitario-container">
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
        <div className="solitario-container">
            <div className="solitario-header">
                <div className="solitario-stats">
                    <span>Movimientos: {moves}</span>
                    <span>Tiempo: {formatTime(time)}</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="solitario-reset" onClick={initializeGame}>
                        Nueva Partida
                    </button>
                </div>
            </div>

            <div className="solitario-board">
                <div className="solitario-top">
                    {/* Stock */}
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

                    {/* Waste - Mostrar las últimas 3 cartas */}
                    <div className="solitario-waste">
                        {waste.slice(-3).map((card, idx) => {
                            const isLast = idx === waste.slice(-3).length - 1;
                            return (
                                <div
                                    key={card.id}
                                    className="card card-face card-in-waste"
                                    data-language={card.language}
                                    style={{ 
                                        borderColor: getLanguageColor(card.language),
                                        left: `${idx * 30}px`,
                                        zIndex: idx,
                                        pointerEvents: isLast ? 'auto' : 'none'
                                    }}
                                    draggable={isLast}
                                    onDragStart={(e) => isLast && handleCardDragStart(e, card, 'waste', waste.length - 1)}
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

                    {/* Foundations */}
                    <div className="solitario-foundations">
                        {foundations.map((foundation, idx) => (
                            <div 
                                key={idx} 
                                className="solitario-pile"
                                onDragOver={handleCardDragOver}
                                onDrop={(e) => handleFoundationDrop(e, idx)}
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

                {/* Tableaus - 7 columnas */}
                <div className="solitario-tableaus">
                    {tableaus.map((tableau, idx) => (
                        <div 
                            key={idx} 
                            className="solitario-tableau"
                            onDragOver={handleCardDragOver}
                            onDrop={(e) => handleTableauDrop(e, idx)}
                        >
                            {tableau.length === 0 ? (
                                <div className="card card-empty card-in-tableau"></div>
                            ) : (
                                tableau.map((card, cardIdx) => {
                                    const isLastCard = cardIdx === tableau.length - 1;
                                    const isLastFaceUpCard = card.faceUp && (
                                        cardIdx === tableau.length - 1 || 
                                        !tableau[cardIdx + 1]?.faceUp
                                    );
                                    
                                    return (
                                        <div
                                            key={card.id}
                                            className={`card card-in-tableau ${card.faceUp ? 'card-face' : 'card-back'} ${selectedCard?.id === card.id ? 'selected' : ''} ${!isLastFaceUpCard ? 'card-blocked' : ''}`}
                                            data-language={card.language}
                                            style={{
                                                borderColor: card.faceUp ? getLanguageColor(card.language) : '#000',
                                                top: `${cardIdx * 25}px`,
                                                zIndex: cardIdx,
                                                pointerEvents: isLastFaceUpCard ? 'auto' : 'none'
                                            }}
                                            draggable={card.faceUp && isLastFaceUpCard}
                                            onDragStart={(e) => handleCardDragStart(e, card, 'tableau', idx)}
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