
import React, { useState, useMemo, useEffect } from 'react';
import { Task, TaskStatus, Project, Priority } from '../types';
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

  // Об'єднуємо системні категорії та проекти для відображення
  const displayCategories = useMemo(() => {
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
      // Додаємо також звичайні вхідні категорії, щоб бачити NEXT_ACTION без проекту
      return [...inboxCategories, ...projectSections];
    }
    return inboxCategories;
  }, [showNextActions, inboxCategories, projects]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      if (t.isDeleted || t.projectSection === 'habits') return false;
      
      if (showNextActions) {
        // У наступних діях ми показуємо:
        // 1. Все зі статусом NEXT_ACTION
        // 2. Все що не DONE і має проект (як підказку GTD)
        return t.status === TaskStatus.NEXT_ACTION || (t.status !== TaskStatus.DONE && !!t.projectId);
      }
      
      if (showCompleted) return t.status === TaskStatus.DONE;
      
      // Вхідні: тільки статус INBOX і без прив'язки до дати/проекту
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
    
    // В обох режимах додаємо в 'unsorted' за замовчуванням
    if (showNextActions) {
        // Якщо додаємо в "Наступні дії", одразу ставимо статус NEXT_ACTION
        const tid = addTask(quickTaskTitle.trim(), 'unsorted');
        const t = tasks.find(x => x.id === tid);
        if (t) updateTask({...t, status: TaskStatus.NEXT_ACTION});
    } else {
        addTask(quickTaskTitle.trim(), 'unsorted');
    }
    setQuickTaskTitle('');
  };

  const handleAddToSection = (sectionId: string, isProject: boolean) => {
    if (!sectionTaskTitle.trim()) return;
    if (showNextActions) {
        if (isProject) {
            // Додаємо в проект зі статусом NEXT_ACTION
            const tid = addTask(sectionTaskTitle.trim(), 'tasks', sectionId, 'actions');
            const task = tasks.find(t => t.id === tid);
            if (task) updateTask({...task, status: TaskStatus.NEXT_ACTION, projectId: sectionId});
        } else {
            // Додаємо в категорію вхідних зі статусом NEXT_ACTION
            const tid = addTask(sectionTaskTitle.trim(), sectionId);
            const task = tasks.find(t => t.id === tid);
            if (task) updateTask({...task, status: TaskStatus.NEXT_ACTION, category: sectionId});
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
      addInboxCategory(newSectionTitle.trim());
      setNewSectionTitle('');
      setIsAddingSection(false);
    }
  };

  const renderTask = (task: Task) => {
    const isEditing = editingTaskId === task.id;
    const project = projects.find(p => p.id === task.projectId);
    const isDoing = task.status === TaskStatus.DOING;
    
    return (
      <div 
        key={task.id} 
        draggable 
        onDragStart={(e) => e.dataTransfer.setData('taskId', task.id)}
        onClick={() => setSelectedTaskId(task.id)}
        className={`group flex items-center gap-3 py-2 px-4 hover:bg-black/5 cursor-grab active:cursor-grabbing border-b border-[var(--border-color)]/30 transition-colors ${
          selectedTaskId === task.id ? 'bg-[var(--sidebar-item-active)] border-l-2 border-l-[var(--primary)]' : 'border-l-2 border-l-transparent'
        } ${isDoing ? 'opacity-50 grayscale' : ''}`}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button 
            onClick={(e) => { e.stopPropagation(); toggleTaskStatus(task); }} 
            className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-all ${
              task.status === TaskStatus.DONE ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 bg-white text-transparent hover:border-orange-400'
            }`}
          >
            {task.status === TaskStatus.DONE && <i className="fa-solid fa-check text-[8px]"></i>}
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
                    task.status === TaskStatus.DONE ? 'opacity-30 line-through' : 'text-[var(--text-main)]'
                  }`}
                >
                  {task.title}
                </div>
              )}
              <div className="flex items-center gap-2 mt-1">
                {project && <span className="text-[7px] font-black uppercase text-orange-400 opacity-70 px-1 bg-orange-50 rounded"># {project.name}</span>}
              </div>
            </div>
            <div className="flex gap-1 shrink-0">
               {task.tags.slice(0, 2).map(tagName => (
                  <span key={tagName} className="text-[9px] font-bold text-[var(--text-muted)] opacity-50">#{tagName}</span>
               ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen flex overflow-hidden relative bg-[var(--bg-main)]">
        <div className="flex-1 flex flex-col min-w-0 h-full">
          <header className="px-5 py-4 border-b border-[var(--border-color)] flex flex-col gap-4 sticky top-0 bg-[var(--bg-card)] z-20 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Typography variant="h1" className="text-sm text-[var(--text-main)] tracking-tight font-black uppercase flex items-center gap-2">
                  <i className={`fa-solid ${showNextActions ? 'fa-bolt-lightning' : showCompleted ? 'fa-archive' : 'fa-inbox'} text-[var(--primary)]`}></i>
                  {showNextActions ? 'Двигун Виконання' : showCompleted ? 'Архів' : 'Вхідні'}
                </Typography>
                <Badge variant="orange" className="px-2 py-0.5 rounded text-[9px] bg-[var(--primary)]/10 text-[var(--primary)]">{displayedTasks.length}</Badge>
                
                {!showCompleted && (
                  <button 
                    onClick={() => setIsAddingSection(true)}
                    className="text-[8px] font-black uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--primary)] flex items-center gap-1 border-l border-[var(--border-color)] pl-3 h-3"
                  >
                    <i className="fa-solid fa-plus-circle"></i>
                    <span>Секція</span>
                  </button>
                )}
              </div>
              
              <div className="relative group">
                <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-[10px]"></i>
                <input 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Фільтр..." 
                  className="bg-[var(--bg-main)] border-none rounded-xl py-1.5 pl-9 pr-3 text-[10px] font-bold focus:ring-1 focus:ring-[var(--primary)] outline-none w-40 h-8 flex items-center" 
                />
              </div>
            </div>

            {isAddingSection && (
               <form onSubmit={handleAddSection} className="flex gap-2 animate-in slide-in-from-top-2">
                  <input autoFocus value={newSectionTitle} onChange={e => setNewSectionTitle(e.target.value)} placeholder="Назва нової секції..." className="flex-1 bg-[var(--bg-main)] border border-[var(--primary)]/30 rounded-lg px-3 py-1.5 text-[10px] font-bold outline-none" />
                  <Button size="sm" type="submit">Створити</Button>
                  <Button size="sm" variant="ghost" onClick={() => setIsAddingSection(false)}>Скасувати</Button>
               </form>
            )}

            {!showCompleted && (
              <form onSubmit={handleQuickAdd} className="relative group/input flex items-center">
                <div className="absolute left-4 text-[var(--text-muted)] group-focus-within/input:text-[var(--primary)] z-10 flex items-center h-full">
                  <i className="fa-solid fa-circle-plus text-xs"></i>
                </div>
                <HashtagAutocomplete
                  value={quickTaskTitle}
                  onChange={setQuickTaskTitle}
                  onSelectTag={() => {}}
                  onEnter={handleQuickAdd}
                  placeholder={showNextActions ? "Додати наступну дію в Несортовані..." : "Додати квест... (#теги)"}
                  className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl py-3 pl-10 pr-12 text-[13px] font-bold text-[var(--text-main)] focus:bg-[var(--bg-card)] outline-none h-10 flex items-center leading-none shadow-inner"
                />
                <button type="submit" disabled={!quickTaskTitle.trim()} className="absolute right-1.5 w-7 h-7 bg-[var(--primary)] text-white rounded-lg flex items-center justify-center disabled:opacity-0 shadow-md transition-all active:scale-90">
                  <i className="fa-solid fa-arrow-up text-xs"></i>
                </button>
              </form>
            )}
          </header>

          <div className="flex-1 overflow-y-auto custom-scrollbar pb-32 bg-slate-50/30">
            {displayCategories.map(section => {
                let sectionTasks: Task[] = [];
                const isProject = (section as any).isProject;
                
                if (showNextActions && isProject) {
                   const goalId = section.id;
                   const goalSubProjects = projects.filter(p => p.parentFolderId === goalId && p.status === 'active');
                   
                   const directTasks = displayedTasks.filter(t => t.projectId === goalId && t.status !== TaskStatus.DONE);
                   const subProjectNextActions = goalSubProjects.map(sp => {
                      const spTasks = displayedTasks.filter(t => t.projectId === sp.id && t.status !== TaskStatus.DONE).sort((a,b) => a.createdAt - b.createdAt);
                      return spTasks.length > 0 ? [spTasks[0]] : [];
                   }).flat();
                   
                   sectionTasks = [...directTasks, ...subProjectNextActions];
                } else {
                   // Звичайні категорії або вхідні у режимі наступних дій
                   sectionTasks = displayedTasks.filter(t => {
                     const inCat = (section.isPinned && t.isPinned) || (!section.isPinned && t.category === section.id && !t.isPinned);
                     // Якщо режим наступних дій, то категорія має містити тільки те, що без проекту (щоб не дублювати)
                     if (showNextActions) return inCat && !t.projectId;
                     return inCat;
                   });
                }
                
                const isCollapsed = collapsedSections[section.id];
                const isAddingTask = addingTaskToSectionId === section.id;

                if (sectionTasks.length === 0 && !isAddingTask && !isProject) return null;

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
                    <div className="group flex items-center gap-3 py-2 px-4 hover:bg-black/5 cursor-pointer select-none">
                      <div className="flex items-center gap-2 flex-1 min-w-0" onClick={() => setCollapsedSections(p => ({...p, [section.id]: !isCollapsed}))}>
                        <i className={`fa-solid fa-chevron-right text-[7px] text-[var(--text-muted)] transition-transform ${!isCollapsed ? 'rotate-90' : ''}`}></i>
                        {isProject && (section as any).projectColor ? (
                            <div className="w-1.5 h-4 rounded-full" style={{ backgroundColor: (section as any).projectColor }}></div>
                        ) : (
                            <i className={`fa-solid ${section.icon} text-[10px] text-[var(--text-muted)] shrink-0`}></i>
                        )}
                        
                        <Typography variant="tiny" className={`${isProject ? 'text-[var(--text-main)] font-black' : 'text-[var(--text-muted)] font-black'} uppercase tracking-widest text-[8px] truncate flex-1`}>
                            {section.title}
                        </Typography>
                        
                        {!showCompleted && (
                           <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100">
                             <button 
                               onClick={(e) => { e.stopPropagation(); setAddingTaskToSectionId(section.id); }}
                               className="w-5 h-5 rounded-md bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center hover:scale-110 shadow-sm"
                             >
                               <i className="fa-solid fa-plus text-[8px]"></i>
                             </button>
                             {!isProject && !['pinned', 'unsorted', 'tasks', 'notes'].includes(section.id) && (
                               <button onClick={(e) => { e.stopPropagation(); if(confirm('Видалити?')) deleteInboxCategory(section.id); }} className="w-5 h-5 rounded-md hover:bg-rose-50 text-rose-500 flex items-center justify-center">
                                 <i className="fa-solid fa-trash text-[8px]"></i>
                               </button>
                             )}
                           </div>
                        )}
                      </div>
                      <span className="text-[8px] font-black text-[var(--text-muted)] opacity-30">{sectionTasks.length}</span>
                    </div>

                    {isAddingTask && (
                      <div className="px-10 py-2 bg-black/5">
                        <input 
                          autoFocus
                          value={sectionTaskTitle}
                          onChange={e => setSectionTaskTitle(e.target.value)}
                          onBlur={() => { if(!sectionTaskTitle.trim()) setAddingTaskToSectionId(null); }}
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleAddToSection(section.id, !!isProject);
                            if (e.key === 'Escape') setAddingTaskToSectionId(null);
                          }}
                          placeholder="Швидка дія..."
                          className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg px-3 text-[11px] font-bold focus:ring-1 focus:ring-[var(--primary)] outline-none h-8 flex items-center shadow-inner"
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
          <div onMouseDown={startResizing} className={`w-[1px] h-full cursor-col-resize hover:bg-[var(--primary)]/50 z-[100] ${isResizing ? 'bg-[var(--primary)]' : 'bg-[var(--border-color)]/50'}`}></div>
          <div style={{ width: detailsWidth }} className="h-full bg-[var(--bg-card)] relative overflow-hidden flex flex-col">
            {selectedTaskId ? (
              <TaskDetails task={tasks.find(t => t.id === selectedTaskId)!} onClose={() => setSelectedTaskId(null)} />
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center opacity-5 grayscale pointer-events-none">
                <i className="fa-solid fa-bolt-lightning text-6xl mb-6"></i>
                <Typography variant="tiny" className="text-[10px] font-black uppercase tracking-[0.2em]">Фокус на дії</Typography>
              </div>
            )}
          </div>
        </div>
    </div>
  );
};

export default Inbox;
