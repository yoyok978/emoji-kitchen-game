import React, { useEffect, useState } from 'react';

export function Leaderboard() {
  const [scores, setScores] = useState<{name: string, score: number, date: string}[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/leaderboard')
      .then(r => r.json())
      .then(data => {
        setScores(data);
        setLoading(false);
      })
      .catch(e => {
        console.error(e);
        setLoading(false);
      });
  }, []);

  return (
    <div className="bg-white p-6 rounded-2xl border-2 border-slate-200 h-full">
      <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
        Global Leaderboard
      </h2>
      
      {loading ? (
        <div className="text-slate-400 animate-pulse">Loading scores...</div>
      ) : scores.length === 0 ? (
        <div className="text-slate-400 text-sm">No scores yet. Be the first!</div>
      ) : (
        <div className="space-y-3">
          {scores.map((s, i) => (
            <div key={i} className="flex justify-between items-center p-3 bg-slate-50 border border-slate-100 rounded-lg">
              <div className="flex items-center gap-3">
                <span className={`font-mono font-bold w-6 text-center ${i === 0 ? 'text-yellow-500' : i === 1 ? 'text-slate-500' : i === 2 ? 'text-amber-700' : 'text-slate-400'}`}>
                  #{i + 1}
                </span>
                <span className="font-bold text-sm truncate max-w-[150px] sm:max-w-xs">{s.name}</span>
              </div>
              <span className="font-mono font-bold text-slate-600">{s.score} pts</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
