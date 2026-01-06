
import React, { useState, useEffect } from 'react';

const GRID_SIZE = 10;

const StrategyMap: React.FC = () => {
  const [fog, setFog] = useState<boolean[][]>(
    Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(true))
  );

  const unlockTile = (r: number, c: number) => {
    const newFog = [...fog];
    newFog[r] = [...newFog[r]];
    newFog[r][c] = false;
    setFog(newFog);
  };

  return (
    <div className="p-8 h-full bg-slate-950 overflow-auto">
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-heading font-bold text-white">Прихований Світ</h2>
          <p className="text-slate-400">Виконуйте завдання, щоб досліджувати нові території та знаходити скарби.</p>
        </div>
        <div className="bg-slate-900 px-6 py-2 rounded-full border border-slate-800 text-yellow-400 font-bold flex items-center gap-3">
          <i className="fa-solid fa-compass"></i> Дослідження: 12%
        </div>
      </div>

      <div className="inline-grid grid-cols-5 md:grid-cols-10 gap-2 bg-slate-900/50 p-4 rounded-3xl shadow-2xl border border-slate-800 backdrop-blur-md">
        {fog.map((row, r) =>
          row.map((isFoggy, c) => (
            <div
              key={`${r}-${c}`}
              onClick={() => unlockTile(r, c)}
              className={`w-14 h-14 md:w-20 md:h-20 rounded-xl cursor-pointer flex items-center justify-center relative overflow-hidden group ${
                isFoggy 
                  ? 'bg-slate-800 border border-slate-700 hover:bg-slate-700' 
                  : 'bg-emerald-900/20 border border-emerald-500/30 shadow-[inset_0_0_20px_rgba(16,185,129,0.1)]'
              }`}
            >
              {isFoggy ? (
                <div className="text-slate-600 group-hover:scale-125">
                  <i className="fa-solid fa-cloud"></i>
                </div>
              ) : (
                <div className="text-2xl text-white">
                  {Math.random() > 0.9 ? (
                    <i className="fa-solid fa-gem text-cyan-400"></i>
                  ) : Math.random() > 0.7 ? (
                    <i className="fa-solid fa-tree text-emerald-500"></i>
                  ) : (
                    <i className="fa-solid fa-chess-rook text-slate-400"></i>
                  )}
                </div>
              )}
              {isFoggy && (
                <div className="absolute inset-0 bg-gradient-to-tr from-black/40 to-transparent pointer-events-none"></div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default StrategyMap;
