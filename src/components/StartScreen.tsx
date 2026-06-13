import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Leaderboard } from './Leaderboard';

export function StartScreen() {
  const navigate = useNavigate();
  const [name, setName] = useState(localStorage.getItem('playerName') || '');
  const [optionsCount, setOptionsCount] = useState(localStorage.getItem('optionsCount') || '16');

  const startSolo = () => {
    if (!name.trim()) return alert("Enter your name first!");
    localStorage.setItem('playerName', name);
    localStorage.setItem('optionsCount', optionsCount);
    navigate('/solo');
  };

  const startMultiplayer = () => {
    if (!name.trim()) return alert("Enter your name first!");
    localStorage.setItem('playerName', name);
    localStorage.setItem('optionsCount', optionsCount);
    navigate('/multiplayer');
  };

  return (
    <div className="flex flex-col md:flex-row gap-8">
      <div className="flex-1 space-y-6">
        <div className="bg-white border-2 border-slate-200 p-8 rounded-2xl shadow-sm">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Welcome Chef</h2>
          <p className="text-slate-600 mb-6 font-medium">
            Identify the two emojis that make up the combined recipe before time runs out.
          </p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Your Name</label>
              <input 
                type="text" 
                value={name}
                onChange={e => setName(e.target.value)}
                maxLength={20}
                className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-bold focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                placeholder="Enter chef name..."
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 mt-4">Number of Ingredients (Difficulty)</label>
              <select 
                value={optionsCount}
                onChange={e => setOptionsCount(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-bold focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="8">8 (Easy)</option>
                  <option value="16">16 (Medium)</option>
                  <option value="24">24 (Hard)</option>
                  <option value="40">40 (Master)</option>
              </select>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              <button 
                onClick={startSolo}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg shadow-indigo-200 active:scale-95 tracking-wide uppercase text-sm"
              >
                ⏱️ Play Solo (60s)
              </button>
              
              <button 
                onClick={startMultiplayer}
                className="bg-slate-900 hover:bg-black text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg shadow-slate-200 active:scale-95 flex flex-col items-center justify-center gap-1 uppercase text-sm tracking-wide"
              >
                <span>⚔️ Head-to-Head</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex-1">
        <Leaderboard />
      </div>
    </div>
  );
}
