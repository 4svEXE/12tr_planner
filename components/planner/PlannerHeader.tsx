
import React from 'react';
import Typography from '../ui/Typography';
import Badge from '../ui/Badge';
import { Project } from '../../types';

interface PlannerHeaderProps {
  monthlyProject: Project | undefined;
  onUpdateProject: (updates: Partial<Project>) => void;
  weekNum: number;
  weekEfficiency: number;
}

const PlannerHeader: React.FC<PlannerHeaderProps> = ({ monthlyProject, onUpdateProject, weekNum, weekEfficiency }) => {
  if (!monthlyProject) return null;

  const kpiPercent = monthlyProject.monthlyKpi ? Math.round((monthlyProject.monthlyKpiCurrent || 0) / monthlyProject.monthlyKpi * 100) : 0;
  const isGlobal = monthlyProject.id === 'planner_strategic_config';

  return (
    <header className="p-3 md:p-4 bg-[var(--bg-card)] border-b border-[var(--border-color)] shrink-0">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex-1 min-w-0 flex items-center gap-5 w-full">
          <div className="shrink-0 hidden md:block">
            <Badge 
              variant={isGlobal ? "orange" : "indigo"} 
              className="font-black text-[8px]"
              style={!isGlobal ? { backgroundColor: `${monthlyProject.color}15`, color: monthlyProject.color, borderColor: `${monthlyProject.color}30` } : {}}
            >
              {isGlobal ? 'ГЛОБАЛЬНИЙ ПЛАН' : 'ПРОЄКТ'}
            </Badge>
          </div>
          <div className="flex-1 flex flex-col">
            <input 
              value={monthlyProject.name === 'Planner Config' ? (monthlyProject.monthlyGoal || '') : monthlyProject.name} 
              onChange={e => {
                if (isGlobal) onUpdateProject({ monthlyGoal: e.target.value });
                else onUpdateProject({ name: e.target.value });
              }}
              placeholder={isGlobal ? "Головна ціль місяця..." : "Назва проєкту..."}
              className="text-base md:text-lg font-black bg-transparent border-none p-0 focus:ring-0 w-full outline-none placeholder:opacity-20 uppercase tracking-tight"
              style={!isGlobal ? { color: monthlyProject.color } : {}}
            />
            <div className="flex items-center gap-3 mt-1">
               <div className="h-1 flex-1 max-w-[200px] bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full shadow-[0_0_8px_rgba(249,115,22,0.5)] transition-all duration-1000" 
                    style={{ 
                      width: `${kpiPercent}%`, 
                      backgroundColor: isGlobal ? 'var(--primary)' : monthlyProject.color 
                    }}
                  ></div>
               </div>
               <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100">
                  <span className="text-[8px] font-black text-slate-400 uppercase">KPI</span>
                  <input type="number" value={monthlyProject.monthlyKpiCurrent || 0} onChange={e => onUpdateProject({ monthlyKpiCurrent: parseInt(e.target.value) || 0 })} className="w-8 bg-transparent border-none text-[10px] font-black p-0 text-center" />
                  <span className="text-[8px] opacity-20">/</span>
                  <input type="number" value={monthlyProject.monthlyKpi || 0} onChange={e => onUpdateProject({ monthlyKpi: parseInt(e.target.value) || 0 })} className="w-8 bg-transparent border-none text-[10px] font-black p-0 text-center" />
               </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-100 shrink-0 self-end md:self-auto">
          <div className="text-center px-3">
             <div className="text-lg font-black text-primary leading-none" style={!isGlobal ? { color: monthlyProject.color } : {}}>{weekEfficiency}%</div>
             <div className="text-[6px] font-black uppercase text-slate-400 mt-0.5">Efficiency</div>
          </div>
          <div className="w-px h-5 bg-slate-200"></div>
          <div className="text-center px-3">
             <div className="text-lg font-black text-main leading-none">{weekNum}</div>
             <div className="text-[6px] font-black uppercase text-slate-400 mt-0.5">Week</div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default PlannerHeader;
