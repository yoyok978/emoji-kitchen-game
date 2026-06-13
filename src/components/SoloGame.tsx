import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import combinationsRaw from '../data/combinations.json';

export function SoloGame() {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(60);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState<'playing' | 'finished'>('playing');
  const [currentRound, setCurrentRound] = useState<any>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);

  const name = localStorage.getItem('playerName') || 'Anonymous';

  const generateRound = () => {
    let target = combinationsRaw[Math.floor(Math.random() * combinationsRaw.length)] as any;
    // ensure target doesn't have same left and right emoji as we don't support same emoji twice in UI currently
    while (target.leftEmoji === target.rightEmoji) {
      target = combinationsRaw[Math.floor(Math.random() * combinationsRaw.length)] as any;
    }
    
    const optionsCount = parseInt(localStorage.getItem('optionsCount') || '16', 10);
    const pool = new Set([target.leftEmoji, target.rightEmoji]);
    while (pool.size < optionsCount) {
      const r = combinationsRaw[Math.floor(Math.random() * combinationsRaw.length)] as any;
      pool.add(r.leftEmoji);
      pool.add(r.rightEmoji);
    }
    const options = Array.from(pool).slice(0, optionsCount).sort(() => Math.random() - 0.5);
    setCurrentRound({
      targetImg: target.url,
      options,
      correct: [target.leftEmoji, target.rightEmoji]
    });
    setSelected([]);
    setFeedback(null);
  };

  useEffect(() => {
    generateRound();
  }, []);

  const hasSubmitted = useRef(false);

  useEffect(() => {
    if (gameState !== 'playing') return;
    const interval = setInterval(() => {
      setTimeLeft(t => t - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [gameState]);

  useEffect(() => {
    if (gameState === 'playing' && timeLeft <= 0) {
      setGameState('finished');
      if (!hasSubmitted.current) {
        hasSubmitted.current = true;
        fetch('/api/leaderboard', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, score })
        }).catch(console.error);
      }
    }
  }, [gameState, timeLeft, name, score]);

  const handleSelect = (emoji: string) => {
    if (feedback) return; // waiting for animation
    
    if (selected.includes(emoji)) {
      setSelected(selected.filter(e => e !== emoji));
      return;
    }
    
    const newSelected = [...selected, emoji];
    setSelected(newSelected);
    
    if (newSelected.length === 2) {
      // check
      const isCorrect = newSelected.every(e => currentRound.correct.includes(e));
      if (isCorrect) {
        setFeedback('correct');
        setScore(s => s + 10);
        setTimeout(() => {
          generateRound();
        }, 500);
      } else {
        setFeedback('incorrect');
        setTimeout(() => {
          setSelected([]);
          setFeedback(null);
        }, 500);
      }
    }
  };

  if (!currentRound) return null;

  return (
    <div className="max-w-2xl mx-auto">
      {gameState === 'finished' ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-8 rounded-2xl border-2 border-slate-200 text-center space-y-6 shadow-sm"
          >
            <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Game Over</h2>
            <div className="text-6xl font-black text-indigo-600 my-4">{score}</div>
            <p className="text-slate-600 font-bold">Great job, Chef {name}!</p>
            <div className="flex justify-center gap-4 pt-4">
              <button 
                onClick={() => navigate('/')}
                className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-6 py-3 rounded-lg font-bold transition-colors uppercase text-xs tracking-wide"
              >
                Back to Menu
              </button>
              <button 
                onClick={() => {
                  setScore(0);
                  setTimeLeft(60);
                  hasSubmitted.current = false;
                  setGameState('playing');
                  generateRound();
                }}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-lg font-bold transition-colors shadow-lg shadow-indigo-200 uppercase text-xs tracking-wide"
              >
                Play Again
              </button>
            </div>
          </motion.div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-3 sm:p-4 mx-auto w-full md:max-w-xl rounded-2xl border-2 border-slate-200 shadow-sm">
            <div className="text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Current Score</p>
              <p className="text-xl sm:text-2xl font-mono font-bold text-slate-900">{score}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Time Remaining</p>
              <p className={`text-xl sm:text-2xl font-mono font-bold ${timeLeft < 10 ? 'text-rose-500 animate-pulse' : 'text-slate-900'}`}>{timeLeft}</p>
            </div>
          </div>

            <div className="flex flex-col items-center gap-2 sm:gap-4">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] text-center">Identify the Ingredients</div>
            <motion.div 
              key={currentRound.targetImg}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', bounce: 0.5 }}
              className={`${currentRound.options.length > 24 ? 'w-24 h-24 sm:w-32 sm:h-32 rounded-2xl sm:rounded-3xl' : 'w-40 h-40 sm:w-56 sm:h-56 rounded-3xl sm:rounded-[40px]'} bg-white border-4 border-indigo-500 shadow-xl flex items-center justify-center text-8xl shadow-indigo-100 relative shrink-0`}
            >
              <img src={currentRound.targetImg} alt="Target" className="w-full h-full object-contain p-2" crossOrigin="anonymous" />
              {feedback === 'correct' && (
                <motion.div 
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={`${currentRound.options.length > 24 ? 'rounded-2xl sm:rounded-3xl' : 'rounded-3xl sm:rounded-[40px]'} absolute inset-0 bg-green-50/80 border-4 border-green-500 z-10 flex items-center justify-center text-4xl mt-0`}
                >
                  ✅
                </motion.div>
              )}
              {feedback === 'incorrect' && (
                <motion.div 
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={`${currentRound.options.length > 24 ? 'rounded-2xl sm:rounded-3xl' : 'rounded-3xl sm:rounded-[40px]'} absolute inset-0 bg-rose-50/80 border-4 border-rose-500 z-10 flex items-center justify-center text-4xl mt-0`}
                >
                  ❌
                </motion.div>
              )}
            </motion.div>

            <div className="text-center space-y-1">
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Select 2 ingredients</p>
            </div>

            <div className="flex flex-wrap justify-center gap-1 sm:gap-2 w-full max-w-3xl">
              {currentRound.options.map((emoji: string, i: number) => {
                const isSelected = selected.includes(emoji);
                const optionsCount = currentRound.options.length;
                const sizeClass = optionsCount > 24 ? 'w-8 h-8 text-base sm:w-11 sm:h-11 sm:text-2xl rounded-lg' : 
                                  optionsCount > 16 ? 'w-10 h-10 text-xl sm:w-14 sm:h-14 sm:text-3xl rounded-xl' : 
                                  'w-14 h-14 text-3xl sm:w-20 sm:h-20 sm:text-4xl rounded-2xl';
                return (
                  <button
                    key={`${emoji}-${i}`}
                    onClick={() => handleSelect(emoji)}
                    className={`${sizeClass} flex items-center justify-center transition-all duration-200 
                      ${isSelected ? 'bg-indigo-50 border-2 border-indigo-500 ring-2 ring-indigo-50 shadow-md scale-95' : 'bg-white border-2 border-slate-200 hover:border-indigo-500 hover:shadow-lg'} 
                    `}
                  >
                    {emoji}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
