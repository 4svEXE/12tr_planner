
import React from 'react';
import Card from '../ui/Card';
import Typography from '../ui/Typography';
import { Character, Task } from '../../types';

interface StatGridProps {
  character: Character;
  tasks: Task[];
  period: 'day' | 'week' | 'month' | 'year';
  onPeriodChange: (period: 'day' | 'week' | 'month' | 'year') => void;
}

const StatGrid: React.FC<StatGridProps> = ({ character, tasks, period, onPeriodChange }) => {
  const spheres = [
    { key: 'health', label: 'Здоров\'я', icon: 'fa-heart-pulse', color: 'rose' },
    { key: 'career', label: 'Кар\'єра', icon: 'fa-briefcase', color: 'indigo' },
    { key: 'finance', label: 'Фінанси', icon: 'fa-coins', color: 'emerald' },
    { key: 'rest', label: 'Відпочинок', icon: 'fa-couch', color: 'cyan' },
  ];

  return (
    <Card padding="md" className="border-slate-100 flex flex-col h-full bg-white shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <Typography variant="caption">Прогрес за</Typography>
        <div className="flex bg-slate-50 p-0.5 rounded-lg border border-slate-100">
          {(['day', 'week', 'month'] as const).map(p => (
            <button 
              key={p} 
              onClick={() => onPeriodChange(p)}
              className={`px-3 py-1 text-[8px] font-black uppercase rounded-md transition-all ${period === p ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              {p === 'day' ? 'День' : p === 'week' ? 'Тиждень' : 'Місяць'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 flex-1">
        {spheres.map(sphere => {
          const val = (character.stats as any)[sphere.key] || 0;
          return (
            <div key={sphere.key} className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <i className={`fa-solid ${sphere.icon} text-[10px] text-slate-300`}></i>
                  <span className="text-[10px] font-black uppercase text-slate-700">{sphere.label}</span>
                </div>
                <span className="text-[10px] font-black text-slate-400">{val}%</span>
              </div>
              <div className="h-1.5 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                <div 
                  className={`h-full bg-gradient-to-r transition-all duration-1000 ${
                    sphere.color === 'rose' ? 'from-rose-400 to-rose-500' :
                    sphere.color === 'indigo' ? 'from-indigo-400 to-indigo-500' :
                    sphere.color === 'emerald' ? 'from-emerald-400 to-emerald-500' :
                    'from-cyan-400 to-cyan-500'
                  }`}
                  style={{ width: `${val}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-6 pt-4 border-t border-slate-50 flex justify-between items-center">
        <div className="flex flex-col">
          <span className="text-[8px] font-black text-slate-300 uppercase">Рівень Енергії</span>
          <span className="text-sm font-black text-slate-800">{character.energy}%</span>
        </div>
        <div className="flex flex-col text-right">
          <span className="text-[8px] font-black text-slate-300 uppercase">Виконано квестів</span>
          <span className="text-sm font-black text-emerald-600">{tasks.filter(t => t.status === 'DONE').length}</span>
        </div>
      </div>
    </Card>
  );
};

export default StatGrid;
