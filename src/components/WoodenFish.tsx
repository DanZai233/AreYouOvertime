import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export default function WoodenFish() {
  const [clicks, setClicks] = useState<{ id: number; x: number; y: number }[]>([]);
  const [totalMerit, setTotalMerit] = useState(() => {
    const saved = localStorage.getItem('jialeme_merit');
    return saved ? parseInt(saved, 10) : 0;
  });

  useEffect(() => {
    localStorage.setItem('jialeme_merit', totalMerit.toString());
  }, [totalMerit]);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setClicks(prev => [...prev, { id: Date.now(), x, y }]);
    setTotalMerit(prev => prev + 1);

    // Play a subtle sound if possible (optional, might be blocked by browser policy)
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.1);
    } catch (err) {
      // Ignore audio errors
    }
  };

  // Cleanup old clicks
  useEffect(() => {
    if (clicks.length > 0) {
      const timer = setTimeout(() => {
        setClicks(prev => prev.slice(1));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [clicks]);

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-center gap-2">
      <div className="bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-emerald-700 shadow-sm border border-emerald-100">
        功德: {totalMerit}
      </div>
      <button
        onClick={handleClick}
        className="relative w-16 h-16 bg-amber-100 rounded-full shadow-lg border-4 border-amber-200 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
        title="敲击木鱼，积攒功德"
      >
        <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center shadow-inner">
          <div className="w-6 h-2 bg-amber-600 rounded-full"></div>
        </div>
        
        <AnimatePresence>
          {clicks.map(click => (
            <motion.div
              key={click.id}
              initial={{ opacity: 1, y: 0, scale: 0.8 }}
              animate={{ opacity: 0, y: -40, scale: 1.2 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="absolute pointer-events-none text-amber-600 font-bold text-sm whitespace-nowrap"
              style={{ left: click.x - 20, top: click.y - 20 }}
            >
              功德 +1
            </motion.div>
          ))}
        </AnimatePresence>
      </button>
    </div>
  );
}
