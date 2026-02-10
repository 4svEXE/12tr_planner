
import React, { useState, useEffect, useCallback } from 'react';
import { Task, TaskStatus } from '../../types';
import Card from '../ui/Card';
import Typography from '../ui/Typography';

/**
 * Локальний компонент інпуту для запобігання перестрибуванню фокусу
 */
const GoalInput: React.FC<{ 
  value: string; 
  onUpdate: (val: string) => void;
  placeholder: string;
  isDone: boolean;
}> = ({ value, onUpdate, placeholder, isDone }) => {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
  };

  const handleBlur = () => {
    if (localValue !== value) {
      onUpdate(localValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      // Fix: Cast e.currentTarget to HTMLInputElement to access blur() method
      (e.currentTarget as HTMLInputElement).blur();
    }
  };

  return (
    <input 
      value={localValue} 
      onChange={handleChange}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      className={`flex-1 bg-transparent border-none p-0 text-[10px] font-bold uppercase outline-none focus:ring-0 placeholder:text-slate-200 transition-all ${
        isDone ? 'line-through text-slate-300' : 'text-slate-700'
      }`}
    />
  );
};

interface CycleMonthlyOverviewProps {
  plannerTasks: Task[];
  currentWeek: number;
  selectedWeek: number;
  projectColor: string;
  viewMode?: 'grid' | 'list';
  onSelectWeek: (week: number) => void;
  onUpdateGoal: (week: number, index: number, title: string) => void;
  onToggleTask: (task: Task) => void;
}

