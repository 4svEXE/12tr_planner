
import React, { useState, useMemo } from 'react';
import { Task, TaskStatus, Project, InboxCategory } from '../types';
import TaskDetails from '../components/TaskDetails';
import { useApp } from '../contexts/AppContext';
import Typography from '../components/ui/Typography';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { useResizer } from '../hooks/useResizer';
import HashtagAutocomplete from '../components/HashtagAutocomplete';

const SECTION_COLORS = [
  { id: 'slate', bg: 'bg-slate-500', text: 'text-slate-500', hex: '#64748b' },
  { id: 'orange', bg: 'bg-orange-500', text: 'text-orange-500', hex: '#f97316' },
  { id: 'emerald', bg: 'bg-emerald-500', text: 'text-emerald-500', hex: '#10b981' },
  { id: 'indigo', bg: 'bg-indigo-500', text: 'text-indigo-500', hex: '#6366f1' },
  { id: 'rose', bg: 'bg-rose-500', text: 'text-rose-500', hex: '#f43f5e' },
  { id: 'amber', bg: 'bg-amber-500', text: 'text-amber-500', hex: '#f59e0b' },
  { id: 'violet', bg: 'bg-violet-500', text: 'text-violet-500', hex: '#8b5cf6' },
];

// --- SUB-COMPONENT: TaskItem ---
const TaskItem: React.FC<{
  task: Task;
  isSelected: boolean;
  onSelect: () => void;
  onToggle: (task: Task) => void;
  onUpdate: (task: Task) => void;
  projects: Project[];
  tags: any[];
}> = ({ task, isSelected, onSelect, onToggle, onUpdate, projects, tags }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(task.title);
  const isDone = task.status === TaskStatus.DONE;
  const project = projects.find(p => p.id === task.projectId);

  return (
    <div 
      draggable 
      onDragStart={(e) => { e.stopPropagation(); e.dataTransfer.setData('taskId', task.id); }}
      onClick={onSelect}
      className={`group flex items-center gap-3 py-2 px-4 hover:bg-black/5 cursor-grab active:cursor-grabbing border-b border-[var(--border-color)]/30 transition-colors ${
        isSelected ? 'bg-[var(--sidebar-item-active)] border-l-2 border-l-[var(--primary)]' : 'border-l-2 border-l-transparent'
      } ${isDone ? 'opacity-40' : ''}`}
    >
      <button 
        onClick={(e) => { e.stopPropagation(); onToggle(task); }} 
        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
          isDone ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200 bg-white text-transparent hover:border-[var(--primary)]'
        }`}
      >
        {isDone && <i className="fa-solid fa-check text-[9px]"></i>}
      </button>
      <div className="flex-1 min-w-0 flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <input 
              autoFocus 
              value={editValue} 
              onChange={e => setEditValue(e.target.value)}
              onBlur={() => {
                if (editValue.trim() && editValue !== task.title) onUpdate({ ...task, title: editValue.trim() });
                setIsEditing(false);
              }}
              onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); }}
              className="w-full bg-transparent border-none p-0 text-[13px] font-bold text-[var(--text-main)] focus:ring-0 h-5 outline-none"
              onClick={e => e.stopPropagation()}
            />
          ) : (
            <div 
              onDoubleClick={(e) => { e.stopPropagation(); setIsEditing(true); setEditValue(task.title); }}
              className={`text-[13px] font-bold truncate block leading-tight ${
                isDone ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text-main)]'
              }`}
            >
              {task.title}
            </div>
          )}
          {project && <span className="text-[7px] font-black uppercase text-orange-400 opacity-70 px-1.5 py-0.5 bg-orange-50 rounded mt-1 inline-block"># {project.name}</span>}
        </div>
        <div className="flex gap-1.5 shrink-0 ml-2">
           {task.tags.map(tagName => {
              const tagObj = tags.find(t => t.name === tagName);
              return (
                <span 
                  key={tagName} 
                  className="text-[9px] font-black uppercase tracking-tight"
                  style={{ color: tagObj?.color || 'var(--primary)' }}
                >
                  #{tagName}
                </span>
              );
           })}
        </div>
      </div>
    </div>
  );
};

// --- MAIN VIEW COMPONENT ---
const Inbox: React.FC<{ showCompleted?: boolean; showNextActions?: boolean }> = ({ showCompleted = false, showNextActions = false }) => {
  const { 
    tasks, toggleTaskStatus, addTask, moveTaskToCategory, 
    inboxCategories, updateTask, projects, addInboxCategory, 
    updateInboxCategory, deleteInboxCategory, reorderInboxCategories, tags
  } = useApp();
  
  const { isResizing, startResizing, detailsWidth } = useResizer();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [dragOverSection, setDragOverSection] = useState<string | null>(null);
  const [draggedSectionId, setDraggedSectionId] = useState<string | null>(null);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [quickTaskTitle, setQuickTaskTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [sectionEditTitle, setSectionEditTitle] = useState('');
  const [sectionEditColor, setSectionEditColor] = useState<InboxCategory['color']>('slate');
  
  const [addingTaskToSectionId, setAddingTaskToSectionId] = useState<string | null>(null);
  const [sectionTaskTitle, setSectionTaskTitle] = useState('');

  const [deletingSection, setDeletingSection] = useState<InboxCategory | null>(null);

  const displayCategories = useMemo(() => {
    const systemIds = ['pinned', 'unsorted', 'tasks', 'notes'];
    const userCategories = inboxCategories.filter(cat => {
        if (systemIds.includes(cat.id)) {
            if (showNextActions) return cat.id === 'tasks';
            return cat.id !== 'tasks';
        }
        if (showNextActions) return cat.id === 'tasks'; 
        return true; 
    });

    if (showNextActions) {
      const projectSections = projects.filter(p => p.type === 'goal' && p.status === 'active').map(p => ({
        id: p.id,
        title: p.name,
        icon: 'fa-flag-checkered',
        color: 'slate' as const,
        isPinned: false,
        isProject: true,
        projectColor: p.color
      }));
      return [inboxCategories.find(c => c.id === 'tasks'), ...projectSections].filter(Boolean);
    }
    return userCategories;
  }, [showNextActions, inboxCategories, projects]);

  const displayedTasks = useMemo(() => {
    const filtered = tasks.filter(t => {
      if (t.isDeleted || t.projectSection === 'habits') return false;
      if (showNextActions) return t.status === TaskStatus.NEXT_ACTION || (t.status !== TaskStatus.DONE && !!t.projectId);
      if (showCompleted) return t.status === TaskStatus.DONE;
      return t.status === TaskStatus.INBOX && !t.scheduledDate && !t.projectId;
    });

    if (!searchQuery) return filtered;
    const lowerQuery = searchQuery.toLowerCase();
    return filtered.filter(t => 
      t.title.toLowerCase().includes(lowerQuery) || 
      t.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }, [tasks, showCompleted, showNextActions, searchQuery]);

  const handleQuickAdd = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!quickTaskTitle.trim()) return;
    if (showNextActions) {
        addTask(quickTaskTitle.trim(), 'tasks', undefined, 'actions', false, undefined, undefined, TaskStatus.NEXT_ACTION);
    } else {
        addTask(quickTaskTitle.trim(), 'unsorted');
    }
    setQuickTaskTitle('');
  };

  const handleAddToSection = (sectionId: string, isProject: boolean) => {
    if (!sectionTaskTitle.trim()) return;
    if (showNextActions) {
        if (isProject) addTask(sectionTaskTitle.trim(), 'tasks', sectionId, 'actions', false, undefined, undefined, TaskStatus.NEXT_ACTION);
        else addTask(sectionTaskTitle.trim(), sectionId, undefined, 'actions', false, undefined, undefined, TaskStatus.NEXT_ACTION);
    } else {
        addTask(sectionTaskTitle.trim(), sectionId);
    }
    setSectionTaskTitle('');
    setAddingTaskToSectionId(null);
    setCollapsedSections(prev => ({ ...prev, [sectionId]: false }));
  };

  const handleSaveSectionRename = (id: string) => {
    if (sectionEditTitle.trim()) updateInboxCategory(id, { title: sectionEditTitle.trim(), color: sectionEditColor });
    setEditingSectionId(null);
  };

  const confirmDeleteSection = (deleteContent: boolean) => {
    if (!deletingSection) return;
    if (deleteContent) tasks.filter(t => t.category === deletingSection.id).forEach(t => updateTask({ ...t, isDeleted: true }));
    else tasks.filter(t => t.category === deletingSection.id).forEach(t => updateTask({ ...t, category: 'unsorted' }));
    deleteInboxCategory(deletingSection.id);
    setDeletingSection(null);
  };

  const onDropSection = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData('sectionId');
    const taskId = e.dataTransfer.getData('taskId');
    setDragOverSection(null);
    setDraggedSectionId(null);

    if (taskId) {
        const taskToMove = tasks.find(x => x.id === taskId);
        const section = displayCategories.find(c => c.id === targetId);
        if (taskToMove && section) {
            const isProject = (section as any).isProject;
            if (showNextActions) {
                if (isProject) updateTask({...taskToMove, projectId: targetId, status: TaskStatus.NEXT_ACTION, category: 'tasks'});
                else updateTask({...taskToMove, projectId: undefined, category: targetId, status: TaskStatus.NEXT_ACTION});
            } else {
                moveTaskToCategory(taskId, targetId, section.isPinned);
                if (taskToMove.projectId) updateTask({...taskToMove, projectId: undefined, status: TaskStatus.INBOX, category: targetId});
            }
        }
        return;
    }

    if (sourceId && sourceId !== targetId) {
        const sourceIndex = inboxCategories.findIndex(c => c.id === sourceId);
        const targetIndex = inboxCategories.findIndex(c => c.id === targetId);
        if (sourceIndex !== -1 && targetIndex !== -1) {
            const newCategories = [...inboxCategories];
            const [removed] = newCategories.splice(sourceIndex, 1);
            newCategories.splice(targetIndex, 0, removed);
            reorderInboxCategories(newCategories);
        }
    }
  };

  return (
    <div className="h-screen flex overflow-hidden relative bg-[var(--bg-main)]">
        <div className="flex-1 flex flex-col min-w-0 h-full">
          <header className="px-6 pt-3 pb-1 border-b border-[var(--border-color)] flex flex-col gap-2 sticky top-0 bg-[var(--bg-card)] z-20 shadow-sm shrink-0">
            <div className="flex items-center justify-between h-8">
              <div className="flex items-center gap-4 h-full">
                <Typography variant="h1" className="text-base text-[var(--text-main)] tracking-tight font-black uppercase flex items-center gap-3">
                  <i className={`fa-solid ${showNextActions ? 'fa-bolt-lightning' : showCompleted ? 'fa-archive' : 'fa-inbox'} text-[var(--primary)]`}></i>
                  {showNextActions ? 'Наступні дії' : showCompleted ? 'Архів' : 'Вхідні'}
                </Typography>
                <Badge variant="orange" className="px-2 py-0.5 rounded-lg text-[9px] bg-[var(--primary)]/10 text-[var(--primary)]">{displayedTasks.length}</Badge>
                
                {!showCompleted && (
                  <div className="flex items-center border-l border-[var(--border-color)] pl-4 h-6 self-center">
                    {isAddingSection ? (
                      <form onSubmit={(e) => { e.preventDefault(); if(newSectionTitle.trim()){ addInboxCategory(newSectionTitle.trim(), 'slate'); setNewSectionTitle(''); setIsAddingSection(false); } }} className="flex items-center gap-2 animate-in slide-in-from-left-2 h-full m-0 p-0">
                        <input autoFocus value={newSectionTitle} onChange={e => setNewSectionTitle(e.target.value)} onBlur={() => !newSectionTitle && setIsAddingSection(false)} placeholder="Назва..." className="bg-[var(--bg-main)] border border-[var(--primary)]/30 rounded-lg px-2 py-0 h-6 text-[10px] font-black uppercase outline-none w-32 flex items-center" />
                        <button type="submit" className="text-emerald-500 hover:text-emerald-600 h-6 flex items-center justify-center"><i className="fa-solid fa-check text-[10px]"></i></button>
                        <button type="button" onClick={() => setIsAddingSection(false)} className="text-rose-500 hover:text-rose-600 h-6 flex items-center justify-center"><i className="fa-solid fa-xmark text-[10px]"></i></button>
                      </form>
                    ) : (
                      <button onClick={() => setIsAddingSection(true)} className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--primary)] flex items-center gap-1.5 h-full">
                        <i className="fa-solid fa-plus-circle"></i>
                        <span>Секція</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
              
              <div className="relative group flex items-center h-full">
                <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-[10px]"></i>
                <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Фільтр..." className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl py-0 pl-9 pr-4 text-[11px] font-bold focus:ring-1 focus:ring-[var(--primary)] outline-none w-48 h-7" />
              </div>
            </div>

            {!showCompleted && (
              <form onSubmit={handleQuickAdd} className="flex gap-2 mb-1">
                <div className="flex-1">
                  <HashtagAutocomplete value={quickTaskTitle} onChange={setQuickTaskTitle} onSelectTag={() => {}} onEnter={handleQuickAdd} placeholder={showNextActions ? "Додати дію..." : "Додати квест... (#теги)"} className="w-full bg-[var(--bg-main)] border border-[var(--primary)]/30 rounded-xl px-4 py-2 text-[11px] font-bold outline-none h-9" />
                </div>
                <Button size="sm" type="submit" disabled={!quickTaskTitle.trim()} className="h-9">Додати</Button>
              </form>
            )}
          </header>

          <div className="flex-1 overflow-y-auto custom-scrollbar pb-32 mt-1">
            {(displayCategories as InboxCategory[]).map(section => {
                if (!section) return null;
                const isProject = (section as any).isProject;
                let sectionTasks: Task[] = [];
                
                if (showNextActions && isProject) {
                   const goalId = section.id;
                   const goalSubProjects = projects.filter(p => p.parentFolderId === goalId && p.status === 'active');
                   const directTasks = displayedTasks.filter(t => t.projectId === goalId && t.status !== TaskStatus.DONE);
                   const subProjectNextActions = goalSubProjects.map(sp => {
                      const spTasks = tasks.filter(t => t.projectId === sp.id && t.status !== TaskStatus.DONE && !t.isDeleted).sort((a,b) => a.createdAt - b.createdAt);
                      return spTasks.length > 0 ? [spTasks[0]] : [];
                   }).flat();
                   sectionTasks = [...directTasks, ...subProjectNextActions];
                } else {
                   sectionTasks = displayedTasks.filter(t => {
                     const inCat = (section.isPinned && t.isPinned) || (!section.isPinned && t.category === section.id && !t.isPinned);
                     if (showNextActions && !isProject) return inCat && !t.projectId;
                     return inCat;
                   });
                }
                
                const isCollapsed = collapsedSections[section.id];
                const isAddingTask = addingTaskToSectionId === section.id;
                const isEditingName = editingSectionId === section.id;
                const sectionColorData = SECTION_COLORS.find(c => c.id === section.color) || SECTION_COLORS[0];
                const sectionColorClass = !isProject ? sectionColorData.text : 'text-slate-900';
                const sectionStyles = !isProject && section.color && section.color !== 'slate' ? { backgroundColor: `${sectionColorData.hex}08` } : {};

                if (sectionTasks.length === 0 && !isAddingTask && !isProject && ['pinned', 'unsorted', 'tasks', 'notes'].includes(section.id)) return null;

                return (
                  <div key={section.id} 
                    draggable={!isProject && !['pinned', 'unsorted', 'tasks', 'notes'].includes(section.id)}
                    onDragStart={(e) => { e.dataTransfer.setData('sectionId', section.id); setDraggedSectionId(section.id); }}
                    onDragOver={(e) => { e.preventDefault(); setDragOverSection(section.id); }} 
                    onDrop={(e) => onDropSection(e, section.id)}
                    style={sectionStyles}
                    className={`flex flex-col border-b border-[var(--border-color)]/20 transition-all ${dragOverSection === section.id ? 'bg-[var(--primary)]/5 ring-1 ring-[var(--primary)]/20' : ''} ${draggedSectionId === section.id ? 'opacity-30' : ''}`}
                  >
                    <div className="group flex items-center gap-3 py-2.5 px-6 hover:bg-black/5 cursor-pointer select-none">
                      <div className="flex items-center gap-2.5 flex-1 min-w-0" onClick={() => setCollapsedSections(p => ({...p, [section.id]: !isCollapsed}))}>
                        <i className={`fa-solid fa-chevron-right text-[8px] text-[var(--text-muted)] transition-transform ${!isCollapsed ? 'rotate-90' : ''}`}></i>
                        {isProject && (section as any).projectColor ? <div className="w-1 h-4 rounded-full" style={{ backgroundColor: (section as any).projectColor }}></div> : <i className={`fa-solid ${section.icon} text-[10px] shrink-0 ${sectionColorClass}`}></i>}
                        
                        <div className="flex-1 min-w-0">
                           {isEditingName ? (
                             <div className="flex flex-col gap-2" onClick={e => e.stopPropagation()}>
                                <input autoFocus value={sectionEditTitle} onChange={e => setSectionEditTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSaveSectionRename(section.id)} className="bg-[var(--bg-main)] border border-[var(--primary)]/30 rounded px-1.5 py-1 text-[11px] font-black uppercase w-full outline-none" />
                                <div className="flex items-center gap-1.5 pb-1">
                                    {SECTION_COLORS.map(c => (
                                        <button key={c.id} onClick={() => setSectionEditColor(c.id as any)} className={`w-4 h-4 rounded-full transition-transform hover:scale-125 ${c.bg} ${sectionEditColor === c.id ? 'ring-2 ring-offset-1 ring-slate-400 scale-110' : ''}`} />
                                    ))}
                                    <div className="flex-1"></div>
                                    <button onClick={() => handleSaveSectionRename(section.id)} className="text-[9px] font-black text-emerald-500 uppercase tracking-widest hover:text-emerald-600">Зберегти</button>
                                </div>
                             </div>
                           ) : (
                             <Typography variant="tiny" onDoubleClick={(e) => { e.stopPropagation(); if (!isProject && !['pinned', 'unsorted', 'tasks', 'notes'].includes(section.id)) { setEditingSectionId(section.id); setSectionEditTitle(section.title); setSectionEditColor(section.color || 'slate'); }}} className={`${isProject ? 'text-[var(--text-main)] font-black' : `${sectionColorClass} font-black`} uppercase tracking-widest text-[9px] truncate`}>
                                {section.title}
                             </Typography>
                           )}
                        </div>

                        {!showCompleted && !isEditingName && (
                           <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100">
                             <button onClick={(e) => { e.stopPropagation(); setAddingTaskToSectionId(section.id); }} className="w-5 h-5 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center hover:scale-110 shadow-sm"><i className="fa-solid fa-plus text-[9px]"></i></button>
                             {!isProject && !['pinned', 'unsorted', 'tasks', 'notes'].includes(section.id) && (
                               <>
                                 <button onClick={(e) => { e.stopPropagation(); setEditingSectionId(section.id); setSectionEditTitle(section.title); setSectionEditColor(section.color || 'slate'); }} className="w-5 h-5 rounded-lg hover:bg-orange-50 text-[var(--primary)] flex items-center justify-center"><i className="fa-solid fa-pencil text-[9px]"></i></button>
                                 <button onClick={(e) => { e.stopPropagation(); setDeletingSection(section); }} className="w-5 h-5 rounded-lg hover:bg-rose-50 text-rose-500 flex items-center justify-center"><i className="fa-solid fa-trash text-[9px]"></i></button>
                               </>
                             )}
                           </div>
                        )}
                      </div>
                      <span className="text-[9px] font-black text-[var(--text-muted)] opacity-30">{sectionTasks.length}</span>
                    </div>

                    {isAddingTask && (
                      <div className="px-6 py-2 bg-black/5">
                        <HashtagAutocomplete autoFocus value={sectionTaskTitle} onChange={setSectionTaskTitle} onSelectTag={() => {}} onBlur={() => { if(!sectionTaskTitle.trim()) setAddingTaskToSectionId(null); }} onEnter={() => handleAddToSection(section.id, !!isProject)} placeholder="Швидка дія..." className="w-full bg-[var(--bg-main)] border border-[var(--primary)]/30 rounded-xl px-4 py-2 text-[11px] font-bold outline-none h-10" />
                      </div>
                    )}

                    {!isCollapsed && (
                      <div className="flex flex-col">
                        {sectionTasks.map(t => (
                          <TaskItem 
                            key={t.id} 
                            task={t} 
                            isSelected={selectedTaskId === t.id} 
                            onSelect={() => setSelectedTaskId(t.id)} 
                            onToggle={toggleTaskStatus} 
                            onUpdate={updateTask} 
                            projects={projects} 
                            tags={tags} 
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
            })}
          </div>
        </div>
        
        <div className="flex h-full border-l border-[var(--border-color)] z-[40] bg-[var(--bg-card)] shrink-0">
          <div onMouseDown={startResizing} className={`w-[1px] h-full cursor-col-resize hover:bg-[var(--primary)]/50 z-[100] transition-colors ${isResizing ? 'bg-[var(--primary)]' : 'bg-[var(--border-color)]/50'}`}></div>
          <div style={{ width: detailsWidth }} className="h-full bg-[var(--bg-card)] relative overflow-hidden flex flex-col">
            {selectedTaskId ? (
              <TaskDetails task={tasks.find(t => t.id === selectedTaskId)!} onClose={() => setSelectedTaskId(null)} />
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center opacity-5 grayscale pointer-events-none">
                <i className="fa-solid fa-bolt-lightning text-8xl mb-8"></i>
                <Typography variant="tiny" className="text-[12px] font-black uppercase tracking-[0.3em]">Фокус на дії</Typography>
              </div>
            )}
          </div>
        </div>

        {deletingSection && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
             <div className="absolute inset-0 bg-black/20" onClick={() => setDeletingSection(null)}></div>
             <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl border border-slate-100 p-8 flex flex-col items-center text-center relative z-10 animate-in zoom-in-95 duration-300">
                <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-500 flex items-center justify-center text-2xl mb-6 shadow-sm"><i className="fa-solid fa-trash-can-arrow-up"></i></div>
                <Typography variant="h2" className="text-xl mb-2">Видалити секцію?</Typography>
                <Typography variant="body" className="text-slate-500 mb-8 px-4">Секція <span className="font-black text-slate-800">"{deletingSection.title}"</span> містить {tasks.filter(t => t.category === deletingSection.id).length} завдання. Що з ними зробити?</Typography>
                <div className="flex flex-col gap-3 w-full">
                   <button onClick={() => confirmDeleteSection(false)} className="w-full py-4 rounded-2xl bg-slate-900 text-white text-[11px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg">ЗБЕРЕГТИ ЗАВДАННЯ (У ВХІДНІ)</button>
                   <button onClick={() => confirmDeleteSection(true)} className="w-full py-4 rounded-2xl bg-rose-50 text-rose-600 text-[11px] font-black uppercase tracking-widest hover:bg-rose-100 transition-all border border-rose-100">ВИДАЛИТИ РАЗОМ ІЗ ЗАВДАННЯМИ</button>
                   <button onClick={() => setDeletingSection(null)} className="w-full mt-2 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors">СКАСУВАТИ</button>
                </div>
             </div>
          </div>
        )}
    </div>
  );
};

export default Inbox;
