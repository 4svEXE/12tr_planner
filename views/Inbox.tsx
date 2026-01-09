
import React, { useState, useMemo, useEffect } from 'react';
import { Task, TaskStatus, Project, Priority, InboxCategory, Character } from '../types';
import TaskDetails from '../components/TaskDetails';
import { useApp } from '../contexts/AppContext';
import Typography from '../components/ui/Typography';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Card from '../components/ui/Card';
import { useResizer } from '../hooks/useResizer';
import HashtagAutocomplete from '../components/HashtagAutocomplete';
import { processInboxWithAi } from '../services/geminiService';
import InboxAiWizard from '../components/InboxAiWizard';

const Inbox: React.FC<{ showCompleted?: boolean; showNextActions?: boolean }> = ({ showCompleted = false, showNextActions = false }) => {
  const { 
    tasks, toggleTaskStatus, addTask, moveTaskToCategory, 
    inboxCategories, updateTask, projects, addInboxCategory, 
    updateInboxCategory, deleteInboxCategory, tags, character, aiEnabled,
    addPerson, addPersonNote, addProject, updateCharacter, people
  } = useApp();
  
  const { isResizing, startResizing, detailsWidth } = useResizer();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [dragOverSection, setDragOverSection] = useState<string | null>(null);
  const [quickTaskTitle, setQuickTaskTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState('');

  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiDecisions, setAiDecisions] = useState<any[]>([]);
  const [showAiWizard, setShowAiWizard] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleQuickAdd = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!quickTaskTitle.trim()) return;
    if (showNextActions) { addTask(quickTaskTitle.trim(), 'tasks', undefined, 'actions', false, undefined, undefined, TaskStatus.NEXT_ACTION); }
    else { addTask(quickTaskTitle.trim(), 'unsorted'); }
    setQuickTaskTitle('');
  };

  const handleAiProcess = async () => {
    const unsortedTasks = tasks.filter(t => !t.isDeleted && t.status === TaskStatus.INBOX && t.category === 'unsorted');
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
          <header className="px-4 md:px-6 pt-4 md:pt-3 pb-2 md:pb-1 border-b border-[var(--border-color)] flex flex-col gap-3 md:gap-2 sticky top-0 bg-[var(--bg-card)] z-20 shadow-sm shrink-0">
            <div className="flex items-center justify-between h-8">
              <div className="flex items-center gap-3 md:gap-4 h-full">
                <Typography variant="h1" className="text-sm md:text-base tracking-tight font-black uppercase flex items-center gap-2 md:gap-3">
                  <i className={`fa-solid ${showNextActions ? 'fa-bolt-lightning' : 'fa-inbox'} text-[var(--primary)]`}></i>
                  {showNextActions ? 'Наступні дії' : 'Вхідні'}
                </Typography>
                <div className="bg-[var(--primary)]/10 text-[var(--primary)] px-2 py-0.5 rounded-lg text-[9px] font-black">
                   {tasks.filter(t => !t.isDeleted && t.status === TaskStatus.INBOX).length}
                </div>
              </div>
            </div>
            <form onSubmit={handleQuickAdd} className="flex gap-2 mb-1">
              <div className="flex-1">
                <HashtagAutocomplete value={quickTaskTitle} onChange={setQuickTaskTitle} onSelectTag={() => {}} onEnter={handleQuickAdd} placeholder="Додати квест..." className="w-full bg-[var(--bg-main)] border border-[var(--primary)]/30 rounded-xl px-4 py-2 text-[12px] font-bold outline-none h-11 md:h-9" />
              </div>
              <Button size="sm" type="submit" className="h-11 md:h-9 px-4">Додати</Button>
            </form>
          </header>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
             {tasks.filter(t => !t.isDeleted && t.status === TaskStatus.INBOX).map(task => (
               <Card key={task.id} padding="sm" onClick={() => setSelectedTaskId(task.id)} className="flex items-center gap-4 cursor-pointer hover:border-[var(--primary)]/50">
                  <button onClick={(e) => { e.stopPropagation(); toggleTaskStatus(task); }} className={`w-5 h-5 rounded-full border-2 transition-all ${task.status === TaskStatus.DONE ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-[var(--border-color)]'}`}>
                     {task.status === TaskStatus.DONE && <i className="fa-solid fa-check text-[8px]"></i>}
                  </button>
                  <span className="text-sm font-bold text-[var(--text-main)] flex-1 truncate">{task.title}</span>
                  <i className="fa-solid fa-chevron-right text-[var(--text-muted)] opacity-20 text-[10px]"></i>
               </Card>
             ))}
          </div>

          {aiEnabled && (
            <div className={`absolute left-1/2 -translate-x-1/2 z-30 ${isMobile ? 'bottom-20' : 'bottom-6'}`}>
               <button onClick={handleAiProcess} disabled={isAiProcessing} className="bg-[var(--primary)] text-white px-8 py-3 rounded-2xl shadow-2xl flex items-center gap-3 hover:scale-105 active:scale-95 transition-all font-black uppercase text-[10px] tracking-widest">
                  {isAiProcessing ? <i className="fa-solid fa-circle-notch animate-spin"></i> : <i className="fa-solid fa-sparkles text-white"></i>}
                  {isAiProcessing ? 'РОЗБИРАЮ...' : 'РОЗІБРАТИ ВХІДНІ З ШІ'}
               </button>
            </div>
          )}
        </div>

        <div className={`flex h-full border-l border-[var(--border-color)] z-[110] bg-[var(--bg-card)] shrink-0 transition-all duration-300 ${isMobile ? (selectedTaskId ? 'fixed inset-0 w-full translate-x-0' : 'fixed inset-0 w-full translate-x-full') : ''}`}>
          <div style={{ width: isMobile ? '100%' : detailsWidth }} className="h-full bg-[var(--bg-card)] relative overflow-hidden flex flex-col">
            {selectedTaskId ? ( <TaskDetails task={tasks.find(t => t.id === selectedTaskId)!} onClose={() => setSelectedTaskId(null)} /> ) : ( !isMobile && <div className="h-full flex flex-col items-center justify-center p-8 text-center opacity-10 grayscale pointer-events-none"> <i className="fa-solid fa-bolt-lightning text-8xl mb-8"></i> </div> )}
          </div>
        </div>

        {showAiWizard && <InboxAiWizard decisions={aiDecisions} onClose={() => setShowAiWizard(false)} onConfirm={() => setShowAiWizard(false)} />}
    </div>
  );
};

export default Inbox;
