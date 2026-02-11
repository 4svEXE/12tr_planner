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
    character, aiEnabled, people, theme 
  } = useApp();
  
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [quickTaskTitle, setQuickTaskTitle] = useState('');
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiDecisions, setAiDecisions] = useState<any[]>([]);
  const [showAiWizard, setShowAiWizard] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  // Animation handling
  const [completingIds, setCompletingIds] = useState<Set<string>>(new Set());

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({ pinned: false, unsorted: false, history: false });

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { isResizing, startResizing, detailsWidth } = useResizer(350, 900);

  const targetStatus = showCompleted ? TaskStatus.DONE : (showNextActions ? TaskStatus.NEXT_ACTION : TaskStatus.INBOX);

  const handleQuickAdd = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!quickTaskTitle.trim()) return;
    addTask(quickTaskTitle.trim(), showNextActions ? 'tasks' : 'unsorted', undefined, 'actions', false, undefined, undefined, targetStatus);
    setQuickTaskTitle('');
  };

  const handleFabAdd = () => {
    addTask("Нове завдання", showNextActions ? 'tasks' : 'unsorted', undefined, 'actions', false, undefined, undefined, targetStatus);
  };

  const handleToggleTaskWithDelay = (task: Task) => {
    if (!showCompleted && task.status !== TaskStatus.DONE) {
      setCompletingIds(prev => {
        const next = new Set(prev);
        next.add(task.id);
        return next;
      });
      setTimeout(() => {
        toggleTaskStatus(task);
        setCompletingIds(prev => {
          const next = new Set(prev);
          next.delete(task.id);
          return next;
        });
      }, 700);
    } else {
      toggleTaskStatus(task);
    }
  };

  const handleAiProcess = async () => {
    const unsortedTasks = tasks.filter(t => !t.isDeleted && !t.projectId && t.status === targetStatus && t.category !== 'note');
    if (unsortedTasks.length === 0) return;
    setIsAiProcessing(true);
    try {
      const result = await processInboxWithAi(unsortedTasks.map(t => ({ id: t.id, title: t.title, content: t.content })), character, people.map(p => p.name));
      setAiDecisions(result);
      setShowAiWizard(true);
    } catch (e) { alert("Помилка AI."); } finally { setIsAiProcessing(false); }
  };

  const sections = showCompleted ? [
    { id: 'history', title: 'Архів перемог', filter: (t: Task) => t.status === TaskStatus.DONE }
  ] : [
    { id: 'pinned', title: 'Закріплено', filter: (t: Task) => t.isPinned || (completingIds.has(t.id) && t.isPinned) },
    { id: 'unsorted', title: 'Вхідні', filter: (t: Task) => !t.isPinned || (completingIds.has(t.id) && !t.isPinned) }
  ];

  return (
    <div className="h-screen flex bg-main overflow-hidden relative text-main transition-colors duration-300">
      <div className={`flex flex-col flex-1 min-w-0 z-10 transition-all ${isMobile && selectedTaskId ? 'hidden' : 'h-full'}`}>
        <header className="px-6 pt-4 max-w-4xl mx-auto w-full flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center text-white shadow-lg ${showCompleted ? 'bg-emerald-500' : 'bg-[var(--primary)]'}`}>
                <i className={`fa-solid ${showCompleted ? 'fa-check-double' : (showNextActions ? 'fa-bolt' : 'fa-inbox')}`}></i>
              </div>
              <div>
                <Typography variant="h1" className="text-2xl font-black tracking-tight text-main">
                  {showCompleted ? 'Готово' : (showNextActions ? 'Наступні дії' : 'Вхідні')}
                </Typography>
                <Typography variant="tiny" className="text-muted opacity-60 uppercase tracking-[0.2em] text-[8px]">
                  {showCompleted ? 'Системний архів успіхів' : 'Черга активних квестів'}
                </Typography>
              </div>
            </div>
            <div className="flex gap-1">
               <button className="w-9 h-9 rounded-xl text-muted hover:text-main hover:bg-black/5 flex items-center justify-center transition-all"><i className="fa-solid fa-arrow-up-wide-short text-sm"></i></button>
               <button className="w-9 h-9 rounded-xl text-muted hover:text-main hover:bg-black/5 flex items-center justify-center transition-all"><i className="fa-solid fa-ellipsis"></i></button>
            </div>
          </div>
          
          {!showCompleted && (
            <form onSubmit={handleQuickAdd} className="relative group flex items-center">
              <div className="absolute left-3 z-10 text-muted opacity-50 group-focus-within:text-primary group-focus-within:opacity-100 transition-all">
                <i className="fa-solid fa-plus text-[10px]"></i>
              </div>
              <HashtagAutocomplete 
                value={quickTaskTitle} 
                onChange={setQuickTaskTitle} 
                onSelectTag={() => {}} 
                onEnter={handleQuickAdd} 
                placeholder="Додати нове завдання..." 
                className="w-full bg-card border border-theme rounded py-0 pl-10 pr-4 focus:ring-4 focus:ring-primary/10 transition-all outline-none placeholder:text-muted placeholder:opacity-40 shadow-sm text-main" 
              />
            </form>
          )}
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-6 max-w-4xl mx-auto w-full pb-32">
          {sections.map(section => {
            const sectionTasks = tasks.filter(t => {
              if (t.isDeleted) return false;
              if (t.category === 'note') return false;
              // Ключова зміна: тільки таски БЕЗ проєкту (Inbox)
              if (!showNextActions && !showCompleted && t.projectId) return false;
              
              const isLogicallyActive = showCompleted ? (t.status === TaskStatus.DONE) : (t.status === targetStatus || completingIds.has(t.id));
              return isLogicallyActive && section.filter(t);
            });
            
            if (sectionTasks.length === 0 && section.id === 'pinned') return null;
            const isCollapsed = collapsed[section.id];

            return (
              <div key={section.id} className="mb-6">
                <div 
                  onClick={() => setCollapsed(prev => ({ ...prev, [section.id]: !prev[section.id] }))}
                  className="flex items-center gap-2 py-2 cursor-pointer group select-none"
                >
                  <i className={`fa-solid fa-chevron-right text-[8px] text-muted transition-transform ${!isCollapsed ? 'rotate-90 text-main' : 'opacity-40'}`}></i>
                  <span className="text-[11px] font-black uppercase text-muted tracking-widest flex-1 opacity-70">{section.title}</span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full transition-all ${showCompleted ? 'bg-emerald-50 text-emerald-600' : 'bg-black/5 text-muted group-hover:bg-black/10'}`}>{sectionTasks.length}</span>
                </div>
                
                {!isCollapsed && (
                  <div className="space-y-1 mt-1 border-t border-theme/50 pt-2">
                    {sectionTasks.map(task => {
                      const isSelected = selectedTaskId === task.id;
                      const isCompleting = completingIds.has(task.id);
                      const isDone = task.status === TaskStatus.DONE;
                      const hasContent = task.content && task.content !== "[]" && task.content !== "";
                      
                      return (
                        <div 
                          key={task.id}
                          onClick={() => setSelectedTaskId(task.id)}
                          className={`flex items-center gap-2.5 px-2.5 py-1.5 cursor-pointer group relative border rounded-lg transition-all shadow-sm
                            ${isSelected ? (showCompleted ? 'bg-emerald-50 border-emerald-200' : 'bg-primary/5 border-primary/20') : 'bg-card border-theme hover:border-primary/30'} ${isCompleting ? 'scale-[0.98]' : ''}`}
                        >
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleToggleTaskWithDelay(task); }} 
                            className={`w-4 h-4 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${isDone || isCompleting ? 'bg-emerald-500 border-emerald-500 text-white shadow-inner' : 'border-theme bg-black/5 hover:border-primary'}`}
                          >
                            {(isDone || isCompleting) && <i className="fa-solid fa-check text-[7px]"></i>}
                          </button>
                          
                          <div className="flex-1 min-w-0 flex items-center justify-between gap-4">
                             <span className={`text-[11px] font-bold truncate leading-tight tracking-tight transition-colors strike-anim ${isDone || isCompleting ? 'is-striking text-muted' : 'text-main'}`}>
                                {task.title}
                             </span>

                             {hasContent && (
                                <i className="fa-regular fa-file-lines text-muted opacity-30 text-[9px]"></i>
                             )}
                          </div>
                          
                          {task.completedAt && (
                             <span className="text-[7px] font-black text-muted opacity-40 uppercase tabular-nums">
                               {new Date(task.completedAt).toLocaleDateString('uk-UA', {day:'numeric', month:'short'})}
                             </span>
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

        {aiEnabled && !showCompleted && (
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 md:bottom-8">
             <button onClick={handleAiProcess} disabled={isAiProcessing} className="bg-main border border-theme text-main px-8 py-3.5 rounded-full shadow-2xl flex items-center gap-3 hover:scale-105 active:scale-95 transition-all font-black text-[10px] uppercase tracking-[0.2em]">
                {isAiProcessing ? <i className="fa-solid fa-circle-notch animate-spin text-primary"></i> : <i className="fa-solid fa-wand-magic-sparkles text-primary"></i>}
                AI Анализ Вхідних
             </button>
          </div>
        )}

        {!showCompleted && (
          <button 
            onClick={handleFabAdd}
            className="fixed bottom-24 right-6 md:bottom-10 md:right-10 w-14 h-14 rounded-full bg-primary text-white shadow-2xl flex items-center justify-center z-50 hover:scale-110 active:scale-95 transition-all border-4 border-card"
          >
            <i className="fa-solid fa-plus text-xl"></i>
          </button>
        )}
      </div>

      <div 
        className={`bg-card shrink-0 relative transition-none border-l border-theme flex flex-col ${selectedTaskId ? '' : 'hidden lg:flex'}`}
        style={!isMobile ? { width: detailsWidth } : { width: '100vw', position: 'fixed', inset: 0, zIndex: 100 }}
      >
        {!isMobile && (
          <div 
            onMouseDown={startResizing} 
            className={`absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize z-[100] transition-colors -ml-0.5 ${isResizing ? 'bg-primary' : 'bg-transparent hover:bg-primary/20'}`}
            title="Тягніть для зміни розміру"
          />
        )}
        
        <div className="w-full h-full flex flex-col">
          {selectedTaskId ? (
            <TaskDetails task={tasks.find(t => t.id === selectedTaskId)!} onClose={() => setSelectedTaskId(null)} />
          ) : (
            <div className="h-full w-full flex flex-col items-center justify-center p-12 text-center opacity-5 grayscale pointer-events-none select-none">
              <i className="fa-solid fa-mountain-sun text-9xl mb-8 text-main"></i>
              <Typography variant="h2" className="text-2xl font-black uppercase tracking-widest text-muted">Оберіть квест</Typography>
            </div>
          )}
        </div>
      </div>

      {showAiWizard && <InboxAiWizard decisions={aiDecisions} onClose={() => setShowAiWizard(false)} onConfirm={() => setShowAiWizard(false)} />}
    </div>
  );
};

export default Inbox;