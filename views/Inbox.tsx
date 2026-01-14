
import React, { useState, useMemo, useEffect } from 'react';
import { Task, TaskStatus } from '../types';
import TaskDetails from '../components/TaskDetails';
import { useApp } from '../contexts/AppContext';
import Typography from '../components/ui/Typography';
import { useResizer } from '../hooks/useResizer';
import HashtagAutocomplete from '../components/HashtagAutocomplete';
import { processInboxWithAi } from '../services/geminiService';
import InboxAiWizard from '../components/InboxAiWizard';

const Inbox: React.FC<{ showCompleted?: boolean; showNextActions?: boolean }> = ({ showCompleted = false, showNextActions = false }) => {
  const { 
    tasks, toggleTaskStatus, addTask, 
    character, aiEnabled, people 
  } = useApp();
  
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [quickTaskTitle, setQuickTaskTitle] = useState('');
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiDecisions, setAiDecisions] = useState<any[]>([]);
  const [showAiWizard, setShowAiWizard] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({ pinned: false, unsorted: false });

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { isResizing, startResizing, detailsWidth } = useResizer(350, 900);

  const targetStatus = showNextActions ? TaskStatus.NEXT_ACTION : TaskStatus.INBOX;

  const handleQuickAdd = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!quickTaskTitle.trim()) return;
    const id = addTask(quickTaskTitle.trim(), showNextActions ? 'tasks' : 'unsorted', undefined, 'actions', false, undefined, undefined, targetStatus);
    setQuickTaskTitle('');
    setSelectedTaskId(id);
  };

  const handleAiProcess = async () => {
    const unsortedTasks = tasks.filter(t => !t.isDeleted && t.status === targetStatus);
    if (unsortedTasks.length === 0) return;
    setIsAiProcessing(true);
    try {
      const result = await processInboxWithAi(unsortedTasks.map(t => ({ id: t.id, title: t.title, content: t.content })), character, people.map(p => p.name));
      setAiDecisions(result);
      setShowAiWizard(true);
    } catch (e) { alert("Помилка AI."); } finally { setIsAiProcessing(false); }
  };

  const sections = [
    { id: 'pinned', title: 'Закріплено', filter: (t: Task) => t.isPinned },
    { id: 'unsorted', title: 'Вхідні', filter: (t: Task) => !t.isPinned }
  ];

  return (
    <div className="h-screen flex bg-white overflow-hidden relative">
      {/* CENTRAL TASK LIST */}
      <div className={`flex flex-col flex-1 bg-white min-w-0 z-10 transition-all ${isMobile && selectedTaskId ? 'hidden' : 'h-full'}`}>
        <header className="px-6 pt-10 pb-4 max-w-4xl mx-auto w-full flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <Typography variant="h1" className="text-2xl font-black text-slate-800 tracking-tight">
              {showNextActions ? 'Наступні дії' : 'Вхідні'}
            </Typography>
            <div className="flex gap-1">
               <button className="w-9 h-9 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-50 flex items-center justify-center transition-all"><i className="fa-solid fa-arrow-up-wide-short text-sm"></i></button>
               <button className="w-9 h-9 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-50 flex items-center justify-center transition-all"><i className="fa-solid fa-ellipsis"></i></button>
            </div>
          </div>
          
          <form onSubmit={handleQuickAdd} className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors">
              <i className="fa-solid fa-plus text-sm"></i>
            </div>
            <HashtagAutocomplete 
              value={quickTaskTitle} 
              onChange={setQuickTaskTitle} 
              onSelectTag={() => {}} 
              onEnter={handleQuickAdd} 
              placeholder="Додати нове завдання..." 
              className="w-full bg-slate-50 border border-slate-100 rounded-[1.2rem] py-3.5 pl-12 pr-4 text-[14px] font-medium focus:bg-white focus:ring-4 focus:ring-blue-50/50 focus:border-blue-200 transition-all outline-none placeholder:text-slate-300 shadow-sm" 
            />
          </form>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-6 max-w-4xl mx-auto w-full pb-32">
          {sections.map(section => {
            const sectionTasks = tasks.filter(t => !t.isDeleted && t.status === targetStatus && section.filter(t));
            if (sectionTasks.length === 0 && section.id === 'pinned') return null;
            const isCollapsed = collapsed[section.id];

            return (
              <div key={section.id} className="mb-6">
                <div 
                  onClick={() => setCollapsed(prev => ({ ...prev, [section.id]: !prev[section.id] }))}
                  className="flex items-center gap-2 py-2 cursor-pointer group select-none"
                >
                  <i className={`fa-solid fa-chevron-right text-[8px] text-slate-300 transition-transform ${!isCollapsed ? 'rotate-90 text-slate-600' : ''}`}></i>
                  <span className="text-[11px] font-black uppercase text-slate-400 tracking-widest flex-1">{section.title}</span>
                  <span className="text-[10px] font-black text-slate-300 px-2 py-0.5 bg-slate-50 rounded-full group-hover:bg-slate-100 group-hover:text-slate-500 transition-all">{sectionTasks.length}</span>
                </div>
                
                {!isCollapsed && (
                  <div className="space-y-px mt-1 border-t border-slate-50">
                    {sectionTasks.map(task => {
                      const isSelected = selectedTaskId === task.id;
                      const hasContent = task.content && task.content !== "[]" && task.content !== "";
                      
                      return (
                        <div 
                          key={task.id}
                          onClick={() => setSelectedTaskId(task.id)}
                          className={`flex items-center gap-4 px-3 py-3.5 cursor-pointer group relative border-b border-slate-50/50 transition-all
                            ${isSelected ? 'bg-blue-50/50 border-blue-100/50' : 'hover:bg-slate-50/50'}`}
                        >
                          <button 
                            onClick={(e) => { e.stopPropagation(); toggleTaskStatus(task); }} 
                            className={`w-5 h-5 rounded-[6px] border-2 flex items-center justify-center shrink-0 transition-all ${task.status === TaskStatus.DONE ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200 bg-white hover:border-blue-400'}`}
                          >
                            {task.status === TaskStatus.DONE && <i className="fa-solid fa-check text-[10px]"></i>}
                          </button>
                          
                          <span className={`text-[14px] font-medium flex-1 truncate tracking-tight transition-colors ${task.status === TaskStatus.DONE ? 'text-slate-300 line-through' : 'text-slate-700'}`}>
                            {task.title}
                          </span>

                          {hasContent && (
                            <i className="fa-regular fa-file-lines text-slate-300 text-xs"></i>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {aiEnabled && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20">
             <button onClick={handleAiProcess} disabled={isAiProcessing} className="bg-slate-900 text-white px-8 py-3.5 rounded-full shadow-2xl flex items-center gap-3 hover:scale-105 active:scale-95 transition-all font-black text-[10px] uppercase tracking-[0.2em] border border-white/10">
                {isAiProcessing ? <i className="fa-solid fa-circle-notch animate-spin"></i> : <i className="fa-solid fa-wand-magic-sparkles text-blue-400"></i>}
                AI Анализ Вхідних
             </button>
          </div>
        )}
      </div>

      {/* TASK DETAILS VIEW with Dynamic Resizer */}
      <div 
        className={`bg-white shrink-0 relative transition-none border-l border-slate-100 flex flex-col ${selectedTaskId ? '' : 'hidden lg:flex'}`}
        style={!isMobile ? { width: detailsWidth } : { width: '100vw', position: 'fixed', inset: 0, zIndex: 100 }}
      >
        {!isMobile && (
          <div 
            onMouseDown={startResizing} 
            className={`absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize z-[100] transition-colors -ml-0.5 ${isResizing ? 'bg-blue-400' : 'bg-transparent hover:bg-blue-200/50'}`}
            title="Тягніть для зміни розміру"
          />
        )}
        
        <div className="w-full h-full flex flex-col">
          {selectedTaskId ? (
            <TaskDetails task={tasks.find(t => t.id === selectedTaskId)!} onClose={() => setSelectedTaskId(null)} />
          ) : (
            <div className="h-full w-full flex flex-col items-center justify-center p-12 text-center opacity-5 grayscale pointer-events-none select-none">
              <i className="fa-solid fa-mountain-sun text-9xl mb-8"></i>
              <Typography variant="h2" className="text-2xl font-black uppercase tracking-widest text-slate-400">Оберіть квест</Typography>
              <Typography variant="body" className="mt-4 text-xs font-bold text-slate-300">Деталі завдання з’являться тут</Typography>
            </div>
          )}
        </div>
      </div>

      {showAiWizard && <InboxAiWizard decisions={aiDecisions} onClose={() => setShowAiWizard(false)} onConfirm={() => setShowAiWizard(false)} />}
    </div>
  );
};

export default Inbox;
