import React, { useState, useEffect } from 'react';
import './Solitario.css';
import logoURV from '../../assets/code_urv_logo_nobg.png';
import javaLogo from '../../assets/java-logo.png';
import pythonLogo from '../../assets/python-logo.png';
import jsLogo from '../../assets/javascript-logo.png';
import cppLogo from '../../assets/cpp-logo.png';

/**
 * Componente Solitario - Juego de cartas estilo Windows 95
 * 
 * Este juego usa lenguajes de programación en lugar de palos tradicionales:
 * - Java (♠️) - Naranja
 * - Python (♥️) - Azul
 * - JavaScript (♦️) - Amarillo
 * - C++ (♣️) - Azul oscuro
 * 
 * Reglas del juego:
 * 1. En los tableaus (columnas inferiores): se pueden apilar cartas de diferente lenguaje en orden descendente
 * 2. En las foundations (pilas superiores): se apilan cartas del mismo lenguaje en orden ascendente (A, 2, 3... K)
 * 3. Se pueden arrastrar múltiples cartas a la vez si están boca arriba
 * 4. Solo los Reyes pueden ir a columnas vacías
 * 5. Cada foundation está asignada a un lenguaje específico (Java, Python, JavaScript, C++)
 * 6. Doble click en una carta la envía automáticamente a su foundation si es posible
 * 7. El jugador puede rendirse en cualquier momento
 */
