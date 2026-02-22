import React from 'react';
import { motion } from 'motion/react';
import { CardData, Suit } from '../types';
import { SUIT_SYMBOLS, SUIT_COLORS } from '../constants';

interface CardProps {
  card: CardData;
  isFaceDown?: boolean;
  onClick?: () => void;
  isPlayable?: boolean;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ 
  card, 
  isFaceDown = false, 
  onClick, 
  isPlayable = false,
  className = "" 
}) => {
  return (
    <motion.div
      layout
      initial={{ scale: 0.8, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      whileHover={isPlayable ? { y: -10, scale: 1.05 } : {}}
      onClick={isPlayable ? onClick : undefined}
      className={`
        relative w-20 h-28 sm:w-24 sm:h-36 rounded-lg border flex flex-col items-center justify-center bg-zinc-950
        ${isPlayable ? 'cursor-pointer border-red-600 shadow-[0_0_20px_rgba(220,38,38,0.4)]' : 'border-white/5'}
        ${isFaceDown ? 'bg-zinc-900 border-red-900/30' : ''}
        ${className}
      `}
    >
      {isFaceDown ? (
        <div className="w-full h-full flex items-center justify-center overflow-hidden relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(153,27,27,0.2),transparent_70%)]" />
          <div className="w-12 h-16 sm:w-16 sm:h-24 border border-red-900/20 rounded-md flex items-center justify-center bg-black/40 backdrop-blur-sm">
             <div className="text-red-700 font-black text-3xl italic drop-shadow-lg">8</div>
          </div>
          {/* Blood splatter effect */}
          <div className="absolute top-2 right-2 w-4 h-4 bg-red-900/40 rounded-full blur-md" />
          <div className="absolute bottom-4 left-3 w-6 h-6 bg-red-900/20 rounded-full blur-lg" />
        </div>
      ) : (
        <>
          <div className={`absolute top-1 left-2 text-sm sm:text-lg font-bold ${SUIT_COLORS[card.suit]}`}>
            {card.rank}
          </div>
          <div className={`text-3xl sm:text-5xl ${SUIT_COLORS[card.suit]}`}>
            {SUIT_SYMBOLS[card.suit]}
          </div>
          <div className={`absolute bottom-1 right-2 text-sm sm:text-lg font-bold rotate-180 ${SUIT_COLORS[card.suit]}`}>
            {card.rank}
          </div>
        </>
      )}
    </motion.div>
  );
};
