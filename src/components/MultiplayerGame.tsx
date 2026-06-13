import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { io, Socket } from 'socket.io-client';

export function MultiplayerGame() {
  const navigate = useNavigate();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [roomId, setRoomId] = useState('');
  const [inRoom, setInRoom] = useState(false);
  const [roomState, setRoomState] = useState<any>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  
  const name = localStorage.getItem('playerName') || 'Anonymous';

  useEffect(() => {
    const s = io('/', { transports: ['websocket'] });
    setSocket(s);
    
    s.on('room_update', (room) => {
      setRoomState(room);
    });
    
    s.on('room_error', (err) => {
      alert(err);
      setInRoom(false);
    });
    
    s.on('game_start', (room) => {
      setRoomState(room);
      setSelected([]);
      setFeedback(null);
    });
    
    s.on('round_won', ({ winner, nextRound, room }) => {
      if (winner === s.id) {
        setFeedback('correct');
      } else {
        setFeedback('incorrect'); // someone else won it
      }
      setTimeout(() => {
        setRoomState(room);
        setSelected([]);
        setFeedback(null);
      }, 1000);
    });
    
    s.on('guess_incorrect', () => {
      setFeedback('incorrect');
      setTimeout(() => {
        setSelected([]);
        setFeedback(null);
      }, 500);
    });
    
    s.on('game_finished', (room) => {
      setRoomState(room);
    });

    s.on('player_left', (room) => {
      setRoomState(room);
      alert("Opponent left the game!");
    });
    
    return () => { s.disconnect() };
  }, []);

  const joinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomId.trim() || !socket) return;
    const optionsCount = parseInt(localStorage.getItem('optionsCount') || '16', 10);
    socket.emit('join_room', { roomId, name, optionsCount });
    setInRoom(true);
  };
  
  const toggleReady = () => {
    if (!socket || !roomState) return;
    socket.emit('ready', { roomId: roomState.id });
  };

  const handleSelect = (emoji: string) => {
    if (feedback || !socket || roomState?.state !== 'playing') return; 
    
    if (selected.includes(emoji)) {
      setSelected(selected.filter(e => e !== emoji));
      return;
    }
    
    const newSelected = [...selected, emoji];
    setSelected(newSelected);
    
    if (newSelected.length === 2) {
      socket.emit('submit_guess', { roomId: roomState.id, guess: newSelected });
    }
  };

  if (!inRoom || !roomState) {
    return (
      <div className="max-w-md mx-auto bg-white border-2 border-slate-200 p-8 rounded-2xl shadow-sm">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 text-center">
          Head to Head
        </h2>
        <form onSubmit={joinRoom} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Room Code</label>
            <input 
              type="text" 
              value={roomId}
              onChange={e => setRoomId(e.target.value.toUpperCase())}
              placeholder="e.g. KITCHEN123"
              className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-bold uppercase focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
            />
          </div>
          <button type="submit" className="w-full bg-slate-900 hover:bg-black text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-slate-200 active:scale-95 uppercase text-sm tracking-wide">
            Join Room
          </button>
        </form>
      </div>
    );
  }

  if (roomState.state === 'waiting') {
    const me = roomState.players.find((p:any) => p.id === socket?.id);
    const op = roomState.players.find((p:any) => p.id !== socket?.id);
    
    return (
      <div className="max-w-md mx-auto text-center space-y-6">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
          Room: <span className="text-slate-900 bg-slate-100 px-3 py-1 rounded-md ml-2">{roomState.id}</span>
        </h2>
        
        <div className="grid grid-cols-2 gap-4">
          <div className={`p-4 rounded-xl border-2 ${me?.ready ? 'border-green-500 bg-green-50' : 'border-slate-200 bg-white'}`}>
            <div className="text-2xl mb-2">{me?.ready ? '✅' : '⏳'}</div>
            <div className="font-bold text-sm truncate">{me?.name}</div>
            <div className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mt-1">You</div>
          </div>
          <div className={`p-4 rounded-xl border-2 ${op ? (op.ready ? 'border-green-500 bg-green-50' : 'border-slate-200 bg-white') : 'border-dashed border-slate-200 bg-transparent'}`}>
            <div className="text-2xl mb-2">{!op ? '👀' : (op.ready ? '✅' : '⏳')}</div>
            <div className="font-bold text-sm truncate">{op ? op.name : 'Waiting...'}</div>
            <div className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mt-1">Opponent</div>
          </div>
        </div>
        
        {!me?.ready && (
           <button onClick={toggleReady} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-200 active:scale-95 uppercase text-sm tracking-wide transition-all mt-4">
             I'm Ready!
           </button>
        )}
        {me?.ready && (
          <p className="text-slate-400 animate-pulse pt-4 text-xs font-bold uppercase tracking-widest">Waiting for opponent...</p>
        )}
      </div>
    );
  }

  const currentRound = roomState.rounds[roomState.currentRound];

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex justify-between items-center bg-white p-3 sm:p-4 mx-auto w-full md:max-w-xl rounded-2xl border-2 border-slate-200 shadow-sm">
        {roomState.players.map((p:any) => (
          <div key={p.id} className={`flex items-center gap-2 sm:gap-4 ${p.id === socket?.id ? 'text-indigo-600' : 'text-rose-500'}`}>
            <div className="text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{p.name || 'Anonymous'}</p>
              <p className="text-xl sm:text-2xl font-mono font-bold">{p.score}</p>
            </div>
          </div>
        ))}
      </div>

      {roomState.state === 'finished' ? (
         <div className="bg-white p-8 rounded-2xl border-2 border-slate-200 text-center space-y-6 shadow-sm">
           <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Game Over</h2>
           {(() => {
             const points = roomState.players.map((p:any) => p.score);
             const myScore = roomState.players.find((p:any) => p.id === socket?.id)?.score;
             const maxScore = Math.max(...points);
             const isTie = points[0] === points[1];
             if (isTie) return <div className="text-3xl font-black text-amber-500">It's a Tie!</div>;
             if (myScore === maxScore) return <div className="text-3xl font-black text-green-500">🏆 You Won!</div>;
             return <div className="text-3xl font-black text-rose-500">💀 You Lost!</div>;
           })()}
           <div className="pt-8">
             <button onClick={() => navigate('/')} className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-6 py-3 rounded-lg font-bold transition-colors uppercase text-xs tracking-wide">
               Back to Menu
             </button>
           </div>
         </div>
      ) : currentRound ? (
        <div className="flex flex-col items-center gap-2 sm:gap-4">
          <div className="text-slate-400 font-mono text-[10px] tracking-widest uppercase font-bold">Round {roomState.currentRound + 1} / 10</div>
          
          <motion.div 
            key={`multi-${roomState.currentRound}`}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`${currentRound.options.length > 24 ? 'w-24 h-24 sm:w-32 sm:h-32 rounded-2xl sm:rounded-3xl' : 'w-40 h-40 sm:w-56 sm:h-56 rounded-3xl sm:rounded-[40px]'} bg-white border-4 border-indigo-500 shadow-xl flex items-center justify-center text-8xl shadow-indigo-100 relative shrink-0`}
          >
            <img src={currentRound.targetImg} alt="Target" className="w-full h-full object-contain p-2" crossOrigin="anonymous" />
            {feedback === 'correct' && (
              <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={`${currentRound.options.length > 24 ? 'rounded-2xl sm:rounded-3xl' : 'rounded-3xl sm:rounded-[40px]'} absolute inset-0 bg-green-50/80 border-4 border-green-500 z-10 flex items-center justify-center text-4xl mt-0`}>
                ✅
              </motion.div>
            )}
            {feedback === 'incorrect' && (
              <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={`${currentRound.options.length > 24 ? 'rounded-2xl sm:rounded-3xl' : 'rounded-3xl sm:rounded-[40px]'} absolute inset-0 bg-rose-50/80 border-4 border-rose-500 z-10 flex items-center justify-center text-4xl mt-0`}>
                ❌
              </motion.div>
            )}
          </motion.div>

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
      ) : null}
    </div>
  );
}
