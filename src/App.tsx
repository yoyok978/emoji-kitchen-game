import React from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { StartScreen } from './components/StartScreen';
import { SoloGame } from './components/SoloGame';
import { MultiplayerGame } from './components/MultiplayerGame';
import { Leaderboard } from './components/Leaderboard';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#F3F4F6] text-slate-900 font-sans flex flex-col container mx-auto">
        <header className="h-20 bg-white border-b-2 border-slate-200 flex items-center px-4 md:px-8 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-2xl font-bold">🍳</div>
            <h1 className="text-xl font-black tracking-tighter uppercase">Emoji Kitchen <span className="text-indigo-600">Duel</span></h1>
          </div>
        </header>
        <main className="flex-1 w-full p-4 md:p-8">
          <Routes>
            <Route path="/" element={<StartScreen />} />
            <Route path="/solo" element={<SoloGame />} />
            <Route path="/multiplayer" element={<MultiplayerGame />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
