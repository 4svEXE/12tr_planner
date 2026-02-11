import React, { useState, useRef, useEffect } from 'react';
import Typography from '../ui/Typography';
import { Project, Task } from '../../types';

interface ListHeaderProps {
  project: Project;
  tasks: Task[];
  taskCount: number;
  isMobile: boolean;
  onBack: () => void;
  onUpdateProject: (p: Project) => void;
  onAddSection: (pId: string, title: string) => void;
}

const ListHeader: React.FC<ListHeaderProps> = ({ project, tasks, taskCount, isMobile, onBack, onUpdateProject, onAddSection }) => {
  const isSystem = project.id === 'system_inbox' || project.id === 'system_notes' || project.id === 'system_calendar';
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const updateSettings = (updates: Partial<Project>) => {
    onUpdateProject({ ...project, ...updates, updatedAt: Date.now() });
  };

  const handleCycleSort = () => {
    const current = project.sortBy || 'priority';
    const sequence: Project['sortBy'][] = ['priority', 'name', 'date'];
    const nextIndex = (sequence.indexOf(current) + 1) % sequence.length;
    updateSettings({ sortBy: sequence[nextIndex] });
  };

  const handlePrint = () => {
    setShowMenu(false);
    document.body.classList.add('printing-mode');
    window.print();
    document.body.classList.remove('printing-mode');
  };

  const showActivityLog = () => {
    setShowMenu(false);
    const recent = [...tasks].sort((a,b) => b.updatedAt - a.updatedAt).slice(0, 5);
    const logText = recent.map(t => `• ${t.title} (${new Date(t.updatedAt).toLocaleTimeString()})`).join('\n');
    alert(`Остання активність у "${project.name}":\n\n${logText || 'Активності поки немає'}`);
  };

  const handleAddSectionAction = () => {
    const title = prompt('Введіть назву нової секції:', 'Нова секція');
    if (title) {
      onAddSection(project.id, title);
    }
    setShowMenu(false);
  };

  return (
    <header className="px-4 md:px-6 py-4 border-b border-[var(--border-color)] bg-[var(--bg-card)] flex justify-between items-center shrink-0 relative z-[200] no-print">
      <div className="flex items-center gap-3 min-w-0">
        {isMobile && (
          <button onClick={onBack} className="w-10 h-10 rounded-2xl bg-black/5 flex items-center justify-center text-[var(--text-main)] mr-1 active:scale-90 transition-all shadow-sm">
            <i className="fa-solid fa-bars text-lg"></i>
          </button>
        )}
        <div 
          className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg shrink-0 transition-transform hover:scale-105 active:scale-95" 
          style={{ backgroundColor: project.color || 'var(--primary)' }}
        >
          <i className={`fa-solid ${
            project.id === 'system_inbox' ? 'fa-inbox' : 
            project.id === 'system_calendar' ? 'fa-calendar-day' :
            project.id === 'system_notes' ? 'fa-note-sticky' : 'fa-list-check'
          }`}></i>
        </div>
        <div className="min-w-0">
          {isSystem ? (
             <Typography variant="h2" className="text-base md:text-lg font-black uppercase tracking-tight text-[var(--text-main)]">
                {project.name}
             </Typography>
          ) : (
            <input
              value={project.name}
              onChange={e => onUpdateProject({ ...project, name: e.target.value })}
              className="text-base md:text-lg font-black uppercase tracking-tight bg-transparent border-none p-0 focus:ring-0 w-full outline-none text-[var(--text-main)]"
            />
          )}
          <Typography variant="tiny" className="text-[var(--text-muted)] text-[7px] uppercase tracking-widest leading-none">
            {taskCount} елементів • {project.viewMode || 'list'}
          </Typography>
        </div>
      </div>

      <div className="flex items-center gap-1">
        {!isSystem && (
          <button 
            onClick={handleAddSectionAction}
            className="w-8 h-8 rounded-lg hover:bg-black/5 text-slate-400 hover:text-indigo-600 transition-all"
            title="Додати секцію"
          >
            <i className="fa-solid fa-plus text-xs"></i>
          </button>
        )}
        
        <div className="relative" ref={menuRef}>
          <button 
            onClick={() => setShowMenu(!showMenu)} 
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${showMenu ? 'bg-black/10 text-slate-900' : 'text-slate-400 hover:bg-black/5'}`}
          >
            <i className="fa-solid fa-ellipsis-vertical"></i>
          </button>

          {showMenu && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-white shadow-[0_10px_40px_rgba(0,0,0,0.15)] border border-slate-100 rounded-2xl py-3 z-[300] tiktok-blur animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
               <div className="flex px-3 pb-3 border-b border-slate-50 gap-1">
                  {[
                    { id: 'list', icon: 'fa-list', label: 'Список' },
                    { id: 'kanban', icon: 'fa-table-columns', label: 'Канбан' },
                    { id: 'timeline', icon: 'fa-timeline', label: 'Таймлайн' }
                  ].map(v => (
                    <button 
                      key={v.id} 
                      onClick={() => { updateSettings({ viewMode: v.id as any }); setShowMenu(false); }}
                      className={`flex-1 h-10 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all ${project.viewMode === v.id || (!project.viewMode && v.id === 'list') ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                    >
                      <i className={`fa-solid ${v.icon} text-[10px]`}></i>
                      <span className="text-[5px] font-black uppercase tracking-tighter">{v.label}</span>
                    </button>
                  ))}
               </div>

               <div className="py-2">
                  <button 
                    onClick={() => updateSettings({ showCompleted: !project.showCompleted })}
                    className="w-full px-4 py-2.5 flex items-center justify-between text-[10px] font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <i className={`fa-solid fa-check-double w-4 text-center ${project.showCompleted ? 'text-indigo-500' : 'text-slate-300'}`}></i>
                      <span>Показувати виконані</span>
                    </div>
                    <div className={`w-7 h-4 rounded-full relative transition-all ${project.showCompleted ? 'bg-indigo-500' : 'bg-slate-200'}`}>
                        <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${project.showCompleted ? 'right-0.5' : 'left-0.5'}`}></div>
                    </div>
                  </button>
                  <button 
                    onClick={() => updateSettings({ showDetails: !project.showDetails })}
                    className="w-full px-4 py-2.5 flex items-center justify-between text-[10px] font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <i className={`fa-solid fa-circle-info w-4 text-center ${project.showDetails ? 'text-indigo-500' : 'text-slate-300'}`}></i>
                      <span>Показати подробиці</span>
                    </div>
                    <div className={`w-7 h-4 rounded-full relative transition-all ${project.showDetails ? 'bg-indigo-500' : 'bg-slate-200'}`}>
                        <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${project.showDetails ? 'right-0.5' : 'left-0.5'}`}></div>
                    </div>
                  </button>
               </div>

               <div className="h-px bg-slate-100 my-1 mx-4 opacity-50"></div>

               <div className="py-1">
                  <button 
                    onClick={handleCycleSort} 
                    className="w-full px-4 py-2.5 flex items-center justify-between text-[10px] font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <i className="fa-solid fa-arrow-down-wide-short w-4 text-center text-slate-400"></i>
                      <span>Сортування: <span className="text-indigo-600 lowercase">{project.sortBy || 'пріоритет'}</span></span>
                    </div>
                  </button>
                  {!isSystem && (
                    <button onClick={handleAddSectionAction} className="w-full px-4 py-2.5 flex items-center gap-3 text-[10px] font-bold text-slate-700 hover:bg-slate-50 transition-colors">
                      <i className="fa-solid fa-plus-square w-4 text-center text-slate-400"></i>
                      <span>Вставити секцію</span>
                    </button>
                  )}
               </div>

               <div className="h-px bg-slate-100 my-1 mx-4 opacity-50"></div>

               <div className="py-1">
                  <button onClick={showActivityLog} className="w-full px-4 py-2.5 flex items-center gap-3 text-[10px] font-bold text-slate-700 hover:bg-slate-50 transition-colors">
                    <i className="fa-solid fa-chart-line w-4 text-center text-slate-400"></i>
                    <span>Перелік активності</span>
                  </button>
                  <button onClick={handlePrint} className="w-full px-4 py-2.5 flex items-center gap-3 text-[10px] font-bold text-slate-700 hover:bg-slate-50 transition-colors">
                    <i className="fa-solid fa-print w-4 text-center text-slate-400"></i>
                    <span>Друк</span>
                  </button>
               </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default ListHeader;