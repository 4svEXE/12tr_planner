
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Task, TaskStatus, InboxCategory, Priority } from '../types';
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
    updateInboxCategory, deleteInboxCategory, tags, setActiveTab 
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
  const [editingSectionValue, setEditingSectionValue] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  
  const [addingTaskToSectionId, setAddingTaskToSectionId] = useState<string | null>(null);
  const [sectionTaskTitle, setSectionTaskTitle] = useState('');

  useEffect(() => {
    const initialState: Record<string, boolean> = { ...collapsedSections };
    inboxCategories.forEach(section => {
      const sectionTasksCount = tasks.filter(t => 
        !t.isDeleted && 
        ((section.isPinned && t.isPinned) || (!section.isPinned && t.category === section.id && !t.isPinned))
      ).length;
      
      if (collapsedSections[section.id] === undefined && sectionTasksCount === 0 && ['pinned', 'notes'].includes(section.id)) {
        initialState[section.id] = true;
      }
    });
    setCollapsedSections(initialState);
  }, [inboxCategories]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      if (t.isDeleted || t.projectSection === 'habits') return false;
      if (showNextActions) return t.status === TaskStatus.NEXT_ACTION;
      if (showCompleted) return t.status === TaskStatus.DONE;
      return t.status === TaskStatus.INBOX && !t.scheduledDate;
    });
  }, [tasks, showCompleted, showNextActions]);

  const displayedTasks = useMemo(() => {
    if (!searchQuery) return filteredTasks;
    const lowerQuery = searchQuery.toLowerCase();
    return filteredTasks.filter(t => 
      t.title.toLowerCase().includes(lowerQuery) || 
      t.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }, [filteredTasks, searchQuery]);

  const handleQuickAdd = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!quickTaskTitle.trim()) return;
    addTask(quickTaskTitle.trim(), 'unsorted');
    setQuickTaskTitle('');
  };

  const handleAddToSection = (sectionId: string) => {
    if (!sectionTaskTitle.trim()) return;
    addTask(sectionTaskTitle.trim(), sectionId);
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

  const getSectionBg = (color?: string) => {
    switch (color) {
      case 'orange': return 'bg-orange-400/5';
      case 'emerald': return 'bg-emerald-400/5';
      case 'indigo': return 'bg-indigo-400/5';
      case 'rose': return 'bg-rose-400/5';
      case 'amber': return 'bg-amber-400/5';
      case 'violet': return 'bg-violet-400/5';
      case 'slate': return 'bg-slate-400/5';
      default: return 'bg-transparent';
    }
  };

  const renderTask = (task: Task) => {
    const isEditing = editingTaskId === task.id;
    const project = projects.find(p => p.id === task.projectId);
    
    // Форматування дати: приховуємо час, якщо він 00:00
    const getFormattedDate = (ts: number) => {
      const d = new Date(ts);
      const hasTime = d.getHours() !== 0 || d.getMinutes() !== 0;
      const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
      if (hasTime) {
        options.hour = '2-digit';
        options.minute = '2-digit';
      }
      return d.toLocaleString('uk-UA', options);
    };

    const dateFormatted = task.scheduledDate ? getFormattedDate(task.scheduledDate) : null;

    return (
      <div 
        key={task.id} 
        draggable 
        onDragStart={(e) => e.dataTransfer.setData('taskId', task.id)}
        onClick={() => setSelectedTaskId(task.id)}
        className={`group flex items-center gap-2 py-1.5 px-4 hover:bg-black/5 cursor-grab active:cursor-grabbing border-b border-[var(--border-color)]/30 ${
          selectedTaskId === task.id ? 'bg-[var(--sidebar-item-active)] border-l-2 border-l-[var(--primary)]' : 'border-l-2 border-l-transparent'
        }`}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <button 
            onClick={(e) => { e.stopPropagation(); toggleTaskStatus(task); }} 
            className={`w-[14px] h-[14px] rounded-sm border flex items-center justify-center shrink-0 ${
              task.status === TaskStatus.DONE ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-[var(--border-color)] bg-[var(--bg-card)] text-transparent hover:border-[var(--primary)]'
            }`}
          >
            <i className="fa-solid fa-check text-[7px]"></i>
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
                  className="w-full bg-transparent border-none p-0 text-[11px] font-bold text-[var(--text-main)] focus:ring-0 h-4 flex items-center outline-none"
                  onClick={e => e.stopPropagation()}
                />
              ) : (
                <div 
                  onDoubleClick={(e) => { e.stopPropagation(); setEditingTaskId(task.id); setEditingValue(task.title); }}
                  className={`text-[11px] font-bold truncate block leading-tight ${
                    task.status === TaskStatus.DONE ? 'opacity-30 line-through' : 'text-[var(--text-main)]'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {task.isEvent && <i className="fa-solid fa-calendar text-[8px] text-pink-400"></i>}
                    {task.title}
                  </span>
                  {dateFormatted && <span className="ml-2 px-1.5 py-0.5 bg-[var(--bg-main)] text-[var(--primary)] text-[7px] rounded-md font-black uppercase tracking-tighter border border-[var(--border-color)]"><i className="fa-solid fa-calendar-check mr-1 opacity-50"></i>{dateFormatted}</span>}
                </div>
              )}
              {project && <span className="text-[7px] font-black uppercase text-[var(--text-muted)] flex items-center gap-0.5 shrink-0 mt-0.5"><i className="fa-solid fa-folder text-[6px]"></i> {project.name}</span>}
            </div>

            <div className="flex gap-1 shrink-0 overflow-hidden">
               {task.tags.slice(0, 3).map(tagName => {
                 const tagObj = tags.find(t => t.name === tagName);
                 return (
                  <button 
                    key={tagName} 
                    onClick={(e) => { e.stopPropagation(); setActiveTab('hashtags'); }}
                    className="text-[11px] font-bold lowercase px-2.5 py-0.5 rounded-full border-none whitespace-nowrap hover:brightness-95 transition-all"
                    style={tagObj ? { backgroundColor: `${tagObj.color}40`, color: tagObj.color } : { backgroundColor: 'var(--border-color)', color: 'var(--text-muted)' }}
                  >
                    #{tagName}
                  </button>
                 );
               })}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 shrink-0">
          <button onClick={(e) => { e.stopPropagation(); toggleTaskPin(task.id); }} className={`w-4 h-4 rounded flex items-center justify-center ${task.isPinned ? 'text-[var(--primary)]' : 'text-[var(--text-muted)] hover:text-[var(--primary)]'}`}><i className="fa-solid fa-thumbtack text-[8px]"></i></button>
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen flex overflow-hidden relative bg-[var(--bg-main)]">
        <div className="flex-1 flex flex-col min-w-0 h-full">
          <header className="px-5 py-3 border-b border-[var(--border-color)] flex flex-col gap-3 sticky top-0 bg-[var(--bg-card)] z-20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Typography variant="h1" className="text-sm text-[var(--text-main)] tracking-tight font-black uppercase flex items-center gap-2">
                  <i className={`fa-solid ${showNextActions ? 'fa-bolt' : showCompleted ? 'fa-archive' : 'fa-inbox'} text-[var(--primary)]`}></i>
                  {showNextActions ? 'Наступні дії' : showCompleted ? 'Архів' : 'Вхідні'}
                </Typography>
                <Badge variant="orange" className="px-1.5 py-0.5 rounded text-[8px] bg-[var(--primary)]/10 text-[var(--primary)]">{displayedTasks.length}</Badge>
                
                {!showCompleted && !showNextActions && (
                  <div className="flex items-center gap-1 ml-3 border-l border-[var(--border-color)] pl-3 h-4">
                    {isAddingSection ? (
                      <form onSubmit={handleAddSection} className="flex gap-1 items-center">
                        <input 
                          autoFocus
                          value={newSectionTitle}
                          onChange={e => setNewSectionTitle(e.target.value)}
                          onBlur={() => !newSectionTitle && setIsAddingSection(false)}
                          placeholder="Секція..."
                          className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded px-2 py-0 text-[8px] font-bold outline-none w-24 h-5 focus:ring-1 focus:ring-[var(--primary)]"
                        />
                      </form>
                    ) : (
                      <button 
                        onClick={() => setIsAddingSection(true)}
                        className="text-[8px] font-black uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--primary)] flex items-center gap-1"
                        title="Додати секцію"
                      >
                        <i className="fa-solid fa-plus-circle text-[10px]"></i>
                        <span>Секція</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                 <div className="relative group">
                   <i className="fa-solid fa-magnifying-glass absolute left-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-[8px]"></i>
                   <input 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Пошук..." 
                    className="bg-[var(--bg-main)] border-none rounded-lg py-1 pl-6 pr-2 text-[8px] font-bold focus:ring-1 focus:ring-[var(--primary)] outline-none w-32 h-6 flex items-center" 
                   />
                 </div>
              </div>
            </div>

            {!showCompleted && !showNextActions && (
              <div className="w-full">
                <form onSubmit={handleQuickAdd} className="relative group/input flex items-center">
                  <div className="absolute left-3 text-[var(--text-muted)] group-focus-within/input:text-[var(--primary)] z-10 flex items-center h-full">
                    <i className="fa-solid fa-circle-plus text-xs"></i>
                  </div>
                  <HashtagAutocomplete
                    value={quickTaskTitle}
                    onChange={setQuickTaskTitle}
                    onSelectTag={() => {}}
                    onEnter={handleQuickAdd}
                    placeholder="Додати квест... (#теги)"
                    className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg py-2 pl-9 pr-10 text-[11px] font-bold text-[var(--text-main)] focus:bg-[var(--bg-card)] focus:ring-2 focus:ring-[var(--primary)]/10 outline-none shadow-sm h-8 flex items-center leading-none transition-none"
                  />
                  <div className="absolute right-1 flex items-center gap-2 h-full">
                    <button type="submit" disabled={!quickTaskTitle.trim()} className="w-6 h-6 bg-[var(--primary)] text-white rounded flex items-center justify-center disabled:opacity-0 transition-none shadow-sm">
                      <i className="fa-solid fa-arrow-up text-[9px]"></i>
                    </button>
                  </div>
                </form>
              </div>
            )}
          </header>

          <div className="flex-1 overflow-y-auto custom-scrollbar pb-20">
            {inboxCategories.map(section => {
                const sectionTasks = displayedTasks.filter(t => 
                  (section.isPinned && t.isPinned) || 
                  (!section.isPinned && t.category === section.id && !t.isPinned)
                );
                
                const isCollapsed = collapsedSections[section.id];
                const isEditing = editingSectionId === section.id;
                const isAddingTask = addingTaskToSectionId === section.id;
                const isMenuOpen = openMenuId === section.id;

                const isSystem = ['pinned', 'unsorted', 'tasks', 'notes'].includes(section.id);
                if (isSystem && sectionTasks.length === 0 && !isAddingTask) return null;

                return (
                  <div key={section.id} 
                    onDragOver={(e) => { e.preventDefault(); setDragOverSection(section.id); }} 
                    onDrop={(e) => { 
                      e.preventDefault(); 
                      setDragOverSection(null); 
                      const tid = e.dataTransfer.getData('taskId'); 
                      if(tid) moveTaskToCategory(tid, section.id, section.isPinned); 
                    }} 
                    className={`flex flex-col border-b border-[var(--border-color)]/20 ${getSectionBg(section.color)} ${dragOverSection === section.id ? 'bg-[var(--primary)]/5' : ''}`}
                  >
                    <div className="group flex items-center gap-2 py-1 px-4 hover:bg-black/5 cursor-pointer select-none">
                      <div className="flex items-center gap-1.5 flex-1 min-w-0" onClick={() => setCollapsedSections(p => ({...p, [section.id]: !isCollapsed}))}>
                        <i className={`fa-solid fa-chevron-right text-[6px] text-[var(--text-muted)] ${!isCollapsed ? 'rotate-90' : ''}`}></i>
                        <i className={`fa-solid ${section.icon} text-[9px] text-[var(--text-muted)] shrink-0`}></i>
                        
                        {isEditing ? (
                          <input 
                            autoFocus
                            value={editingSectionValue}
                            onChange={e => setEditingSectionValue(e.target.value)}
                            onBlur={() => {
                              if (editingSectionValue.trim()) updateInboxCategory(section.id, { title: editingSectionValue.trim() });
                              setEditingSectionId(null);
                            }}
                            onKeyDown={e => e.key === 'Enter' && e.currentTarget.blur()}
                            onClick={e => e.stopPropagation()}
                            className="bg-transparent border-none p-0 text-[8px] font-black uppercase tracking-widest text-[var(--primary)] focus:ring-0 w-full h-4 flex items-center"
                          />
                        ) : (
                          <div className="flex items-center gap-2 flex-1">
                             <Typography variant="tiny" className="text-[var(--text-muted)] font-black uppercase tracking-widest text-[7px] truncate">{section.title}</Typography>
                             
                             {!showCompleted && !showNextActions && (
                               <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                                 <button 
                                   onClick={(e) => { e.stopPropagation(); setAddingTaskToSectionId(section.id); }}
                                   className="w-4 h-4 rounded-sm bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center hover:scale-110"
                                   title="Додати сюди"
                                 >
                                   <i className="fa-solid fa-plus text-[7px]"></i>
                                 </button>
                                 <button 
                                   onClick={(e) => { e.stopPropagation(); setOpenMenuId(isMenuOpen ? null : section.id); }}
                                   className={`w-4 h-4 rounded flex items-center justify-center ${isMenuOpen ? 'bg-[var(--text-main)] text-[var(--bg-card)]' : 'text-[var(--text-muted)] hover:bg-black/5'}`}
                                 >
                                   <i className="fa-solid fa-ellipsis text-[8px]"></i>
                                 </button>

                                 {isMenuOpen && (
                                   <div className="absolute top-6 left-0 w-32 bg-[var(--bg-card)] rounded-lg shadow-xl border border-[var(--border-color)] p-1 z-[100] tiktok-blur">
                                     <button onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); setEditingSectionId(section.id); setEditingSectionValue(section.title); }} className="w-full text-left px-2 py-1 hover:bg-black/5 rounded text-[7px] font-black uppercase text-[var(--text-main)] flex items-center gap-2">
                                       <i className="fa-solid fa-pen text-[7px]"></i> Редагувати
                                     </button>
                                     <div className="p-1 border-t border-[var(--border-color)]">
                                       <div className="text-[6px] font-black text-[var(--text-muted)] uppercase mb-1">Фон</div>
                                       <div className="grid grid-cols-4 gap-1">
                                          {(['slate', 'orange', 'emerald', 'indigo', 'rose', 'amber', 'violet'] as const).map(c => (
                                            <button key={c} onClick={(e) => { e.stopPropagation(); updateInboxCategory(section.id, { color: c }); setOpenMenuId(null); }} className={`w-3 h-3 rounded-sm bg-${c}-400 hover:scale-110 ${section.color === c ? 'ring-1 ring-black' : ''}`} />
                                          ))}
                                          <button onClick={(e) => { e.stopPropagation(); updateInboxCategory(section.id, { color: undefined }); setOpenMenuId(null); }} className="w-3 h-3 rounded-sm bg-[var(--bg-card)] border border-[var(--border-color)] hover:scale-110" />
                                       </div>
                                     </div>
                                     {!isSystem && (
                                       <button onClick={(e) => { e.stopPropagation(); if(confirm('Видалити секцію?')) deleteInboxCategory(section.id); setOpenMenuId(null); }} className="w-full text-left px-2 py-1 hover:bg-rose-500/10 rounded text-[7px] font-black uppercase text-rose-500 flex items-center gap-2 border-t border-[var(--border-color)]">
                                         <i className="fa-solid fa-trash text-[7px]"></i> Видалити
                                       </button>
                                     )}
                                   </div>
                                 )}
                               </div>
                             )}
                          </div>
                        )}
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        <span className="text-[7px] font-black text-[var(--text-muted)] min-w-[12px] text-center opacity-40">{sectionTasks.length}</span>
                      </div>
                    </div>

                    {isAddingTask && (
                      <div className="px-8 py-1.5 bg-black/5">
                        <input 
                          autoFocus
                          value={sectionTaskTitle}
                          onChange={e => setSectionTaskTitle(e.target.value)}
                          onBlur={() => { if(!sectionTaskTitle.trim()) setAddingTaskToSectionId(null); }}
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleAddToSection(section.id);
                            if (e.key === 'Escape') setAddingTaskToSectionId(null);
                          }}
                          placeholder="Додати сюди..."
                          className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded px-2 py-0 text-[10px] font-bold focus:ring-1 focus:ring-[var(--primary)] outline-none h-6 flex items-center leading-none"
                        />
                      </div>
                    )}

                    {!isCollapsed && (
                      <div className="flex flex-col">
                        {sectionTasks.map(renderTask)}
                        {sectionTasks.length === 0 && !isAddingTask && (
                          <div className="py-2 text-center opacity-5">
                             <span className="text-[6px] font-black uppercase tracking-widest italic">Порожньо</span>
                          </div>
                        )}
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
                <i className="fa-solid fa-compass-drafting text-4xl mb-4"></i>
                <Typography variant="tiny" className="text-[9px] font-black uppercase tracking-[0.2em]">Деталі Квесту</Typography>
                <Typography variant="tiny" className="mt-2 text-[8px] font-black uppercase">Оберіть запис</Typography>
              </div>
            )}
          </div>
        </div>
    </div>
  );
};

export default Inbox;
