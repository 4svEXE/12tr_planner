import React, { useState, useMemo, useEffect } from 'react';
// Added Character to the list of imports from '../types' to resolve the 'Cannot find name Character' error on line 142.
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

const SECTION_COLORS = [
  { id: 'slate', bg: 'bg-slate-500', text: 'text-slate-500', hex: '#64748b' },
  { id: 'orange', bg: 'bg-orange-500', text: 'text-orange-500', hex: '#f97316' },
  { id: 'emerald', bg: 'bg-emerald-500', text: 'text-emerald-500', hex: '#10b981' },
  { id: 'indigo', bg: 'bg-indigo-500', text: 'text-indigo-500', hex: '#6366f1' },
  { id: 'rose', bg: 'bg-rose-500', text: 'text-rose-500', hex: '#f43f5e' },
  { id: 'amber', bg: 'bg-amber-500', text: 'text-amber-500', hex: '#f59e0b' },
  { id: 'violet', bg: 'bg-violet-500', text: 'text-violet-500', hex: '#8b5cf6' },
];

const Inbox: React.FC<{ showCompleted?: boolean; showNextActions?: boolean }> = ({ showCompleted = false, showNextActions = false }) => {
  const { 
    tasks, toggleTaskStatus, toggleTaskPin, addTask, moveTaskToCategory, 
    inboxCategories, updateTask, projects, addInboxCategory, 
    updateInboxCategory, deleteInboxCategory, tags, character, aiEnabled,
    addPerson, addPersonNote, addProject, updateCharacter, people
  } = useApp();
  
  const { isResizing, startResizing, detailsWidth } = useResizer();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [dragOverSection, setDragOverSection] = useState<string | null>(null);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [quickTaskTitle, setQuickTaskTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [sectionEditTitle, setSectionEditTitle] = useState('');
  const [sectionEditColor, setSectionEditColor] = useState<InboxCategory['color']>('slate');
  
  const [addingTaskToSectionId, setAddingTaskToSectionId] = useState<string | null>(null);
  const [sectionTaskTitle, setSectionTaskTitle] = useState('');
  const [deletingSection, setDeletingSection] = useState<InboxCategory | null>(null);

  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiDecisions, setAiDecisions] = useState<any[]>([]);
  const [showAiWizard, setShowAiWizard] = useState(false);
  const [implementationSummary, setImplementationSummary] = useState<string[] | null>(null);

  const displayCategories = useMemo(() => {
    const currentScope = showNextActions ? 'actions' : 'inbox';
    const systemIds = ['pinned', 'unsorted', 'tasks', 'notes'];
    
    const filteredInboxCats = inboxCategories.filter(cat => {
        if (systemIds.includes(cat.id)) {
            if (showNextActions) return cat.id === 'tasks';
            return cat.id !== 'tasks';
        }
        return cat.scope === currentScope;
    });

    if (showNextActions) {
      const projectSections = projects.filter(p => p.type === 'goal' && p.status === 'active').map(p => ({ id: p.id, title: p.name, icon: 'fa-flag-checkered', color: 'slate' as const, isPinned: false, isProject: true, projectColor: p.color }));
      return [...filteredInboxCats, ...projectSections].filter(Boolean);
    }
    
    return filteredInboxCats;
  }, [showNextActions, inboxCategories, projects]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      if (t.isDeleted || t.projectSection === 'habits') return false;
      if (showNextActions) return t.status === TaskStatus.NEXT_ACTION || (t.status !== TaskStatus.DONE && !!t.projectId);
      if (showCompleted) return t.status === TaskStatus.DONE;
      return t.status === TaskStatus.INBOX && !t.scheduledDate && !t.projectId;
    });
  }, [tasks, showCompleted, showNextActions]);

  const displayedTasks = useMemo(() => {
    let base = filteredTasks;
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      base = base.filter(t => t.title.toLowerCase().includes(lowerQuery) || t.tags.some(tag => tag.toLowerCase().includes(lowerQuery)));
    }
    return base;
  }, [filteredTasks, searchQuery]);

  const handleAiProcess = async () => {
    const unsortedTasks = tasks.filter(t => !t.isDeleted && t.status === TaskStatus.INBOX && t.category === 'unsorted');
    if (unsortedTasks.length === 0) {
      alert("Вхідні порожні.");
      return;
    }

    setIsAiProcessing(true);
    try {
      const result = await processInboxWithAi(unsortedTasks.map(t => ({ id: t.id, title: t.title, content: t.content })), character, people.map(p => p.name));
      setAiDecisions(result);
      setShowAiWizard(true);
    } catch (e) {
      alert("Помилка AI.");
    } finally {
      setIsAiProcessing(false);
    }
  };

  const confirmAiDecisions = (selectedIds: Set<string>) => {
    const toApply = aiDecisions.filter(d => selectedIds.has(d.id));
    const logs: string[] = [];
    
    toApply.forEach(d => {
      const task = tasks.find(t => t.id === d.id);
      if (!task) return;

      let currentProjectId = task.projectId;
      if (d.category === 'project') {
         currentProjectId = addProject({ name: task.title, description: task.content || d.reason, color: '#f97316', isStrategic: true, type: 'goal' });
         logs.push(`🚀 Створено проєкт: "${task.title}"`);
      }

      if (d.decomposition?.subtasks) {
         d.decomposition.subtasks.forEach((st: string) => addTask(st, 'tasks', currentProjectId, 'actions', false, undefined, undefined, TaskStatus.NEXT_ACTION));
         logs.push(`✅ Додано ${d.decomposition.subtasks.length} підзавдань`);
      }

      if (d.decomposition?.people) {
         d.decomposition.people.forEach((p: any) => {
            const existing = people.find(ep => ep.name.toLowerCase() === p.name.toLowerCase());
            if (existing) { addPersonNote(existing.id, p.note); logs.push(`👥 Оновлено контакт: ${existing.name}`); }
            else { const pid = addPerson(p.name); addPersonNote(pid, p.note); logs.push(`👤 Новий союзник: ${p.name}`); }
         });
      }

      if (d.profileImpact) {
         const impact = d.profileImpact;
         const updates: Partial<Character> = {};
         const pref = { ...character.preferences };
         
         if (impact.bioUpdate) updates.bio = character.bio + "\n" + impact.bioUpdate;
         if (impact.roleUpdate) updates.role = impact.roleUpdate;
         if (impact.newBelief) updates.beliefs = [...character.beliefs, impact.newBelief];
         if (impact.workStyleUpdate) pref.workStyle = impact.workStyleUpdate;
         if (impact.newFocusBlocker) pref.focusBlockers = [...pref.focusBlockers, impact.newFocusBlocker];
         
         updates.preferences = pref;
         updateCharacter(updates);
         logs.push(`📜 Оновлено ідентичність Героя`);
      }

      updateTask({ ...task, category: d.category === 'project' ? 'tasks' : d.category, projectId: currentProjectId, priority: d.priority as Priority, status: d.status as TaskStatus, tags: [...new Set([...task.tags, ...d.tags])] });
    });

    setShowAiWizard(false);
    setAiDecisions([]);
    setImplementationSummary(logs);
  };

  const handleQuickAdd = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!quickTaskTitle.trim()) return;
    if (showNextActions) { addTask(quickTaskTitle.trim(), 'tasks', undefined, 'actions', false, undefined, undefined, TaskStatus.NEXT_ACTION); }
    else { addTask(quickTaskTitle.trim(), 'unsorted'); }
    setQuickTaskTitle('');
  };

  const handleAddToSection = (sectionId: string, isProject: boolean) => {
    if (!sectionTaskTitle.trim()) return;
    if (showNextActions) {
        if (isProject) { addTask(sectionTaskTitle.trim(), 'tasks', sectionId, 'actions', false, undefined, undefined, TaskStatus.NEXT_ACTION); }
        else { addTask(sectionTaskTitle.trim(), sectionId, undefined, 'actions', false, undefined, undefined, TaskStatus.NEXT_ACTION); }
    } else { addTask(sectionTaskTitle.trim(), sectionId); }
    setSectionTaskTitle('');
    setAddingTaskToSectionId(null);
    setCollapsedSections(prev => ({ ...prev, [sectionId]: false }));
  };

  const handleAddSection = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSectionTitle.trim()) {
      const scope = showNextActions ? 'actions' : 'inbox';
      addInboxCategory(newSectionTitle.trim(), scope, 'slate');
      setNewSectionTitle('');
      setIsAddingSection(false);
    }
  };

  const handleSaveSectionRename = (id: string) => {
    if (sectionEditTitle.trim()) { updateInboxCategory(id, { title: sectionEditTitle.trim(), color: sectionEditColor }); }
    setEditingSectionId(null);
  };

  const confirmDeleteSection = (deleteContent: boolean) => {
    if (!deletingSection) return;
    const sectionTasks = tasks.filter(t => t.category === deletingSection.id);
    if (deleteContent) { sectionTasks.forEach(t => updateTask({ ...t, isDeleted: true })); }
    else { sectionTasks.forEach(t => updateTask({ ...t, category: 'unsorted' })); }
    deleteInboxCategory(deletingSection.id);
    setDeletingSection(null);
  };

  const onDragStartSection = (e: React.DragEvent, id: string) => { e.dataTransfer.setData('sectionId', id); };
  const onDropSection = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    setDragOverSection(null);
    if (taskId) {
        const taskToMove = tasks.find(x => x.id === taskId);
        const section = displayCategories.find(c => c.id === targetId);
        if (taskToMove && section) {
            const isProject = (section as any).isProject;
            if (showNextActions) {
                if (isProject) { updateTask({...taskToMove, projectId: targetId, status: TaskStatus.NEXT_ACTION, category: 'tasks'}); }
                else { updateTask({...taskToMove, projectId: undefined, category: targetId, status: TaskStatus.NEXT_ACTION}); }
            } else {
                moveTaskToCategory(taskId, targetId, section.isPinned);
                if (taskToMove.projectId) updateTask({...taskToMove, projectId: undefined, status: TaskStatus.INBOX, category: targetId});
            }
        }
    }
  };

  const renderTask = (task: Task) => {
    const isEditing = editingTaskId === task.id;
    const project = projects.find(p => p.id === task.projectId);
    const isDone = task.status === TaskStatus.DONE;
    return (
      <div key={task.id} draggable onDragStart={(e) => { e.stopPropagation(); e.dataTransfer.setData('taskId', task.id); }} onClick={() => setSelectedTaskId(task.id)} className={`group flex items-center gap-3 py-2 px-4 hover:bg-black/5 cursor-grab active:cursor-grabbing border-b border-[var(--border-color)]/30 transition-colors ${selectedTaskId === task.id ? 'bg-[var(--sidebar-item-active)] border-l-2 border-l-[var(--primary)]' : 'border-l-2 border-l-transparent'} ${isDone ? 'opacity-40' : ''}`}>
        <button onClick={(e) => { e.stopPropagation(); toggleTaskStatus(task); }} className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${isDone ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200 bg-white text-transparent hover:border-[var(--primary)]'}`}> {isDone && <i className="fa-solid fa-check text-[9px]"></i>} </button>
        <div className="flex-1 min-w-0 flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <input autoFocus value={editingValue} onChange={e => setEditingValue(e.target.value)} onBlur={() => { if (editingValue.trim() && editingValue !== task.title) updateTask({ ...task, title: editingValue.trim() }); setEditingTaskId(null); }} onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); }} className="w-full bg-transparent border-none p-0 text-[13px] font-bold text-[var(--text-main)] focus:ring-0 h-5 outline-none" onClick={e => e.stopPropagation()} />
            ) : (
              <div onDoubleClick={(e) => { e.stopPropagation(); setEditingTaskId(task.id); setEditingValue(task.title); }} className={`text-[13px] font-bold truncate block leading-tight ${isDone ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text-main)]'}`}> {task.title} </div>
            )}
            {project && <span className="text-[7px] font-black uppercase text-orange-400 opacity-70 px-1.5 py-0.5 bg-orange-50 rounded mt-1 inline-block"># {project.name}</span>}
          </div>
          <div className="flex gap-1.5 shrink-0 ml-2"> {task.tags.map(tagName => { const tagObj = tags.find(t => t.name === tagName); return ( <span key={tagName} className="text-[9px] font-black uppercase tracking-tight" style={{ color: tagObj?.color || 'var(--primary)' }}> #{tagName} </span> ); })} </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen flex overflow-hidden relative bg-[var(--bg-main)]">
        <div className="flex-1 flex flex-col min-w-0 h-full relative">
          <header className="px-6 pt-3 pb-1 border-b border-[var(--border-color)] flex flex-col gap-2 sticky top-0 bg-[var(--bg-card)] z-20 shadow-sm shrink-0">
            <div className="flex items-center justify-between h-8">
              <div className="flex items-center gap-4 h-full">
                <Typography variant="h1" className="text-base text-[var(--text-main)] tracking-tight font-black uppercase flex items-center gap-3">
                  <i className={`fa-solid ${showNextActions ? 'fa-bolt-lightning' : showCompleted ? 'fa-clipboard-check' : 'fa-inbox'} text-[var(--primary)]`}></i>
                  {showNextActions ? 'Наступні дії' : showCompleted ? 'Архів' : 'Вхідні'}
                </Typography>
                <Badge variant="orange" className="px-2 py-0.5 rounded-lg text-[9px] bg-[var(--primary)]/10 text-[var(--primary)]">{displayedTasks.length}</Badge>
                {!showCompleted && (
                  <div className="flex items-center border-l border-[var(--border-color)] pl-4 h-6 self-center">
                    {isAddingSection ? (
                      <form onSubmit={handleAddSection} className="flex items-center gap-2 animate-in slide-in-from-left-2 h-full m-0 p-0">
                        <input autoFocus value={newSectionTitle} onChange={e => setNewSectionTitle(e.target.value)} onBlur={() => !newSectionTitle && setIsAddingSection(false)} placeholder="Назва..." className="bg-[var(--bg-main)] border border-[var(--primary)]/30 rounded-lg px-2 py-0 h-6 text-[10px] font-black uppercase outline-none w-32 flex items-center" />
                        <button type="submit" className="text-emerald-500 hover:text-emerald-600 h-6 flex items-center justify-center"><i className="fa-solid fa-check text-[10px]"></i></button>
                        <button type="button" onClick={() => setIsAddingSection(false)} className="text-rose-500 hover:text-rose-600 h-6 flex items-center justify-center"><i className="fa-solid fa-xmark text-[10px]"></i></button>
                      </form>
                    ) : (
                      <button onClick={() => setIsAddingSection(true)} className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--primary)] flex items-center gap-1.5 h-full"> <i className="fa-solid fa-plus-circle"></i> <span>Секція</span> </button>
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
                <div className="flex-1"> <HashtagAutocomplete value={quickTaskTitle} onChange={setQuickTaskTitle} onSelectTag={() => {}} onEnter={handleQuickAdd} placeholder={showNextActions ? "Додати дію..." : "Додати квест... (#теги)"} className="w-full bg-[var(--bg-main)] border border-[var(--primary)]/30 rounded-xl px-4 py-2 text-[11px] font-bold outline-none h-9" /> </div>
                <Button size="sm" type="submit" disabled={!quickTaskTitle.trim()} className="h-9">Додати</Button>
              </form>
            )}
          </header>

          <div className="flex-1 overflow-y-auto custom-scrollbar pb-32 mt-1">
            {(displayCategories as InboxCategory[]).map(section => {
                if (!section) return null;
                let sectionTasks: Task[] = [];
                const isProject = (section as any).isProject;
                if (showNextActions && isProject) {
                   const goalId = section.id;
                   const goalSubProjects = projects.filter(p => p.parentFolderId === goalId && p.status === 'active');
                   const directTasks = displayedTasks.filter(t => t.projectId === goalId && t.status !== TaskStatus.DONE);
                   const subProjectNextActions = goalSubProjects.map(sp => { const spTasks = tasks.filter(t => t.projectId === sp.id && t.status !== TaskStatus.DONE && !t.isDeleted).sort((a,b) => a.createdAt - b.createdAt); return spTasks.length > 0 ? [spTasks[0]] : []; }).flat();
                   sectionTasks = [...directTasks, ...subProjectNextActions];
                } else { sectionTasks = displayedTasks.filter(t => { const inCat = (section.isPinned && t.isPinned) || (!section.isPinned && t.category === section.id && !t.isPinned); if (showNextActions && !isProject) return inCat && !t.projectId; return inCat; }); }
                const isCollapsed = collapsedSections[section.id];
                const isAddingTask = addingTaskToSectionId === section.id;
                const isEditingName = editingSectionId === section.id;
                const sectionColorData = SECTION_COLORS.find(c => c.id === section.color) || SECTION_COLORS[0];
                const sectionStyles = !isProject && section.color && section.color !== 'slate' ? { backgroundColor: `${sectionColorData.hex}08` } : {};
                if (sectionTasks.length === 0 && !isAddingTask && !isProject && ['pinned', 'unsorted', 'tasks', 'notes'].includes(section.id)) return null;
                return (
                  <div key={section.id} draggable={!isProject && !['pinned', 'unsorted', 'tasks', 'notes'].includes(section.id)} onDragStart={(e) => onDragStartSection(e, section.id)} onDragOver={(e) => { e.preventDefault(); setDragOverSection(section.id); }} onDrop={(e) => onDropSection(e, section.id)} style={sectionStyles} className={`flex flex-col border-b border-[var(--border-color)]/20 transition-all ${dragOverSection === section.id ? 'bg-[var(--primary)]/5 ring-1 ring-[var(--primary)]/20' : ''}`}>
                    <div className="group flex items-center gap-3 py-2.5 px-6 hover:bg-black/5 cursor-pointer select-none">
                      <div className="flex items-center gap-2.5 flex-1 min-w-0" onClick={() => setCollapsedSections(p => ({...p, [section.id]: !isCollapsed}))}>
                        <i className={`fa-solid fa-chevron-right text-[8px] text-[var(--text-muted)] transition-transform ${!isCollapsed ? 'rotate-90' : ''}`}></i>
                        {isProject && (section as any).projectColor ? ( <div className="w-1 h-4 rounded-full" style={{ backgroundColor: (section as any).projectColor }}></div> ) : ( <i className={`fa-solid ${section.icon} text-[10px] shrink-0 ${!isProject ? sectionColorData.text : 'text-slate-900'}`}></i> )}
                        <div className="flex-1 min-w-0">
                           {isEditingName ? ( <div className="flex flex-col gap-2" onClick={e => e.stopPropagation()}> <input autoFocus value={sectionEditTitle} onChange={e => setSectionEditTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSaveSectionRename(section.id)} className="bg-[var(--bg-main)] border border-[var(--primary)]/30 rounded px-1.5 py-1 text-[11px] font-black uppercase w-full outline-none" /> </div> ) : ( <Typography variant="tiny" onDoubleClick={(e) => { e.stopPropagation(); if (!isProject && !['pinned', 'unsorted', 'tasks', 'notes'].includes(section.id)) { setEditingSectionId(section.id); setSectionEditTitle(section.title); setSectionEditColor(section.color || 'slate'); } }} className={`${isProject ? 'text-[var(--text-main)] font-black' : `${sectionColorData.text} font-black`} uppercase tracking-widest text-[9px] truncate`}>{section.title}</Typography> )}
                        </div>
                        {!showCompleted && !isEditingName && (
                           <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100">
                             <button onClick={(e) => { e.stopPropagation(); setAddingTaskToSectionId(section.id); }} className="w-5 h-5 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center hover:scale-110 shadow-sm"><i className="fa-solid fa-plus text-[9px]"></i></button>
                             {!isProject && !['pinned', 'unsorted', 'tasks', 'notes'].includes(section.id) && ( <> <button onClick={(e) => { e.stopPropagation(); setEditingSectionId(section.id); setSectionEditTitle(section.title); setSectionEditColor(section.color || 'slate'); }} className="w-5 h-5 rounded-lg hover:bg-orange-50 text-[var(--primary)] flex items-center justify-center"><i className="fa-solid fa-pencil text-[9px]"></i></button> <button onClick={(e) => { e.stopPropagation(); setDeletingSection(section); }} className="w-5 h-5 rounded-lg hover:bg-rose-50 text-rose-500 flex items-center justify-center"><i className="fa-solid fa-trash text-[10px]"></i></button> </> )}
                           </div>
                        )}
                      </div>
                      <span className="text-[9px] font-black text-[var(--text-muted)] opacity-30">{sectionTasks.length}</span>
                    </div>
                    {isAddingTask && ( <div className="px-6 py-2 bg-black/5"> <HashtagAutocomplete autoFocus value={sectionTaskTitle} onChange={setSectionTaskTitle} onSelectTag={() => {}} onBlur={() => { if(!sectionTaskTitle.trim()) setAddingTaskToSectionId(null); }} onEnter={() => handleAddToSection(section.id, !!isProject)} placeholder="Швидка дія..." className="w-full bg-[var(--bg-main)] border border-[var(--primary)]/30 rounded-xl px-4 py-2 text-[11px] font-bold outline-none h-10" /> </div> )}
                    {!isCollapsed && <div className="flex flex-col">{sectionTasks.map(renderTask)}</div>}
                  </div>
                );
            })}
          </div>

          {aiEnabled && !showNextActions && !showCompleted && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30">
               <button onClick={handleAiProcess} disabled={isAiProcessing} className="bg-slate-900 text-white px-8 py-3 rounded-2xl shadow-2xl flex items-center gap-3 hover:scale-105 active:scale-95 transition-all group overflow-hidden border border-white/10"> <div className="absolute inset-0 bg-gradient-to-tr from-orange-600/20 to-pink-600/20 opacity-0 group-hover:opacity-100 transition-opacity"></div> {isAiProcessing ? ( <i className="fa-solid fa-circle-notch animate-spin text-orange-400"></i> ) : ( <i className="fa-solid fa-sparkles text-orange-400"></i> )} <span className="text-[10px] font-black uppercase tracking-widest relative z-10"> {isAiProcessing ? 'РОЗБИРАЮ...' : 'РОЗІБРАТИ ВХІДНІ З ШІ'} </span> </button>
            </div>
          )}
        </div>
        
        <div className="flex h-full border-l border-[var(--border-color)] z-40 bg-[var(--bg-card)] shrink-0">
          <div onMouseDown={startResizing} className={`w-[1px] h-full cursor-col-resize hover:bg-[var(--primary)]/50 z-[100] transition-colors ${isResizing ? 'bg-[var(--primary)]' : 'bg-[var(--border-color)]/50'}`}></div>
          <div style={{ width: detailsWidth }} className="h-full bg-[var(--bg-card)] relative overflow-hidden flex flex-col">
            {selectedTaskId ? ( <TaskDetails task={tasks.find(t => t.id === selectedTaskId)!} onClose={() => setSelectedTaskId(null)} /> ) : ( <div className="h-full flex flex-col items-center justify-center p-8 text-center opacity-5 grayscale pointer-events-none"> <i className="fa-solid fa-bolt-lightning text-8xl mb-8"></i> <Typography variant="tiny" className="text-[12px] font-black uppercase tracking-[0.3em]">Фокус на дії</Typography> </div> )}
          </div>
        </div>
        {showAiWizard && ( <InboxAiWizard decisions={aiDecisions} onClose={() => setShowAiWizard(false)} onConfirm={confirmAiDecisions} /> )}
        {implementationSummary && ( <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 tiktok-blur animate-in fade-in"> <div className="absolute inset-0 bg-slate-950/40" onClick={() => setImplementationSummary(null)}></div> <Card className="w-full max-w-md bg-white border-none shadow-2xl p-8 rounded-[2.5rem] relative z-10 animate-in zoom-in-95 duration-300"> <div className="w-16 h-16 rounded-[2rem] bg-emerald-50 text-emerald-600 flex items-center justify-center text-2xl mb-6 mx-auto shadow-sm"> <i className="fa-solid fa-circle-check"></i> </div> <Typography variant="h2" className="text-center mb-2">Впроваджено успішно!</Typography> <Typography variant="body" className="text-center text-slate-400 mb-8">Ось що ШІ додав до твоєї системи:</Typography> <div className="space-y-2 mb-8 max-h-64 overflow-y-auto custom-scrollbar pr-2"> {implementationSummary.map((log, i) => ( <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl text-[11px] font-bold text-slate-700"> <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> {log} </div> ))} </div> <Button variant="primary" className="w-full py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest" onClick={() => setImplementationSummary(null)}>ПРОДОВЖИТИ ГРУ</Button> </Card> </div> )}
        {deletingSection && ( <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200"> <div className="absolute inset-0 bg-black/20" onClick={() => setDeletingSection(null)}></div> <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl border border-slate-100 p-8 flex flex-col items-center text-center relative z-10 animate-in zoom-in-95 duration-300"> <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-500 flex items-center justify-center text-2xl mb-6 shadow-sm"><i className="fa-solid fa-trash-can-arrow-up"></i></div> <Typography variant="h2" className="text-xl mb-2">Видалити секцію?</Typography> <Typography variant="body" className="text-slate-500 mb-8 px-4">Секція <span className="font-black text-slate-800">"{deletingSection.title}"</span> місти завдання. Що з ними зробити?</Typography> <div className="flex flex-col gap-3 w-full"> <button onClick={() => confirmDeleteSection(false)} className="w-full py-4 rounded-2xl bg-slate-900 text-white text-[11px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg">ЗБЕРЕГТИ ЗАВДАННЯ (У ВХІДНІ)</button> <button onClick={() => confirmDeleteSection(true)} className="w-full py-4 rounded-2xl bg-rose-50 text-rose-600 text-[11px] font-black uppercase tracking-widest hover:bg-rose-100 transition-all border border-rose-100">ВИДАЛИТИ РАЗОМ ІЗ ЗАВДАННЯМИ</button> <button onClick={() => setDeletingSection(null)} className="w-full mt-2 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors">СКАСУВАТИ</button> </div> </div> </div> )}
    </div>
  );
};

export default Inbox;