function Solitario() {
    // ==================== ESTADOS DEL JUEGO ====================

    const [deck, setDeck] = useState([]); // Mazo completo (no se usa después de inicializar)
    const [stock, setStock] = useState([]); // Pila de cartas boca abajo (arriba izquierda)
    const [waste, setWaste] = useState([]); // Cartas sacadas del stock (al lado del stock)
    const [foundations, setFoundations] = useState([[], [], [], []]); // 4 pilas de victoria (arriba derecha)
    const [tableaus, setTableaus] = useState([[], [], [], [], [], [], []]); // 7 columnas de juego (abajo)
    const [selectedCard, setSelectedCard] = useState(null); // Carta seleccionada (no se usa actualmente)
    const [draggedCard, setDraggedCard] = useState(null); // Información de la carta siendo arrastrada
    const [moves, setMoves] = useState(0); // Contador de movimientos
    const [time, setTime] = useState(0); // Tiempo transcurrido en segundos
    const [isWinner, setIsWinner] = useState(false); // ¿El jugador ha ganado?
    const [isGameOver, setIsGameOver] = useState(false); // ¿El jugador ha perdido o se ha rendido?
    const [isTimerRunning, setIsTimerRunning] = useState(true); // ¿El cronómetro está corriendo?

    // ==================== EFECTOS ====================

    // Inicializar el juego al montar el componente
    useEffect(() => {
        initializeGame();
    }, []);

    // Cronómetro que cuenta cada segundo
    useEffect(() => {
        if (!isTimerRunning) return;

        const timer = setInterval(() => setTime(t => t + 1), 1000);
        return () => clearInterval(timer); // Limpiar el intervalo al desmontar
    }, [isTimerRunning]);

    // Detectar victoria: cuando las 4 foundations tienen 13 cartas cada una (52 total)
    useEffect(() => {
        const totalCards = foundations.reduce((sum, foundation) => sum + foundation.length, 0);
        if (totalCards === 52 && !isWinner) {
            setIsWinner(true);
            setIsTimerRunning(false);
        }
    }, [foundations]);

    // Detectar derrota: cuando no hay movimientos posibles
    useEffect(() => {
        if (isWinner || isGameOver) return;

        // Esperar medio segundo después de cada movimiento para verificar
        const checkTimeout = setTimeout(() => {
            if (!hasAvailableMoves()) {
                setIsGameOver(true);
                setIsTimerRunning(false);
            }
        }, 500);

        return () => clearTimeout(checkTimeout);
    }, [stock, waste, foundations, tableaus, moves]);

    // ==================== INICIALIZACIÓN DEL JUEGO ====================

    /**
     * Inicializa una nueva partida
     * - Crea un mazo de 52 cartas (4 lenguajes × 13 rangos)
     * - Baraja las cartas aleatoriamente
     * - Distribuye las cartas en los 7 tableaus (1, 2, 3, 4, 5, 6, 7 cartas)
     * - El resto va al stock
     */
    const initializeGame = () => {
        const languages = ['Java', 'Python', 'JavaScript', 'C++'];
        const suits = ['♠️', '♥️', '♦️', '♣️']; // Símbolos decorativos (no se usan en lógica)
        const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

        // Crear el mazo completo
        let newDeck = [];
        languages.forEach((lang, suitIdx) => {
            ranks.forEach((rank, rankIdx) => {
                newDeck.push({
                    id: `${lang}-${rank}`, // Identificador único
                    language: lang, // Lenguaje de programación (equivalente al palo)
                    suit: suits[suitIdx], // Símbolo decorativo
                    rank: rank, // Rango de la carta (A, 2, 3... K)
                    rankValue: rankIdx + 1, // Valor numérico (A=1, 2=2... K=13)
                    faceUp: false // Inicialmente todas boca abajo
                });
            });
        });

        // Barajar el mazo aleatoriamente
        newDeck = newDeck.sort(() => Math.random() - 0.5);

        // Distribuir cartas en los 7 tableaus
        let newTableaus = [[], [], [], [], [], [], []];
        let deckIdx = 0;

        // Patrón de distribución: columna 1 tiene 1 carta, columna 2 tiene 2, etc.
        for (let i = 0; i < 7; i++) {
            for (let j = i; j < 7; j++) {
                newTableaus[j].push({
                    ...newDeck[deckIdx],
                    faceUp: i === j // Solo la última carta de cada columna está boca arriba
                });
                deckIdx++;
            }
        }

        // Reiniciar todos los estados
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

    // ==================== FUNCIONES DE UTILIDAD ====================

    /**
     * Obtiene el color asociado a cada lenguaje de programación
     */
    const getLanguageColor = (language) => {
        const colors = {
            'Java': '#FF6B35',      // Naranja
            'Python': '#3776AB',    // Azul
            'JavaScript': '#F7DF1E', // Amarillo
            'C++': '#00599C'        // Azul oscuro
        };
        return colors[language] || '#000';
    };

    /**
     * Obtiene el logo asociado a cada lenguaje de programación
     */
    const getLanguageLogo = (language) => {
        const logos = {
            'Java': javaLogo,
            'Python': pythonLogo,
            'JavaScript': jsLogo,
            'C++': cppLogo
        };
        return logos[language] || logoURV;
    };

    /**
     * Obtiene el logo placeholder para cada foundation (en orden)
     */
    const getFoundationPlaceholder = (idx) => {
        const logos = [javaLogo, pythonLogo, jsLogo, cppLogo];
        return logos[idx];
    };

    /**
     * Formatea el tiempo en formato MM:SS
     */
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // ==================== MANEJO DEL STOCK ====================

    /**
     * Maneja el click en el stock (pila de cartas boca abajo)
     * - Si hay cartas: saca 3 cartas al waste
     * - Si no hay cartas: recicla el waste de vuelta al stock
     */
    const handleStockClick = () => {
        if (stock.length === 0) {
            // Reciclar: mover todas las cartas del waste de vuelta al stock
            if (waste.length > 0) {
                setStock(waste.map(card => ({ ...card, faceUp: false })).reverse());
                setWaste([]);
                setMoves(moves + 1);
            }
        } else {
            // Sacar hasta 3 cartas del stock al waste
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

    // ==================== VALIDACIONES DE MOVIMIENTO ====================

    /**
     * Verifica si una carta puede moverse a una foundation
     * Reglas:
     * - Si la foundation está vacía, solo acepta As (A)
     * - Si tiene cartas, debe ser del mismo lenguaje y valor consecutivo ascendente
     * - Cada foundation está asignada a un lenguaje específico (Java, Python, JavaScript, C++)
     */
    const canMoveToFoundation = (card, foundation, foundationIdx) => {
        // Determinar qué lenguaje corresponde a cada foundation
        const foundationLanguages = ['Java', 'Python', 'JavaScript', 'C++'];
        const expectedLanguage = foundationLanguages[foundationIdx];

        // La carta debe ser del lenguaje correcto para esta foundation
        if (card.language !== expectedLanguage) {
            return false;
        }

        if (foundation.length === 0) {
            return card.rank === 'A'; // Solo As puede iniciar una foundation
        }

        const topCard = foundation[foundation.length - 1];
        return card.language === topCard.language && card.rankValue === topCard.rankValue + 1;
    };

    /**
     * Verifica si una carta puede moverse a un tableau
     * Reglas:
     * - Si el tableau está vacío, solo acepta Rey (K)
     * - Si tiene cartas, debe ser de diferente lenguaje y valor consecutivo descendente
     */
    const canMoveToTableau = (card, tableau) => {
        // Tableau vacío: solo acepta Rey
        if (tableau.length === 0) {
            return card.rank === 'K';
        }

        // Buscar la última carta boca arriba en el tableau
        let topCard = null;
        for (let i = tableau.length - 1; i >= 0; i--) {
            if (tableau[i].faceUp) {
                topCard = tableau[i];
                break;
            }
        }

        // Si no hay cartas boca arriba, no se puede mover
        if (!topCard) return false;

        // Debe ser diferente lenguaje y valor descendente (K=13, Q=12... A=1)
        const isDifferentLanguage = card.language !== topCard.language;
        const isDescending = card.rankValue === topCard.rankValue - 1;

        return isDifferentLanguage && isDescending;
    };

    /**
     * Intenta mover automáticamente una carta a su foundation correspondiente
     * Se usa para el doble click
     * @returns {boolean} - true si se pudo mover, false si no
     */
    const tryAutoMoveToFoundation = (card, source, sourceIdx, cardIdx) => {
        // Solo se puede mover la última carta de un grupo
        if (source === 'tableau') {
            const sourceTableau = tableaus[sourceIdx];
            if (cardIdx !== sourceTableau.length - 1) {
                return false; // No es la última carta
            }
        }

        // Determinar a qué foundation debe ir según el lenguaje
        const foundationLanguages = ['Java', 'Python', 'JavaScript', 'C++'];
        const foundationIdx = foundationLanguages.indexOf(card.language);

        if (foundationIdx === -1) return false;

        // Verificar si se puede mover
        if (canMoveToFoundation(card, foundations[foundationIdx], foundationIdx)) {
            // Remover carta del origen
            if (source === 'waste') {
                setWaste(waste.slice(0, -1));
            } else if (source === 'tableau') {
                const newTableaus = [...tableaus];
                newTableaus[sourceIdx] = newTableaus[sourceIdx].slice(0, -1);

                // Voltear la última carta del tableau si existe y está boca abajo
                if (newTableaus[sourceIdx].length > 0) {
                    const lastCard = newTableaus[sourceIdx][newTableaus[sourceIdx].length - 1];
                    if (!lastCard.faceUp) {
                        lastCard.faceUp = true;
                    }
                }
                setTableaus(newTableaus);
            }

            // Añadir carta a la foundation
            const newFoundations = [...foundations];
            newFoundations[foundationIdx] = [...newFoundations[foundationIdx], card];
            setFoundations(newFoundations);
            setMoves(moves + 1);

            return true;
        }

        return false;
    };

    /**
     * Verifica si hay movimientos disponibles en el juego
     * Se usa para detectar Game Over automático
     */
    const hasAvailableMoves = () => {
        // 1. Si hay cartas en el stock, siempre hay movimientos
        if (stock.length > 0) return true;

        // 2. Si se puede reciclar el waste, hay movimientos
        if (waste.length > 0 && stock.length === 0) return true;

        // 3. Verificar si la última carta del waste puede moverse
        if (waste.length > 0) {
            const wasteCard = waste[waste.length - 1];

            // ¿Puede ir a alguna foundation?
            for (let i = 0; i < foundations.length; i++) {
                if (canMoveToFoundation(wasteCard, foundations[i], i)) return true;
            }

            // ¿Puede ir a algún tableau?
            for (let tableau of tableaus) {
                if (canMoveToTableau(wasteCard, tableau)) return true;
            }
        }

        // 4. Verificar todas las cartas boca arriba en los tableaus
        for (let i = 0; i < tableaus.length; i++) {
            const tableau = tableaus[i];
            if (tableau.length === 0) continue;

            for (let j = 0; j < tableau.length; j++) {
                const card = tableau[j];
                if (!card.faceUp) continue;

                // ¿Puede ir a alguna foundation? (solo la última carta)
                if (j === tableau.length - 1) {
                    for (let k = 0; k < foundations.length; k++) {
                        if (canMoveToFoundation(card, foundations[k], k)) return true;
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

    // ==================== MANEJO DE RENDIRSE ====================

    /**
     * Maneja cuando el jugador se rinde
     * Detiene el cronómetro y muestra el modal de Game Over
     */
    const handleSurrender = () => {
        setIsGameOver(true);
        setIsTimerRunning(false);
    };

    // ==================== DRAG & DROP ====================

    /**
     * Inicia el arrastre de una carta
     * Crea una imagen personalizada mostrando todas las cartas que se van a mover
     * @param {Event} e - Evento de drag
     * @param {Object} card - Carta siendo arrastrada
     * @param {string} source - Origen: 'waste' o 'tableau'
     * @param {number} sourceIdx - Índice del origen (índice del tableau o del waste)
     * @param {number} cardIdx - Índice de la carta dentro del tableau (solo para tableaus)
     */
    const handleCardDragStart = (e, card, source, sourceIdx, cardIdx) => {
        e.stopPropagation();
        if (!card.faceUp) return;

        // Guardar información del arrastre
        setDraggedCard({ card, source, sourceIdx, cardIdx });
        e.dataTransfer.effectAllowed = 'move';

        // Si es desde un tableau, crear una imagen personalizada con todas las cartas
        if (source === 'tableau') {
            const sourceTableau = tableaus[sourceIdx];
            const cardsToMove = sourceTableau.slice(cardIdx);

            // Solo crear imagen personalizada si hay más de una carta
            if (cardsToMove.length > 1) {
                // Crear un contenedor temporal para las cartas
                const dragPreview = document.createElement('div');
                dragPreview.style.position = 'absolute';
                dragPreview.style.top = '-9999px';
                dragPreview.style.left = '-9999px';
                dragPreview.style.width = '90px';
                dragPreview.style.pointerEvents = 'none';

                // Añadir cada carta al preview
                cardsToMove.forEach((c, idx) => {
                    const cardDiv = document.createElement('div');
                    cardDiv.className = 'card card-face card-drag-preview';
                    cardDiv.style.position = 'absolute';
                    cardDiv.style.top = `${idx * 25}px`;
                    cardDiv.style.width = '90px';
                    cardDiv.style.height = '130px';
                    cardDiv.style.backgroundColor = 'white';
                    cardDiv.style.border = `3px solid ${getLanguageColor(c.language)}`;
                    cardDiv.style.borderRadius = '8px';
                    cardDiv.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.4)';
                    cardDiv.style.display = 'flex';
                    cardDiv.style.alignItems = 'center';
                    cardDiv.style.justifyContent = 'center';
                    cardDiv.style.padding = '8px';

                    // Añadir el logo
                    const logo = document.createElement('img');
                    logo.src = getLanguageLogo(c.language);
                    logo.style.width = '65px';
                    logo.style.height = '65px';
                    logo.style.objectFit = 'contain';

                    // Añadir el rank en la esquina
                    const rankTop = document.createElement('div');
                    rankTop.style.position = 'absolute';
                    rankTop.style.top = '6px';
                    rankTop.style.left = '8px';
                    rankTop.style.fontSize = '22px';
                    rankTop.style.fontWeight = 'bold';
                    rankTop.style.fontFamily = 'Arial, sans-serif';
                    rankTop.textContent = c.rank;

                    cardDiv.appendChild(rankTop);
                    cardDiv.appendChild(logo);
                    dragPreview.appendChild(cardDiv);
                });

                // Ajustar altura del contenedor según número de cartas
                const totalHeight = 130 + (cardsToMove.length - 1) * 25;
                dragPreview.style.height = `${totalHeight}px`;

                // Añadir al DOM temporalmente
                document.body.appendChild(dragPreview);

                // Establecer la imagen de arrastre personalizada
                e.dataTransfer.setDragImage(dragPreview, 45, 15);

                // Eliminar el elemento después de un momento
                setTimeout(() => {
                    document.body.removeChild(dragPreview);
                }, 0);
            }
        }
    };

    /**
     * Permite que se pueda soltar una carta sobre un elemento
     */
    const handleCardDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    /**
     * Añade clase visual cuando se arrastra sobre un tableau
     */
    const handleTableauDragEnter = (e, targetIdx) => {
        e.preventDefault();
        e.currentTarget.classList.add('drag-over');
    };

    /**
     * Remueve clase visual cuando se sale del tableau
     */
    const handleTableauDragLeave = (e) => {
        e.currentTarget.classList.remove('drag-over');
    };

    /**
     * Maneja el doble click en una carta para moverla automáticamente a su foundation
     */
    const handleCardDoubleClick = (card, source, sourceIdx, cardIdx) => {
        if (!card.faceUp) return;

        tryAutoMoveToFoundation(card, source, sourceIdx, cardIdx);
    };

    /**
     * Maneja cuando se suelta una carta en una foundation
     * Solo se puede mover UNA carta a la vez a las foundations
     */
    const handleFoundationDrop = (e, foundationIdx) => {
        e.preventDefault();
        if (!draggedCard) return;

        const { card, source, sourceIdx, cardIdx } = draggedCard;

        // Verificar que solo se mueva una carta (debe ser la última de su grupo)
        if (source === 'tableau') {
            const sourceTableau = tableaus[sourceIdx];
            // Solo se puede mover a foundation si es la última carta del tableau
            if (cardIdx !== sourceTableau.length - 1) {
                setDraggedCard(null);
                return;
            }
        }

        // Validar si el movimiento es legal (ahora con validación de lenguaje)
        if (canMoveToFoundation(card, foundations[foundationIdx], foundationIdx)) {
            // Remover carta del origen
            if (source === 'waste') {
                setWaste(waste.slice(0, -1));
            } else if (source === 'tableau') {
                const newTableaus = [...tableaus];
                newTableaus[sourceIdx] = newTableaus[sourceIdx].slice(0, -1);

                // Voltear la última carta del tableau si existe y está boca abajo
                if (newTableaus[sourceIdx].length > 0) {
                    const lastCard = newTableaus[sourceIdx][newTableaus[sourceIdx].length - 1];
                    if (!lastCard.faceUp) {
                        lastCard.faceUp = true;
                    }
                }
                setTableaus(newTableaus);
            }

            // Añadir carta a la foundation
            const newFoundations = [...foundations];
            newFoundations[foundationIdx] = [...newFoundations[foundationIdx], card];
            setFoundations(newFoundations);
            setMoves(moves + 1);
        }

        setDraggedCard(null);
    };

    /**
     * Maneja cuando se suelta una carta en un tableau
     * Se pueden mover múltiples cartas a la vez (la carta arrastrada + todas las que tiene debajo)
     */
    const handleTableauDrop = (e, targetIdx) => {
        e.preventDefault();
        if (!draggedCard) return;

        const { card, source, sourceIdx, cardIdx } = draggedCard;

        // Validar si el movimiento es legal
        if (canMoveToTableau(card, tableaus[targetIdx])) {
            if (source === 'waste') {
                // Mover desde el waste (siempre es una sola carta)
                setWaste(waste.slice(0, -1));

                const newTableaus = [...tableaus];
                newTableaus[targetIdx] = [...newTableaus[targetIdx], card];
                setTableaus(newTableaus);
                setMoves(moves + 1);
            } else if (source === 'tableau') {
                // No permitir mover a la misma columna
                if (sourceIdx === targetIdx) {
                    setDraggedCard(null);
                    return;
                }

                const newTableaus = [...tableaus];
                const sourceTableau = [...newTableaus[sourceIdx]];

                // Mover la carta arrastrada Y todas las que están debajo de ella
                const cardsToMove = sourceTableau.slice(cardIdx);
                newTableaus[sourceIdx] = sourceTableau.slice(0, cardIdx);
                newTableaus[targetIdx] = [...newTableaus[targetIdx], ...cardsToMove];

                // Voltear la última carta del origen si existe y está boca abajo
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

    // ==================== RENDERIZADO ====================

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

    // Modal de Derrota (Game Over o Rendirse)
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

    // Tablero principal del juego
    return (
        <div className="solitario-container">
            {/* Header con estadísticas y botones de control */}
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
                {/* Sección superior: Stock, Waste y Foundations */}
                <div className="solitario-top">
                    {/* Stock: pila de cartas boca abajo */}
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

                    {/* Waste: cartas sacadas del stock (mostrar últimas 3) */}
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
                                        pointerEvents: isLast ? 'auto' : 'none' // Solo la última es interactiva
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

                    {/* Foundations: 4 pilas de victoria (una por lenguaje) */}
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
                                    // Mostrar la última carta de la foundation
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
                                    // Placeholder vacío con logo del lenguaje
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

                {/* Tableaus: 7 columnas de juego */}
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
                                // Columna vacía
                                <div className="card card-empty card-in-tableau"></div>
                            ) : (
                                // Renderizar todas las cartas de la columna
                                tableau.map((card, cardIdx) => {
                                    // Permitir arrastrar cualquier carta boca arriba
                                    // Al arrastrarla, se moverán también todas las cartas debajo de ella
                                    const canDrag = card.faceUp;

                                    return (
                                        <div
                                            key={card.id}
                                            className={`card card-in-tableau ${card.faceUp ? 'card-face' : 'card-back'} ${selectedCard?.id === card.id ? 'selected' : ''}`}
                                            data-language={card.language}
                                            style={{
                                                borderColor: card.faceUp ? getLanguageColor(card.language) : '#000',
                                                top: `${cardIdx * 25}px`, // Apilar cartas con offset vertical
                                                zIndex: cardIdx, // Cartas superiores tienen mayor z-index
                                                cursor: canDrag ? 'grab' : 'default',
                                                pointerEvents: canDrag ? 'auto' : 'none' // Cartas boca abajo no son interactivas
                                            }}
                                            draggable={canDrag}
                                            onDragStart={(e) => canDrag && handleCardDragStart(e, card, 'tableau', idx, cardIdx)}
                                            onDoubleClick={() => canDrag && handleCardDoubleClick(card, 'tableau', idx, cardIdx)}
                                        >
                                            {card.faceUp ? (
                                                // Carta boca arriba: mostrar contenido
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
                                                // Carta boca abajo: mostrar logo de CODE URV
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