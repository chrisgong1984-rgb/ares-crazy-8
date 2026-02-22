import React from 'react';
import { motion } from 'motion/react';
import { ChevronRight, Skull, Swords } from 'lucide-react';

interface StartScreenProps {
  onStart: () => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({ onStart }) => {
  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(153,27,27,0.15),transparent_70%)]" />
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/asfalt-dark.png')] opacity-20" />
        
        {/* Animated Blood Drips */}
        <motion.div 
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          transition={{ duration: 2, ease: "easeOut" }}
          className="absolute top-0 left-[10%] w-1 h-32 bg-gradient-to-b from-red-900 to-transparent opacity-40 blur-sm"
        />
        <motion.div 
          initial={{ y: -150 }}
          animate={{ y: 0 }}
          transition={{ duration: 3, ease: "easeOut", delay: 0.5 }}
          className="absolute top-0 right-[20%] w-1.5 h-48 bg-gradient-to-b from-red-800 to-transparent opacity-30 blur-md"
        />
      </div>

      {/* Content */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 flex flex-col items-center text-center px-4"
      >
        <motion.div 
          animate={{ 
            filter: ["drop-shadow(0 0 10px rgba(220,38,38,0.3))", "drop-shadow(0 0 25px rgba(220,38,38,0.6))", "drop-shadow(0 0 10px rgba(220,38,38,0.3))"] 
          }}
          transition={{ duration: 2, repeat: Infinity }}
          className="mb-6"
        >
          <Skull size={64} className="text-red-700" />
        </motion.div>

        <h1 className="text-6xl sm:text-8xl font-black italic uppercase tracking-tighter text-red-600 mb-12 drop-shadow-[0_5px_15px_rgba(0,0,0,1)]">
          Ares' <span className="text-zinc-100">Crazy 8s</span>
        </h1>

        <div className="flex flex-col gap-6 w-full max-w-xs">
          <motion.button
            whileHover={{ scale: 1.05, backgroundColor: "rgb(185, 28, 28)" }}
            whileTap={{ scale: 0.95 }}
            onClick={onStart}
            className="group relative py-5 bg-red-700 text-black font-black rounded-lg shadow-[0_0_40px_rgba(185,28,28,0.4)] transition-all flex items-center justify-center gap-3 uppercase tracking-[0.3em] italic text-lg overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
            开始杀戮 <ChevronRight size={24} />
          </motion.button>

          <div className="flex items-center justify-center gap-8 text-red-900/40 font-black text-[10px] uppercase tracking-widest">
            <div className="flex items-center gap-2">
              <Swords size={12} />
              <span>AI 对决</span>
            </div>
            <div className="flex items-center gap-2">
              <Skull size={12} />
              <span>死亡规则</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Footer Info */}
      <div className="absolute bottom-8 text-zinc-800 text-[9px] uppercase font-black tracking-[0.4em] flex flex-col items-center gap-2">
        <span>© 2026 ARES GAMING SYNDICATE</span>
        <div className="w-32 h-px bg-zinc-900" />
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}} />
    </div>
  );
};