const CycleMonthlyOverview: React.FC<CycleMonthlyOverviewProps> = ({ 
  plannerTasks, currentWeek, selectedWeek, projectColor, viewMode = 'grid', onSelectWeek, onUpdateGoal, onToggleTask 
}) => {

  const renderBig3 = (week: number, weekGoals: Task[], isCompact = false) => (
    <div className={`space-y-1 ${isCompact ? 'flex-1 grid grid-cols-1 md:grid-cols-3 gap-2 space-y-0' : ''}`}>
       {[0, 1, 2].map(idx => {
         const goal = weekGoals[idx];
         return (
           <div key={`${week}-${idx}`} className={`flex items-start gap-2 group/goal ${isCompact ? 'bg-black/[0.02] p-1 rounded-lg border border-transparent hover:border-primary/10' : 'bg-black/[0.01] p-1.5 rounded-xl border border-transparent hover:border-primary/10'}`}>
              <button 
                onClick={() => goal && onToggleTask(goal)} 
                className={`w-3.5 h-3.5 rounded border mt-0.5 shrink-0 flex items-center justify-center transition-all ${
                  goal?.status === TaskStatus.DONE ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200 bg-white'
                }`}
                style={goal?.status === TaskStatus.DONE ? { backgroundColor: projectColor, borderColor: projectColor } : {}}
              >
                {goal?.status === TaskStatus.DONE && <i className="fa-solid fa-check text-[7px]"></i>}
              </button>
              <GoalInput 
                value={goal?.title || ''} 
                onUpdate={(val) => onUpdateGoal(week, idx, val)}
                placeholder={`Ціль #${idx + 1}...`}
                isDone={goal?.status === TaskStatus.DONE}
              />
           </div>
         );
       })}
    </div>
  );

  const renderMilestone = (week: number) => {
    if (week === 6) return (
      <div className="absolute top-1 left-1/2 -translate-x-1/2 z-20">
         <span className="bg-amber-500 text-white text-[5px] font-black px-1.5 py-0.5 rounded-full shadow-sm uppercase tracking-tighter">Mid-Review</span>
      </div>
    );
    if (week === 12) return (
      <div className="absolute top-1 left-1/2 -translate-x-1/2 z-20">
         <span className="bg-rose-600 text-white text-[5px] font-black px-1.5 py-0.5 rounded-full shadow-sm uppercase tracking-tighter">Final Push</span>
      </div>
    );
    return null;
  };

  if (viewMode === 'list') {
    return (
      <div className="space-y-1.5 animate-in fade-in slide-in-from-bottom-2 duration-500">
        {Array.from({ length: 12 }, (_, i) => i + 1).map(week => {
          const weekGoals = plannerTasks.filter(t => t.tags.includes('weekly-goal') && t.plannerWeek === week).slice(0, 3);
          const weekTotal = plannerTasks.filter(t => t.plannerWeek === week).length;
          const weekDone = plannerTasks.filter(t => t.plannerWeek === week && t.status === TaskStatus.DONE).length;
          const percent = weekTotal > 0 ? Math.round((weekDone / weekTotal) * 100) : 0;
          const isCurrent = week === currentWeek;

          return (
            <Card 
              key={week} 
              padding="none" 
              className={`bg-card border-theme rounded-xl overflow-hidden flex flex-col md:flex-row items-center gap-3 p-2 transition-all group relative ${
                isCurrent ? 'ring-1 ring-primary shadow-sm' : 'hover:border-primary/20'
              }`}
            >
              {(week === 6 || week === 12) && (
                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-amber-500 opacity-40"></div>
              )}
              
              <div 
                onClick={() => onSelectWeek(week)}
                className="flex items-center gap-3 shrink-0 cursor-pointer min-w-[100px]"
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[9px] font-black text-white shadow-sm ${isCurrent ? 'bg-primary' : 'bg-slate-800 opacity-60'}`} style={isCurrent ? { backgroundColor: projectColor } : {}}>
                  W{week}
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-black uppercase text-main opacity-60 leading-none">Week {week}</span>
                  {week === 6 && <span className="text-[5px] font-black text-amber-600 uppercase mt-0.5">Checkpoint</span>}
                  {week === 12 && <span className="text-[5px] font-black text-rose-600 uppercase mt-0.5">Deadline</span>}
                </div>
              </div>

              <div className="flex-1 w-full md:w-auto">
                {renderBig3(week, weekGoals, true)}
              </div>

              <div className="flex items-center gap-3 shrink-0 min-w-[80px] justify-end">
                <div className="flex flex-col items-end">
                   <div className="flex items-center gap-1">
                      <i className="fa-solid fa-bolt text-[6px] text-slate-300"></i>
                      <span className="text-[8px] font-black text-primary" style={{ color: projectColor }}>{percent}%</span>
                   </div>
                   <div className="h-0.5 w-12 bg-slate-100 rounded-full overflow-hidden mt-0.5">
                     <div className="h-full bg-primary" style={{ width: `${percent}%`, backgroundColor: projectColor }}></div>
                   </div>
                </div>
                <button onClick={() => onSelectWeek(week)} className="w-7 h-7 rounded-lg bg-black/5 hover:bg-primary hover:text-white transition-all text-slate-400">
                  <i className="fa-solid fa-chevron-right text-[9px]"></i>
                </button>
              </div>
            </Card>
          );
        })}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {Array.from({ length: 12 }, (_, i) => i + 1).map(week => {
        const weekGoals = plannerTasks.filter(t => t.tags.includes('weekly-goal') && t.plannerWeek === week).slice(0, 3);
        const weekTotal = plannerTasks.filter(t => t.plannerWeek === week).length;
        const weekDone = plannerTasks.filter(t => t.plannerWeek === week && t.status === TaskStatus.DONE).length;
        const percent = weekTotal > 0 ? Math.round((weekDone / weekTotal) * 100) : 0;
        const isCurrent = week === currentWeek;

        return (
          <Card 
            key={week} 
            padding="none" 
            className={`bg-card border-theme rounded-[1.5rem] overflow-hidden flex flex-col transition-all group relative ${
              isCurrent ? 'ring-1 ring-primary shadow-lg scale-[1.01]' : 'hover:shadow-md hover:border-primary/20'
            }`}
          >
            {renderMilestone(week)}

            <div 
              onClick={() => onSelectWeek(week)}
              className="p-3 border-b border-theme flex justify-between items-center cursor-pointer bg-black/[0.01] group-hover:bg-black/[0.03] transition-colors"
            >
               <div className="flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[9px] font-black text-white shadow-sm ${isCurrent ? 'bg-primary' : 'bg-slate-800 opacity-60'}`} style={isCurrent ? { backgroundColor: projectColor } : {}}>
                    W{week}
                  </div>
                  <span className="text-[10px] font-black uppercase text-main">Тиждень {week}</span>
               </div>
               <div className="flex flex-col items-end">
                  <span className="text-[9px] font-black text-primary" style={{ color: projectColor }}>{percent}%</span>
                  <div className="h-0.5 w-10 bg-slate-100 rounded-full overflow-hidden mt-0.5">
                    <div className="h-full bg-primary" style={{ width: `${percent}%`, backgroundColor: projectColor }}></div>
                  </div>
               </div>
            </div>

            <div className="flex-1 p-3 space-y-2 bg-white/50">
               {renderBig3(week, weekGoals)}
            </div>
            
            <div className="px-3 pb-2 flex justify-between items-center opacity-40">
               <div className="flex items-center gap-1">
                  <i className="fa-solid fa-list-check text-[6px]"></i>
                  <span className="text-[6px] font-black uppercase">Tactics: {weekDone}/{weekTotal}</span>
               </div>
               {percent >= 80 && <i className="fa-solid fa-trophy text-[7px] text-amber-500"></i>}
            </div>

            <button 
              onClick={() => onSelectWeek(week)}
              className="p-1.5 text-[6px] font-black uppercase tracking-widest text-slate-400 border-t border-theme hover:text-primary transition-colors text-center bg-black/[0.01]"
            >
              ПЛАН ТИЖНЯ <i className="fa-solid fa-arrow-right ml-1"></i>
            </button>
          </Card>
        );
      })}
    </div>
  );
};

export default CycleMonthlyOverview;
