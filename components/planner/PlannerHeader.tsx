
import React from 'react';
import Typography from '../ui/Typography';
import Badge from '../ui/Badge';
import { Project } from '../../types';

interface PlannerHeaderProps {
  monthlyProject: Project | undefined;
  onUpdateProject: (updates: Partial<Project>) => void;
  weekNum: number;
  weekEfficiency: number;
  onToggleNotes?: () => void;
  isNotesOpen?: boolean;
}

const PlannerHeader: React.FC<PlannerHeaderProps> = ({ 
  monthlyProject, 
  onUpdateProject, 
  weekNum, 
  weekEfficiency,
  onToggleNotes,
  isNotesOpen
}) => {
  if (!monthlyProject) return null;

  const isGlobal = monthlyProject.id === 'planner_strategic_config';
  const startDateStr = monthlyProject.startDate 
    ? new Date(monthlyProject.startDate).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' })
    : 'Дата?';

  return (
    <header className="px-4 h-full flex items-center justify-between">
        <div className="flex-1 min-w-0 flex items-center gap-4">
          <div className="flex items-center gap-2">
             <input 
              value={monthlyProject.id === 'planner_strategic_config' ? (monthlyProject.monthlyGoal || '') : monthlyProject.name} 
              onChange={e => {
                if (isGlobal) onUpdateProject({ monthlyGoal: e.target.value });
                else onUpdateProject({ name: e.target.value });
              }}
              placeholder={isGlobal ? "Ціль..." : "Проєкт..."}
              className="text-[12px] md:text-sm font-black bg-transparent border-none p-0 focus:ring-0 w-full outline-none placeholder:opacity-20 tracking-tight"
              style={!isGlobal ? { color: monthlyProject.color } : {}}
            />
            <div className="relative group/date shrink-0">
               <input 
                 type="date"
                 className="absolute inset-0 opacity-0 cursor-pointer"
                 onChange={(e) => onUpdateProject({ startDate: new Date(e.target.value).getTime() })}
               />
               <span className="text-[7px] font-black uppercase text-primary tracking-widest opacity-40 group-hover/date:opacity-100 cursor-pointer">
                 ({startDateStr})
               </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-3 px-3 py-1 bg-slate-50 rounded-lg border border-slate-100">
             <span className="text-[7px] font-black uppercase text-slate-400">Week {weekNum}</span>
             <div className="w-px h-3 bg-slate-200"></div>
             <span className="text-[7px] font-black uppercase text-primary" style={!isGlobal ? { color: monthlyProject.color } : {}}>{weekEfficiency}%</span>
          </div>

          <button 
            onClick={onToggleNotes}
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${isNotesOpen ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
          >
            <i className="fa-solid fa-note-sticky text-[10px]"></i>
          </button>
        </div>
    </header>
  );
};

export default PlannerHeader;
