import React, { useState, useMemo, useEffect } from 'react';
import { Task, TaskStatus, InboxCategory } from '../types';
import TaskDetails from '../components/TaskDetails';
import { useApp } from '../contexts/AppContext';
import Typography from '../components/ui/Typography';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { useResizer } from '../hooks/useResizer';
import HashtagAutocomplete from '../components/HashtagAutocomplete';
import { processInboxWithAi } from '../services/geminiService';
import InboxAiWizard from '../components/InboxAiWizard';

const Inbox: React.FC<{ showCompleted?: boolean; showNextActions?: boolean }> = ({ showCompleted = false, showNextActions = false }) => {
  const { 
    tasks, toggleTaskStatus, addTask, updateTask, 
    inboxCategories, updateInboxCategory, deleteInboxCategory, 
    addInboxCategory, character, aiEnabled, people 
  } = useApp();
  
  // FIX: useResizer hook expects two arguments (minWidth, maxWidth).
  const { isResizing, startResizing, detailsWidth } = useResizer(300, 800);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [quickTaskTitle, setQuickTaskTitle] = useState('');
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editSectionTitle, setEditSectionTitle] = useState('');
  const [dragOverSectionId, setDragOverSectionId] = useState<string | null>(null);

  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiDecisions, setAiDecisions] = useState<any[]>([]);
  const [showAiWizard, setShowAiWizard] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const currentScope = showNextActions ? 'actions' : 'inbox';
  const targetStatus = showNextActions ? TaskStatus.NEXT_ACTION : TaskStatus.INBOX;

  const handleQuickAdd = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!quickTaskTitle.trim()) return;
    addTask(quickTaskTitle.trim(), showNextActions ? 'tasks' : 'unsorted', undefined, 'actions', false, undefined, undefined, targetStatus);
    setQuickTaskTitle('');
  };

  const handleCreateSection = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSectionTitle.trim()) {
      addInboxCategory(newSectionTitle.trim(), currentScope);
      setNewSectionTitle('');
      setIsAddingSection(false);
    }
  };

  const handleRenameSection = (id: string) => {
    if (editSectionTitle.trim()) {
      updateInboxCategory(id, { title: editSectionTitle.trim() });
    }
    setEditingSectionId(null);
  };

  const onDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
  };

  const onDropOnSection = (e: React.DragEvent, categoryId: string) => {
    e.preventDefault();
    setDragOverSectionId(null);
    const taskId = e.dataTransfer.getData('taskId');
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      const targetCat = inboxCategories.find(c => c.id === categoryId);
      const newScope = targetCat?.scope || currentScope;
      const newStatus = newScope === 'actions' ? TaskStatus.NEXT_ACTION : TaskStatus.INBOX;
      
      updateTask({ 
        ...task, 
        category: categoryId, 
        status: newStatus,
        isDeleted: false 
      });
    }
  };

  const filteredCategories = useMemo(() => {
    return inboxCategories.filter(cat => {
      if (cat.id === 'pinned') return true;
      if (cat.id === 'unsorted' || cat.id === 'notes') return !showNextActions;
      if (cat.id === 'tasks') return showNextActions;
      return cat.scope === currentScope;
    });
  }, [inboxCategories, currentScope, showNextActions]);

  const handleAiProcess = async () => {
    const unsortedTasks = tasks.filter(t => !t.isDeleted && t.status === targetStatus && (t.category === 'unsorted' || !t.category));
    if (unsortedTasks.length === 0) return;
    setIsAiProcessing(true);
    try {
      const result = await processInboxWithAi(unsortedTasks.map(t => ({ id: t.id, title: t.title, content: t.content })), character, people.map(p => p.name));
      setAiDecisions(result);
      setShowAiWizard(true);
    } catch (e) { alert("Помилка AI."); } finally { setIsAiProcessing(false); }
  };

  return (
    <div className="h-screen flex flex-col lg:flex-row overflow-hidden relative bg-[var(--bg-main)]">
        <div className="flex-1 flex flex-col min-w-0 h-full relative">
          <header className="px-4 md:px-6 pt-4 md:pt-6 pb-2 md:pb-4 border-b border-[var(--border-color)] flex flex-col gap-4 sticky top-0 bg-[var(--bg-card)] z-20 shadow-sm shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-lg ${showNextActions ? 'bg-amber-500' : 'bg-indigo-600'}`}>
                   <i className={`fa-solid ${showNextActions ? 'fa-bolt-lightning' : 'fa-inbox'}`}></i>
                </div>
                <div>
                  <Typography variant="h1" className="text-lg md:text-xl font-black uppercase tracking-tight">
                    {showNextActions ? 'Наступні дії' : 'Вхідні'}
                  </Typography>
                  <Typography variant="tiny" className="text-[var(--text-muted)] opacity-50 uppercase tracking-widest text-[8px]">
                    {tasks.filter(t => !t.isDeleted && t.status === targetStatus).length} Квестів
                  </Typography>
                </div>
              </div>
              <Button size="sm" variant="white" onClick={() => setIsAddingSection(!isAddingSection)} className="h-9 px-3 rounded-xl gap-2 text-[9px] font-black uppercase tracking-widest">
                <i className={`fa-solid ${isAddingSection ? 'fa-xmark text-rose-500' : 'fa-folder-plus text-orange-500'}`}></i>
                {isAddingSection ? 'Скасувати' : 'Секція'}
              </Button>
            </div>

            {isAddingSection && (
              <form onSubmit={handleCreateSection} className="flex gap-2 animate-in slide-in-from-top-2 duration-300">
                <input autoFocus value={newSectionTitle} onChange={e => setNewSectionTitle(e.target.value)} placeholder={`Нова секція у ${showNextActions ? 'діях' : 'вхідних'}...`} className="flex-1 bg-[var(--bg-main)] border-2 border-[var(--primary)]/20 rounded-2xl px-5 py-3 text-xs font-bold outline-none focus:border-[var(--primary)] transition-all shadow-inner" />
                <Button variant="primary" type="submit" className="rounded-2xl px-6">OK</Button>
              </form>
            )}

            <form onSubmit={handleQuickAdd} className="flex gap-2">
              <div className="flex-1">
                <HashtagAutocomplete value={quickTaskTitle} onChange={setQuickTaskTitle} onSelectTag={() => {}} onEnter={handleQuickAdd} placeholder={showNextActions ? "Нова термінова дія..." : "Швидкий запис..."} className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-2xl px-5 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-[var(--primary)]/5 transition-all" />
              </div>
              <Button size="md" type="submit" className="rounded-2xl shadow-lg px-6">OK</Button>
            </form>
          </header>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 space-y-6 md:space-y-8 pb-32">
             {filteredCategories.map(category => {
               const categoryTasks = tasks.filter(t => 
                 !t.isDeleted && 
                 t.status === targetStatus && 
                 (category.isPinned ? t.isPinned : t.category === category.id)
               );
               const isEditing = editingSectionId === category.id;
               const isSystem = ['pinned', 'unsorted', 'tasks', 'notes'].includes(category.id);
               const isOver = dragOverSectionId === category.id;

               if (categoryTasks.length === 0 && isSystem && !['unsorted', 'tasks'].includes(category.id)) return null;

               return (
                 <section 
                  key={category.id} 
                  onDragOver={(e) => { e.preventDefault(); setDragOverSectionId(category.id); }}
                  onDragLeave={() => setDragOverSectionId(null)}
                  onDrop={(e) => onDropOnSection(e, category.id)}
                  className={`space-y-2 md:space-y-3 rounded-[2rem] transition-all duration-200 ${isOver ? 'bg-[var(--primary)]/5 ring-4 ring-[var(--primary)]/10 p-3 -m-3' : ''}`}
                 >
                   <div className="flex items-center justify-between px-2">
                     <div className="flex items-center gap-2 group/title flex-1">
                        <div className={`w-1 h-3 md:w-1.5 md:h-4 rounded-full bg-[var(--primary)] ${categoryTasks.length > 0 ? 'opacity-100' : 'opacity-20'}`}></div>
                        {isEditing ? (
                          <input autoFocus value={editSectionTitle} onChange={e => setEditSectionTitle(e.target.value)} onBlur={() => handleRenameSection(category.id)} onKeyDown={e => e.key === 'Enter' && handleRenameSection(category.id)} className="bg-transparent border-b-2 border-[var(--primary)] outline-none text-[8px] md:text-[9px] font-black uppercase tracking-widest text-slate-900" />
                        ) : (
                          <Typography variant="tiny" onClick={() => !isSystem && (setEditingSectionId(category.id), setEditSectionTitle(category.title))} className={`text-[var(--text-main)] font-black uppercase text-[8px] md:text-[9px] tracking-[0.2em] ${!isSystem ? 'cursor-edit hover:text-[var(--primary)]' : ''}`}>
                            {category.title}
                          </Typography>
                        )}
                     </div>
                     <div className="flex items-center gap-2">
                        <span className="text-[7px] md:text-[8px] font-black text-slate-300">{categoryTasks.length}</span>
                        {!isSystem && (
                          <button onClick={() => deleteInboxCategory(category.id)} className="text-slate-200 hover:text-rose-500 transition-colors p-1">
                            <i className="fa-solid fa-trash-can text-[9px]"></i>
                          </button>
                        )}
                     </div>
                   </div>
                   
                   <div className="space-y-1.5 md:space-y-2">
                     {categoryTasks.map(task => (
                       <Card 
                        key={task.id} 
                        padding="none" 
                        draggable
                        onDragStart={(e) => onDragStart(e, task.id)}
                        onClick={() => setSelectedTaskId(task.id)} 
                        className="flex items-center gap-3 md:gap-4 p-3 md:p-4 cursor-grab active:cursor-grabbing hover:border-[var(--primary)]/50 bg-[var(--bg-card)] group shadow-sm hover:shadow-md transition-all rounded-xl md:rounded-2xl border-transparent"
                       >
                          <button onClick={(e) => { e.stopPropagation(); toggleTaskStatus(task); }} className={`w-5 h-5 md:w-6 md:h-6 rounded-lg md:rounded-xl border-2 transition-all flex items-center justify-center shrink-0 ${task.status === TaskStatus.DONE ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-[var(--border-color)] bg-white'}`}>
                             {task.status === TaskStatus.DONE && <i className="fa-solid fa-check text-[8px] md:text-[10px]"></i>}
                          </button>
                          <span className={`text-[13px] md:text-sm font-bold flex-1 truncate ${task.status === TaskStatus.DONE ? 'text-[var(--text-muted)] line-through opacity-50' : 'text-[var(--text-main)]'}`}>{task.title}</span>
                          <i className="fa-solid fa-grip-vertical text-slate-100 group-hover:text-slate-300 transition-colors text-[9px] md:text-[10px]"></i>
                       </Card>
                     ))}
                     {categoryTasks.length === 0 && (
                       <div className="py-6 md:py-8 border-2 border-dashed border-slate-100/50 rounded-xl md:rounded-2xl flex flex-col items-center justify-center grayscale opacity-10">
                          <i className="fa-solid fa-folder-open text-lg md:text-xl mb-1"></i>
                          <span className="text-[6px] md:text-[7px] font-black uppercase tracking-widest">Перетягніть сюди</span>
                       </div>
                     )}
                   </div>
                 </section>
               );
             })}
          </div>

          {aiEnabled && (
            <div className={`absolute left-1/2 -translate-x-1/2 z-30 ${isMobile ? 'bottom-24' : 'bottom-8'}`}>
               <button onClick={handleAiProcess} disabled={isAiProcessing} className="bg-slate-900 text-white px-8 py-4 rounded-[2rem] shadow-2xl flex items-center gap-3 hover:scale-105 active:scale-95 transition-all font-black uppercase text-[10px] tracking-widest border border-white/10 ring-4 ring-slate-900/5">
                  {isAiProcessing ? <i className="fa-solid fa-circle-notch animate-spin"></i> : <i className="fa-solid fa-sparkles text-orange-400"></i>}
                  {isAiProcessing ? 'РОЗБИРАЮ...' : 'ШІ РОЗБІР'}
               </button>
            </div>
          )}
        </div>

        <div className={`flex h-full border-l border-[var(--border-color)] z-[110] bg-[var(--bg-card)] shrink-0 transition-all duration-300 ${isMobile ? (selectedTaskId ? 'fixed inset-0 w-full translate-x-0' : 'fixed inset-0 w-full translate-x-full') : ''}`}>
          <div style={{ width: isMobile ? '100vw' : detailsWidth }} className="h-full bg-[var(--bg-card)] relative overflow-hidden flex flex-col shadow-2xl">
            {selectedTaskId ? ( 
              <TaskDetails task={tasks.find(t => t.id === selectedTaskId)!} onClose={() => setSelectedTaskId(null)} /> 
            ) : ( 
              !isMobile && <div className="h-full flex flex-col items-center justify-center p-8 text-center opacity-5 grayscale pointer-events-none select-none"> <i className="fa-solid fa-inbox text-9xl mb-8"></i> </div> 
            )}
          </div>
        </div>

        {showAiWizard && <InboxAiWizard decisions={aiDecisions} onClose={() => setShowAiWizard(false)} onConfirm={() => setShowAiWizard(false)} />}
    </div>
  );
};

export default Inbox;