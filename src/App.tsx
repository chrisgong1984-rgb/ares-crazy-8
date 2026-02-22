/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, RotateCcw, Info, ChevronRight, Hand as HandIcon } from 'lucide-react';
import { CardData, GameState, Suit, PlayerType } from './types';
import { createDeck, SUITS, SUIT_SYMBOLS, SUIT_COLORS } from './constants';
import { Card } from './components/Card';
import { StartScreen } from './components/StartScreen';

export default function App() {
  const [gameState, setGameState] = useState<GameState>({
    playerHand: [],
    aiHand: [],
    drawPile: [],
    discardPile: [],
    currentPlayer: 'player',
    status: 'waiting',
    wildSuit: null,
    winner: null,
    lastAction: '欢迎来到疯狂 8 点！',
  });

  const [showSuitSelector, setShowSuitSelector] = useState(false);
  const [pendingWildCard, setPendingWildCard] = useState<CardData | null>(null);
  const [drawingAnimation, setDrawingAnimation] = useState<{ card: CardData, target: PlayerType } | null>(null);
  const [playingAnimation, setPlayingAnimation] = useState<{ card: CardData, source: PlayerType } | null>(null);

  // Refs for animation targets
  const deckRef = React.useRef<HTMLDivElement>(null);
  const discardRef = React.useRef<HTMLDivElement>(null);

  // Initialize Game
  const startNewGame = useCallback(() => {
    const deck = createDeck();
    const playerHand = deck.splice(0, 8);
    const aiHand = deck.splice(0, 8);
    
    // Ensure first discard is not an 8 for simplicity, or handle it
    let firstDiscard = deck.pop()!;
    while (firstDiscard.rank === '8') {
      deck.unshift(firstDiscard);
      firstDiscard = deck.pop()!;
    }

    setGameState({
      playerHand,
      aiHand,
      drawPile: deck,
      discardPile: [firstDiscard],
      currentPlayer: 'player',
      status: 'playing',
      wildSuit: null,
      winner: null,
      lastAction: '游戏开始！轮到你了。',
    });
    setShowSuitSelector(false);
    setPendingWildCard(null);
  }, []);

  const checkPlayable = (card: CardData, topCard: CardData, wildSuit: Suit | null) => {
    if (card.rank === '8') return true;
    const targetSuit = wildSuit || topCard.suit;
    return card.suit === targetSuit || card.rank === topCard.rank;
  };

  const handlePlayerPlay = (card: CardData) => {
    if (gameState.currentPlayer !== 'player' || gameState.status !== 'playing') return;

    const topCard = gameState.discardPile[gameState.discardPile.length - 1];
    if (!checkPlayable(card, topCard, gameState.wildSuit)) return;

    if (card.rank === '8') {
      setPendingWildCard(card);
      setShowSuitSelector(true);
      setGameState(prev => ({ ...prev, status: 'selecting_suit' }));
    } else {
      executeMove('player', card);
    }
  };

  const executeMove = (player: PlayerType, card: CardData, newWildSuit: Suit | null = null) => {
    const isPlayer = player === 'player';
    
    // Start animation
    setPlayingAnimation({ card, source: player });
    
    // Remove from hand immediately
    setGameState(prev => ({
      ...prev,
      playerHand: isPlayer ? prev.playerHand.filter(c => c.id !== card.id) : prev.playerHand,
      aiHand: !isPlayer ? prev.aiHand.filter(c => c.id !== card.id) : prev.aiHand,
    }));

    // Wait for animation to finish
    setTimeout(() => {
      setGameState(prev => {
        const currentHand = isPlayer ? prev.playerHand : prev.aiHand;
        const newDiscardPile = [...prev.discardPile, card];
        const hasWon = currentHand.length === 0;
        
        return {
          ...prev,
          discardPile: newDiscardPile,
          currentPlayer: hasWon ? prev.currentPlayer : (isPlayer ? 'ai' : 'player'),
          status: hasWon ? 'game_over' : 'playing',
          winner: hasWon ? player : null,
          wildSuit: newWildSuit,
          lastAction: `${player === 'player' ? '你' : 'AI'} 打出了 ${card.rank} (${suitTranslations[card.suit]})${newWildSuit ? '。新花色: ' + suitTranslations[newWildSuit] : ''}`,
        };
      });
      setPlayingAnimation(null);
    }, 600);
  };

  const suitTranslations: Record<Suit, string> = {
    hearts: '红心',
    diamonds: '方块',
    clubs: '梅花',
    spades: '黑桃',
  };

  const handleDraw = (player: PlayerType) => {
    if (gameState.status !== 'playing' || gameState.currentPlayer !== player) return;
    if (gameState.drawPile.length === 0) {
      setGameState(prev => ({
        ...prev,
        currentPlayer: player === 'player' ? 'ai' : 'player',
        lastAction: `${player === 'player' ? '你' : 'AI'} 必须跳过（牌堆已空）。`,
      }));
      return;
    }

    // Start drawing animation
    const newDrawPile = [...gameState.drawPile];
    const drawnCard = newDrawPile.pop()!;
    
    setDrawingAnimation({ card: drawnCard, target: player });
    
    // Update draw pile immediately to show card leaving
    setGameState(prev => ({ ...prev, drawPile: newDrawPile }));

    // After animation, add to hand
    setTimeout(() => {
      setGameState(prev => {
        const isPlayer = player === 'player';
        const newHand = isPlayer ? [...prev.playerHand, drawnCard] : [...prev.aiHand, drawnCard];
        
        return {
          ...prev,
          playerHand: isPlayer ? newHand : prev.playerHand,
          aiHand: isPlayer ? prev.aiHand : newHand,
          lastAction: `${player === 'player' ? '你' : 'AI'} 摸了一张牌。`,
          currentPlayer: prev.currentPlayer, // Keep current player until they play or we decide to switch
        };
      });
      setDrawingAnimation(null);
    }, 600);
  };

  const handleSuitSelect = (suit: Suit) => {
    if (!pendingWildCard) return;
    executeMove('player', pendingWildCard, suit);
    setShowSuitSelector(false);
    setPendingWildCard(null);
  };

  // AI Logic
  useEffect(() => {
    if (gameState.currentPlayer === 'ai' && gameState.status === 'playing') {
      const timer = setTimeout(() => {
        const topCard = gameState.discardPile[gameState.discardPile.length - 1];
        const playableCards = gameState.aiHand.filter(c => checkPlayable(c, topCard, gameState.wildSuit));

        if (playableCards.length > 0) {
          // AI Strategy: Play 8 last if possible, or play matching rank/suit
          const nonEight = playableCards.find(c => c.rank !== '8');
          const cardToPlay = nonEight || playableCards[0];

          if (cardToPlay.rank === '8') {
            // AI picks its most frequent suit
            const suitCounts: Record<string, number> = {};
            gameState.aiHand.forEach(c => {
              if (c.rank !== '8') suitCounts[c.suit] = (suitCounts[c.suit] || 0) + 1;
            });
            const bestSuit = (Object.entries(suitCounts).sort((a, b) => b[1] - a[1])[0]?.[0] as Suit) || 'spades';
            executeMove('ai', cardToPlay, bestSuit);
          } else {
            executeMove('ai', cardToPlay);
          }
        } else {
          if (gameState.drawPile.length > 0) {
            handleDraw('ai');
          } else {
            // Skip turn
            setGameState(prev => ({
              ...prev,
              currentPlayer: 'player',
              lastAction: 'AI 跳过了回合（无牌可出）。',
            }));
          }
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [gameState.currentPlayer, gameState.status, gameState.aiHand, gameState.discardPile, gameState.drawPile, gameState.wildSuit]);

  const topDiscard = gameState.discardPile[gameState.discardPile.length - 1];
  const canPlayerPlay = gameState.playerHand.some(c => checkPlayable(c, topDiscard, gameState.wildSuit));
  const canPlayerDraw = gameState.drawPile.length > 0;

  return (
    <div className="min-h-screen bg-black text-zinc-300 font-sans selection:bg-red-900/30 overflow-hidden flex flex-col">
      {/* Start Screen Overlay */}
      <AnimatePresence>
        {gameState.status === 'waiting' && (
          <motion.div
            key="start-screen"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, y: -100 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="fixed inset-0 z-[100]"
          >
            <StartScreen onStart={startNewGame} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Blood Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(69,10,10,0.3),transparent_80%)]" />
        <div className="absolute -top-[20%] -right-[10%] w-[60%] h-[60%] bg-red-900/10 blur-[150px] rounded-full" />
        <div className="absolute bottom-[5%] left-[10%] w-[30%] h-[30%] bg-red-600/5 blur-[100px] rounded-full" />
        {/* Splatter particles */}
        <div className="absolute top-[15%] left-[20%] w-1 h-1 bg-red-900/40 rounded-full" />
        <div className="absolute top-[40%] right-[15%] w-2 h-2 bg-red-900/20 rounded-full" />
        <div className="absolute bottom-[25%] left-[40%] w-1.5 h-1.5 bg-red-900/30 rounded-full" />
      </div>

      {/* Header */}
      <header className="p-4 flex justify-between items-center border-b border-red-900/20 bg-zinc-950/80 backdrop-blur-2xl z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-700 rounded-lg flex items-center justify-center shadow-[0_0_25px_rgba(185,28,28,0.3)] border border-red-500/20">
            <span className="text-2xl font-black italic text-black drop-shadow-md">8</span>
          </div>
          <div>
            <h1 className="text-lg font-black leading-none tracking-tighter text-red-600 uppercase italic">Ares' Crazy 8s</h1>
          </div>
        </div>
        
        <div className="flex gap-2">
          {gameState.currentPlayer === 'player' && !canPlayerPlay && !canPlayerDraw && gameState.status === 'playing' && (
            <button 
              onClick={() => setGameState(prev => ({ ...prev, currentPlayer: 'ai', lastAction: '你被迫跳过了回合。' }))}
              className="px-4 py-2 bg-red-950/40 hover:bg-red-900/40 text-red-500 text-xs font-black rounded-md border border-red-900/50 transition-all flex items-center gap-2 uppercase italic"
            >
              弃权 <HandIcon size={14} />
            </button>
          )}
          <button 
            onClick={startNewGame}
            className="p-2 hover:bg-red-900/20 rounded-full transition-colors text-red-900 hover:text-red-500"
            title="重新开始"
          >
            <RotateCcw size={20} />
          </button>
        </div>
      </header>

      {/* Main Game Area */}
      <main className="flex-1 relative p-4 flex flex-col items-center justify-between max-w-5xl mx-auto w-full z-0">
        
        {/* AI Hand */}
        <div className="w-full flex flex-col items-center gap-2">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-1.5 h-1.5 rounded-full ${gameState.currentPlayer === 'ai' ? 'bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.8)] animate-pulse' : 'bg-zinc-800'}`} />
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600">猎物 • {gameState.aiHand.length} 张残牌</span>
          </div>
          <div className="flex -space-x-12 sm:-space-x-16 overflow-visible h-32 sm:h-40 items-center justify-center">
            {gameState.aiHand.map((card, idx) => (
              <Card key={card.id} card={card} isFaceDown className="shadow-2xl scale-90 grayscale-[0.5] hover:grayscale-0 transition-all" />
            ))}
            {gameState.aiHand.length === 0 && gameState.status === 'waiting' && (
              <div className="text-red-900/20 italic text-sm font-black uppercase tracking-[0.5em]">等待献祭</div>
            )}
          </div>
        </div>

        {/* Center: Deck and Discard */}
        <div className="flex gap-8 sm:gap-16 items-center justify-center my-4">
          {/* Draw Pile */}
          <div className="flex flex-col items-center gap-3">
             <div 
              ref={deckRef}
              onClick={() => gameState.currentPlayer === 'player' && !drawingAnimation && handleDraw('player')}
              className={`
                relative w-20 h-28 sm:w-24 sm:h-36 rounded-lg border border-red-900/20 bg-zinc-950 shadow-2xl cursor-pointer
                hover:translate-y-[-4px] transition-all active:scale-95 group
                ${gameState.currentPlayer === 'player' && gameState.status === 'playing' && !drawingAnimation ? 'ring-2 ring-red-600/30 border-red-600/30' : 'opacity-40'}
              `}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-red-900/10 font-black text-4xl italic group-hover:text-red-600/20 transition-colors">{gameState.drawPile.length}</div>
              </div>
              {/* Stack effect */}
              <div className="absolute -top-1 -left-1 w-full h-full rounded-lg border border-red-900/10 bg-zinc-950 -z-10" />
              <div className="absolute -top-2 -left-2 w-full h-full rounded-lg border border-red-900/10 bg-zinc-950 -z-20" />
            </div>
            <span className="text-[9px] uppercase font-black tracking-widest text-red-900/40">血库</span>
          </div>

          {/* Discard Pile */}
          <div className="flex flex-col items-center gap-3">
            <div 
              ref={discardRef}
              className="relative w-20 h-28 sm:w-24 sm:h-36"
            >
              <AnimatePresence mode="popLayout">
                {gameState.discardPile.map((card, idx) => (
                  idx === gameState.discardPile.length - 1 && (
                    <Card 
                      key={card.id} 
                      card={card} 
                      className="absolute inset-0 shadow-[0_0_50px_rgba(153,27,27,0.3)]"
                    />
                  )
                ))}
              </AnimatePresence>
              {gameState.wildSuit && (
                <motion.div 
                  initial={{ scale: 0, rotate: -90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  className="absolute -top-4 -right-4 w-10 h-10 bg-black border border-red-900/40 rounded-full flex items-center justify-center shadow-2xl z-20"
                >
                  <span className={`text-2xl ${SUIT_COLORS[gameState.wildSuit]}`}>
                    {SUIT_SYMBOLS[gameState.wildSuit]}
                  </span>
                </motion.div>
              )}
            </div>
            <span className="text-[9px] uppercase font-black tracking-widest text-red-900/40">祭坛</span>
          </div>
        </div>

        {/* Player Hand */}
        <div className="w-full flex flex-col items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${gameState.currentPlayer === 'player' ? 'bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.8)] animate-pulse' : 'bg-zinc-800'}`} />
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600">你的残局 • {gameState.playerHand.length} 张血牌</span>
          </div>
          
          <div className="flex flex-wrap justify-center gap-2 sm:gap-4 max-w-3xl">
            {gameState.playerHand.map((card) => (
              <Card 
                key={card.id} 
                card={card} 
                isPlayable={gameState.currentPlayer === 'player' && gameState.status === 'playing' && checkPlayable(card, topDiscard, gameState.wildSuit)}
                onClick={() => handlePlayerPlay(card)}
              />
            ))}
          </div>
        </div>
      </main>

      {/* Footer / Status Bar */}
      <footer className="p-4 bg-zinc-950/90 backdrop-blur-2xl border-t border-red-900/20 flex justify-between items-center z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-900/10 rounded-lg">
            <Info size={14} className="text-red-700" />
          </div>
          <p className="text-xs font-black text-red-900/60 italic tracking-tight">
            {gameState.lastAction}
          </p>
        </div>
      </footer>

      {/* Suit Selector Modal */}
      <AnimatePresence>
        {showSuitSelector && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-zinc-950 border border-red-900/30 p-8 rounded-2xl max-w-sm w-full text-center shadow-[0_0_100px_rgba(153,27,27,0.2)]"
            >
              <h2 className="text-2xl font-black mb-2 text-red-600 italic uppercase tracking-tighter">诅咒之 8!</h2>
              <p className="text-red-900 text-xs mb-8 font-bold uppercase tracking-widest">选择你要染红的花色</p>
              
              <div className="grid grid-cols-2 gap-4">
                {SUITS.map(suit => (
                  <button
                    key={suit}
                    onClick={() => handleSuitSelect(suit)}
                    className="p-6 bg-red-950/10 hover:bg-red-900/20 border border-red-900/20 rounded-xl transition-all flex flex-col items-center gap-2 group"
                  >
                    <span className={`text-4xl group-hover:scale-125 transition-transform duration-500 ${SUIT_COLORS[suit]}`}>
                      {SUIT_SYMBOLS[suit]}
                    </span>
                    <span className="text-[10px] uppercase tracking-widest text-red-900 font-black">{suitTranslations[suit]}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game Over Modal */}
      <AnimatePresence>
        {gameState.status === 'game_over' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/98 backdrop-blur-xl z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-zinc-950 border-2 border-red-900/50 p-12 rounded-lg max-w-md w-full text-center shadow-[0_0_150px_rgba(220,38,38,0.3)] relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-red-600" />
              <div className="w-24 h-24 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-8 border border-red-600/30">
                <Trophy size={48} className="text-red-600 drop-shadow-[0_0_10px_rgba(220,38,38,0.5)]" />
              </div>
              
              <h2 className="text-5xl font-black mb-4 italic uppercase tracking-tighter text-red-600">
                {gameState.winner === 'player' ? '屠杀结束' : '你被终结'}
              </h2>
              <p className="text-red-900 font-bold mb-12 uppercase tracking-widest text-xs">
                {gameState.winner === 'player' 
                  ? '你在这场血腥博弈中存活到了最后。' 
                  : '你的灵魂已归于牌堆。'}
              </p>
              
              <button
                onClick={startNewGame}
                className="w-full py-5 bg-red-700 hover:bg-red-600 text-black font-black rounded-md transition-all shadow-2xl shadow-red-900/50 flex items-center justify-center gap-3 uppercase tracking-[0.3em] italic"
              >
                再次献祭 <RotateCcw size={22} />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Flying Card Animation Overlay */}
      <AnimatePresence>
        {drawingAnimation && (
          <motion.div
            initial={{ 
              position: 'fixed',
              top: deckRef.current?.getBoundingClientRect().top || '50%',
              left: deckRef.current?.getBoundingClientRect().left || '50%',
              zIndex: 100,
              scale: 1,
              rotate: 0,
              opacity: 1
            }}
            animate={{ 
              top: drawingAnimation.target === 'player' ? '85%' : '10%',
              left: '50%',
              scale: 0.8,
              rotate: drawingAnimation.target === 'player' ? 0 : 180,
              opacity: 0.5
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
          >
            <Card card={drawingAnimation.card} isFaceDown={drawingAnimation.target === 'ai'} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Playing Card Animation Overlay */}
      <AnimatePresence>
        {playingAnimation && (
          <motion.div
            initial={{ 
              position: 'fixed',
              top: playingAnimation.source === 'player' ? '85%' : '10%',
              left: '50%',
              zIndex: 100,
              scale: 0.8,
              rotate: playingAnimation.source === 'player' ? 0 : 180,
              opacity: 0.5
            }}
            animate={{ 
              top: discardRef.current?.getBoundingClientRect().top || '50%',
              left: discardRef.current?.getBoundingClientRect().left || '50%',
              scale: 1,
              rotate: 0,
              opacity: 1
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
          >
            <Card card={playingAnimation.card} isFaceDown={false} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
