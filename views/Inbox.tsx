
import React, { useState, useMemo, useEffect } from 'react';
import { Task, TaskStatus, Project, Priority, InboxCategory } from '../types';
import TaskDetails from '../components/TaskDetails';
import { useApp } from '../contexts/AppContext';
import Typography from '../components/ui/Typography';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { useResizer } from '../hooks/useResizer';
import HashtagAutocomplete from '../components/HashtagAutocomplete';

const Inbox: React.FC<{ showCompleted?: boolean; showNextActions?: boolean }> = ({ showCompleted = false, showNextActions = false }) => {
  const { 
    tasks, toggleTaskStatus, toggleTaskPin, addTask, moveTaskToCategory, 
    inboxCategories, updateTask, projects, addInboxCategory, 
    updateInboxCategory, deleteInboxCategory, tags, setActiveTab, people
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
  
  const [addingTaskToSectionId, setAddingTaskToSectionId] = useState<string | null>(null);
  const [sectionTaskTitle, setSectionTaskTitle] = useState('');

  // Розділяємо секції: у "Вхідних" одні, у "Наступних діях" інші
  const displayCategories = useMemo(() => {
    const systemIds = ['pinned', 'unsorted', 'tasks', 'notes'];
    
    const userCategories = inboxCategories.filter(cat => {
        if (systemIds.includes(cat.id)) {
            if (showNextActions) return cat.id === 'tasks';
            return cat.id !== 'tasks';
        }
        // color === 'orange' використовується як маркер секцій для "Наступних дій"
        const isNextActionCategory = cat.color === 'orange';
        return showNextActions ? isNextActionCategory : !isNextActionCategory;
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
      return [...userCategories, ...projectSections];
    }
    
    return userCategories;
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
      base = base.filter(t => 
        t.title.toLowerCase().includes(lowerQuery) || 
        t.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
      );
    }
    return base;
  }, [filteredTasks, searchQuery]);

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
        if (isProject) {
            addTask(sectionTaskTitle.trim(), 'tasks', sectionId, 'actions', false, undefined, undefined, TaskStatus.NEXT_ACTION);
        } else {
            addTask(sectionTaskTitle.trim(), sectionId, undefined, 'actions', false, undefined, undefined, TaskStatus.NEXT_ACTION);
        }
    } else {
        addTask(sectionTaskTitle.trim(), sectionId);
    }
    setSectionTaskTitle('');
    setAddingTaskToSectionId(null);
    setCollapsedSections(prev => ({ ...prev, [sectionId]: false }));
  };

  const handleAddSection = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSectionTitle.trim()) {
      // ПРЯМА ПЕРЕДАЧА КОЛЬОРУ ВИРІШУЄ БАГ ІЗ ЗАТРИМКОЮ СТАНУ
      const markerColor = showNextActions ? 'orange' : undefined;
      addInboxCategory(newSectionTitle.trim(), markerColor);
      
      setNewSectionTitle('');
      setIsAddingSection(false);
    }
  };

  const renderTask = (task: Task) => {
    const isEditing = editingTaskId === task.id;
    const project = projects.find(p => p.id === task.projectId);
    const isDone = task.status === TaskStatus.DONE;
    
    return (
      <div 
        key={task.id} 
        draggable 
        onDragStart={(e) => e.dataTransfer.setData('taskId', task.id)}
        onClick={() => setSelectedTaskId(task.id)}
        className={`group flex items-center gap-3 py-2 px-4 hover:bg-black/5 cursor-grab active:cursor-grabbing border-b border-[var(--border-color)]/30 transition-colors ${
          selectedTaskId === task.id ? 'bg-[var(--sidebar-item-active)] border-l-2 border-l-[var(--primary)]' : 'border-l-2 border-l-transparent'
        } ${isDone ? 'opacity-40' : ''}`}
      >
        <button 
          onClick={(e) => { e.stopPropagation(); toggleTaskStatus(task); }} 
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
                value={editingValue} 
                onChange={e => setEditingValue(e.target.value)}
                onBlur={() => {
                  if (editingValue.trim() && editingValue !== task.title) updateTask({ ...task, title: editingValue.trim() });
                  setEditingTaskId(null);
                }}
                onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                className="w-full bg-transparent border-none p-0 text-[13px] font-bold text-[var(--text-main)] focus:ring-0 h-5 outline-none"
                onClick={e => e.stopPropagation()}
              />
            ) : (
              <div 
                onDoubleClick={(e) => { e.stopPropagation(); setEditingTaskId(task.id); setEditingValue(task.title); }}
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
                      <form onSubmit={handleAddSection} className="flex items-center gap-2 animate-in slide-in-from-left-2 h-full m-0 p-0">
                        <input 
                          autoFocus 
                          value={newSectionTitle} 
                          onChange={e => setNewSectionTitle(e.target.value)} 
                          onBlur={() => !newSectionTitle && setIsAddingSection(false)}
                          placeholder="Назва..." 
                          className="bg-[var(--bg-main)] border border-[var(--primary)]/30 rounded-lg px-2 py-0 h-6 text-[10px] font-black uppercase outline-none w-32 flex items-center" 
                        />
                        <button type="submit" className="text-emerald-500 hover:text-emerald-600 h-6 flex items-center justify-center"><i className="fa-solid fa-check text-[10px]"></i></button>
                        <button type="button" onClick={() => setIsAddingSection(false)} className="text-rose-500 hover:text-rose-600 h-6 flex items-center justify-center"><i className="fa-solid fa-xmark text-[10px]"></i></button>
                      </form>
                    ) : (
                      <button 
                        onClick={() => setIsAddingSection(true)}
                        className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--primary)] flex items-center gap-1.5 h-full"
                      >
                        <i className="fa-solid fa-plus-circle"></i>
                        <span>Секція</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
              
              <div className="relative group flex items-center h-full">
                <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-[10px]"></i>
                <input 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Фільтр..." 
                  className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl py-0 pl-9 pr-4 text-[11px] font-bold focus:ring-1 focus:ring-[var(--primary)] outline-none w-48 h-7" 
                />
              </div>
            </div>

            {!showCompleted && (
              <form onSubmit={handleQuickAdd} className="flex gap-2 mb-1">
                <div className="flex-1">
                  <HashtagAutocomplete
                    value={quickTaskTitle}
                    onChange={setQuickTaskTitle}
                    onSelectTag={() => {}}
                    onEnter={handleQuickAdd}
                    placeholder={showNextActions ? "Додати дію..." : "Додати квест... (#теги)"}
                    className="w-full bg-[var(--bg-main)] border border-[var(--primary)]/30 rounded-xl px-4 py-2 text-[11px] font-bold outline-none h-9"
                  />
                </div>
                <Button size="sm" type="submit" disabled={!quickTaskTitle.trim()} className="h-9">Додати</Button>
              </form>
            )}
          </header>

          <div className="flex-1 overflow-y-auto custom-scrollbar pb-32 mt-1">
            {displayCategories.map(section => {
                if (!section) return null;
                let sectionTasks: Task[] = [];
                const isProject = (section as any).isProject;
                
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

                if (sectionTasks.length === 0 && !isAddingTask && !isProject && ['pinned', 'unsorted', 'tasks', 'notes'].includes(section.id)) return null;

                return (
                  <div key={section.id} 
                    onDragOver={(e) => { e.preventDefault(); setDragOverSection(section.id); }} 
                    onDrop={(e) => { 
                      e.preventDefault(); 
                      setDragOverSection(null); 
                      const tid = e.dataTransfer.getData('taskId'); 
                      if(tid) {
                          const taskToMove = tasks.find(x => x.id === tid);
                          if (taskToMove) {
                              if (showNextActions) {
                                  if (isProject) {
                                      updateTask({...taskToMove, projectId: section.id, status: TaskStatus.NEXT_ACTION, category: 'tasks'});
                                  } else {
                                      updateTask({...taskToMove, projectId: undefined, category: section.id, status: TaskStatus.NEXT_ACTION});
                                  }
                              } else {
                                  moveTaskToCategory(tid, section.id, section.isPinned);
                                  if (taskToMove.projectId) updateTask({...taskToMove, projectId: undefined, status: TaskStatus.INBOX, category: section.id});
                              }
                          }
                      }
                    }} 
                    className={`flex flex-col border-b border-[var(--border-color)]/20 ${dragOverSection === section.id ? 'bg-[var(--primary)]/5' : ''}`}
                  >
                    <div className="group flex items-center gap-3 py-2.5 px-6 hover:bg-black/5 cursor-pointer select-none">
                      <div className="flex items-center gap-2.5 flex-1 min-w-0" onClick={() => setCollapsedSections(p => ({...p, [section.id]: !isCollapsed}))}>
                        <i className={`fa-solid fa-chevron-right text-[8px] text-[var(--text-muted)] transition-transform ${!isCollapsed ? 'rotate-90' : ''}`}></i>
                        {isProject && (section as any).projectColor ? (
                            <div className="w-1 h-4 rounded-full" style={{ backgroundColor: (section as any).projectColor }}></div>
                        ) : (
                            <i className={`fa-solid ${section.icon} text-[10px] text-[var(--text-muted)] shrink-0`}></i>
                        )}
                        <Typography variant="tiny" className={`${isProject ? 'text-[var(--text-main)] font-black' : 'text-[var(--text-muted)] font-black'} uppercase tracking-widest text-[9px] truncate flex-1`}>
                            {section.title}
                        </Typography>
                        {!showCompleted && (
                           <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100">
                             <button 
                               onClick={(e) => { e.stopPropagation(); setAddingTaskToSectionId(section.id); }}
                               className="w-5 h-5 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center hover:scale-110 shadow-sm"
                             >
                               <i className="fa-solid fa-plus text-[9px]"></i>
                             </button>
                             {!isProject && !['pinned', 'unsorted', 'tasks', 'notes'].includes(section.id) && (
                               <button onClick={(e) => { e.stopPropagation(); if(confirm('Видалити секцію?')) deleteInboxCategory(section.id); }} className="w-5 h-5 rounded-lg hover:bg-rose-50 text-rose-500 flex items-center justify-center">
                                 <i className="fa-solid fa-trash text-[9px]"></i>
                               </button>
                             )}
                           </div>
                        )}
                      </div>
                      <span className="text-[9px] font-black text-[var(--text-muted)] opacity-30">{sectionTasks.length}</span>
                    </div>

                    {isAddingTask && (
                      <div className="px-6 py-2 bg-black/5">
                        <HashtagAutocomplete
                          autoFocus
                          value={sectionTaskTitle}
                          onChange={setSectionTaskTitle}
                          onSelectTag={() => {}}
                          onBlur={() => { if(!sectionTaskTitle.trim()) setAddingTaskToSectionId(null); }}
                          onEnter={() => handleAddToSection(section.id, !!isProject)}
                          placeholder="Швидка дія..."
                          className="w-full bg-[var(--bg-main)] border border-[var(--primary)]/30 rounded-xl px-4 py-2 text-[11px] font-bold outline-none h-10"
                        />
                      </div>
                    )}

                    {!isCollapsed && (
                      <div className="flex flex-col">
                        {sectionTasks.map(renderTask)}
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
    </div>
  );
};

export default Inbox;
