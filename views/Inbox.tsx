
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
    updateInboxCategory, deleteInboxCategory 
  } = useApp();
  
  const { isResizing, startResizing, detailsWidth } = useResizer();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [dragOverSection, setDragOverSection] = useState<string | null>(null);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [quickTaskTitle, setQuickTaskTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  
  // Section management
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editingSectionValue, setEditingSectionValue] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  
  // Section quick-add task
  const [addingTaskToSectionId, setAddingTaskToSectionId] = useState<string | null>(null);
  const [sectionTaskTitle, setSectionTaskTitle] = useState('');

  // Auto-collapse logic
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
      return showCompleted ? TaskStatus.DONE : t.status !== TaskStatus.DONE;
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
      case 'orange': return 'bg-orange-50/40';
      case 'emerald': return 'bg-emerald-50/40';
      case 'indigo': return 'bg-indigo-50/40';
      case 'rose': return 'bg-rose-50/40';
      case 'amber': return 'bg-amber-50/40';
      case 'violet': return 'bg-violet-50/40';
      case 'slate': return 'bg-slate-50/60';
      default: return 'bg-white';
    }
  };

  const renderTask = (task: Task) => {
    const isEditing = editingTaskId === task.id;
    const project = projects.find(p => p.id === task.projectId);

    return (
      <div 
        key={task.id} 
        draggable 
        onDragStart={(e) => e.dataTransfer.setData('taskId', task.id)}
        onClick={() => setSelectedTaskId(task.id)}
        className={`group flex items-center gap-2 py-1.5 px-4 hover:bg-white/60 cursor-grab active:cursor-grabbing border-b border-slate-100/30 ${
          selectedTaskId === task.id ? 'bg-orange-100/30 border-l-2 border-l-orange-500' : 'border-l-2 border-l-transparent'
        }`}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <button 
            onClick={(e) => { e.stopPropagation(); toggleTaskStatus(task); }} 
            className={`w-[14px] h-[14px] rounded-sm border flex items-center justify-center shrink-0 ${
              task.status === TaskStatus.DONE ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200 bg-white text-transparent hover:border-orange-400'
            }`}
          >
            <i className="fa-solid fa-check text-[7px]"></i>
          </button>
          
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
                className="w-full bg-white border-none p-0 text-[13px] font-bold text-slate-900 focus:ring-0 h-4 flex items-center"
                onClick={e => e.stopPropagation()}
              />
            ) : (
              <div 
                onDoubleClick={(e) => { e.stopPropagation(); setEditingTaskId(task.id); setEditingValue(task.title); }}
                className={`text-[13px] font-bold truncate block leading-tight ${
                  task.status === TaskStatus.DONE ? 'text-slate-300 line-through' : 'text-slate-700'
                }`}
              >
                {task.title}
              </div>
            )}
            <div className="flex items-center gap-1 mt-0.5">
               {project && <span className="text-[7.5px] font-black uppercase text-slate-300 flex items-center gap-0.5 shrink-0"><i className="fa-solid fa-folder text-[6px]"></i> {project.name}</span>}
               {task.tags.map(tag => (
                 <Badge key={tag} variant="slate" className="text-[6.5px] bg-slate-100/50 border-none lowercase px-1 py-0 leading-none">#{tag}</Badge>
               ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 shrink-0">
          <button onClick={(e) => { e.stopPropagation(); toggleTaskPin(task.id); }} className={`w-4 h-4 rounded flex items-center justify-center ${task.isPinned ? 'text-orange-500' : 'text-slate-300 hover:text-orange-400'}`}><i className="fa-solid fa-thumbtack text-[8px]"></i></button>
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen flex bg-white overflow-hidden relative">
        <div className="flex-1 flex flex-col min-w-0 h-full">
          <header className="px-5 py-3 border-b border-slate-100 flex flex-col gap-3 sticky top-0 bg-white z-20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Typography variant="h1" className="text-base text-slate-900 tracking-tight font-black uppercase flex items-center gap-2">
                  <i className={`fa-solid ${showNextActions ? 'fa-bolt' : showCompleted ? 'fa-archive' : 'fa-inbox'} text-orange-500`}></i>
                  {showNextActions ? 'Дії' : showCompleted ? 'Архів' : 'Вхідні'}
                </Typography>
                <Badge variant="orange" className="px-1.5 py-0.5 rounded text-[8px] bg-orange-50/50">{displayedTasks.length}</Badge>
                
                {!showCompleted && !showNextActions && (
                  <div className="flex items-center gap-1 ml-3 border-l border-slate-100 pl-3 h-4">
                    {isAddingSection ? (
                      <form onSubmit={handleAddSection} className="flex gap-1 items-center">
                        <input 
                          autoFocus
                          value={newSectionTitle}
                          onChange={e => setNewSectionTitle(e.target.value)}
                          onBlur={() => !newSectionTitle && setIsAddingSection(false)}
                          placeholder="Секція..."
                          className="bg-slate-50 border border-slate-200 rounded px-2 py-0 text-[9px] font-bold outline-none w-32 h-6 focus:ring-1 focus:ring-orange-200"
                        />
                      </form>
                    ) : (
                      <button 
                        onClick={() => setIsAddingSection(true)}
                        className="text-[9px] font-black uppercase tracking-widest text-slate-300 hover:text-orange-500 flex items-center gap-1 transition-all"
                        title="Додати секцію"
                      >
                        <i className="fa-solid fa-plus-circle text-[11px]"></i>
                        <span>Секція</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                 <div className="relative group">
                   <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 text-[8px]"></i>
                   <input 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Пошук..." 
                    className="bg-slate-50 border-none rounded-lg py-1 pl-7 pr-3 text-[9px] font-bold focus:ring-1 focus:ring-orange-100 outline-none w-40 h-7 flex items-center" 
                   />
                 </div>
              </div>
            </div>

            {!showCompleted && !showNextActions && (
              <div className="w-full max-w-2xl">
                <form onSubmit={handleQuickAdd} className="relative group/input flex items-center">
                  <div className="absolute left-3 text-slate-400 group-focus-within/input:text-orange-500 transition-colors z-10 flex items-center h-full">
                    <i className="fa-solid fa-circle-plus text-xs"></i>
                  </div>
                  <HashtagAutocomplete
                    value={quickTaskTitle}
                    onChange={setQuickTaskTitle}
                    onSelectTag={() => {}}
                    onEnter={handleQuickAdd}
                    placeholder="Додати квест... (#теги)"
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-xl py-2 pl-9 pr-12 text-[12px] font-bold text-slate-800 focus:bg-white focus:ring-4 focus:ring-orange-100 focus:border-orange-200 outline-none shadow-sm transition-all h-9 flex items-center leading-none"
                  />
                  <div className="absolute right-2 flex items-center gap-2 h-full">
                    <button type="submit" disabled={!quickTaskTitle.trim()} className="w-6 h-6 bg-slate-900 text-white rounded-lg flex items-center justify-center disabled:opacity-0 transition-all hover:scale-105 shadow-sm">
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
                    className={`flex flex-col border-b border-slate-50/50 ${getSectionBg(section.color)} ${dragOverSection === section.id ? 'brightness-95' : ''}`}
                  >
                    <div className="group flex items-center gap-2 py-1.5 px-4 hover:bg-black/5 cursor-pointer select-none">
                      <div className="flex items-center gap-1.5 flex-1 min-w-0" onClick={() => setCollapsedSections(p => ({...p, [section.id]: !isCollapsed}))}>
                        <i className={`fa-solid fa-chevron-right text-[6px] transition-transform text-slate-200 ${!isCollapsed ? 'rotate-90' : ''}`}></i>
                        <i className={`fa-solid ${section.icon} text-[9px] text-slate-300 shrink-0`}></i>
                        
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
                            className="bg-white border-none p-0 text-[8px] font-black uppercase tracking-widest text-orange-600 focus:ring-0 w-full h-4 flex items-center"
                          />
                        ) : (
                          <div className="flex items-center gap-2 flex-1">
                             <Typography variant="tiny" className="text-slate-400 font-black uppercase tracking-widest text-[7.5px] truncate">{section.title}</Typography>
                             
                             {!showCompleted && !showNextActions && (
                               <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                 <button 
                                   onClick={(e) => { e.stopPropagation(); setAddingTaskToSectionId(section.id); }}
                                   className="w-4 h-4 rounded-sm bg-orange-100 text-orange-600 flex items-center justify-center transition-all hover:scale-110"
                                   title="Додати сюди"
                                 >
                                   <i className="fa-solid fa-plus text-[7px]"></i>
                                 </button>
                                 <button 
                                   onClick={(e) => { e.stopPropagation(); setOpenMenuId(isMenuOpen ? null : section.id); }}
                                   className={`w-4 h-4 rounded flex items-center justify-center transition-all ${isMenuOpen ? 'bg-slate-900 text-white' : 'text-slate-300 hover:bg-slate-100'}`}
                                 >
                                   <i className="fa-solid fa-ellipsis text-[8px]"></i>
                                 </button>

                                 {isMenuOpen && (
                                   <div className="absolute top-8 left-0 w-36 bg-white rounded-lg shadow-2xl border border-slate-100 p-1 z-[100] tiktok-blur animate-in zoom-in-95">
                                     <button onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); setEditingSectionId(section.id); setEditingSectionValue(section.title); }} className="w-full text-left px-2 py-1.5 hover:bg-slate-50 rounded text-[8px] font-black uppercase text-slate-600 flex items-center gap-2">
                                       <i className="fa-solid fa-pen text-[7px]"></i> Редагувати
                                     </button>
                                     <div className="p-1.5 border-t border-slate-50">
                                       <div className="text-[6.5px] font-black text-slate-300 uppercase mb-1">Фон секції</div>
                                       <div className="grid grid-cols-4 gap-1">
                                          {(['slate', 'orange', 'emerald', 'indigo', 'rose', 'amber', 'violet'] as const).map(c => (
                                            <button key={c} onClick={(e) => { e.stopPropagation(); updateInboxCategory(section.id, { color: c }); setOpenMenuId(null); }} className={`w-3.5 h-3.5 rounded-sm bg-${c}-400 hover:scale-110 transition-transform ${section.color === c ? 'ring-1 ring-slate-400' : ''}`} />
                                          ))}
                                          <button onClick={(e) => { e.stopPropagation(); updateInboxCategory(section.id, { color: undefined }); setOpenMenuId(null); }} className="w-3.5 h-3.5 rounded-sm bg-white border border-slate-200 hover:scale-110 transition-transform" />
                                       </div>
                                     </div>
                                     {!isSystem && (
                                       <button onClick={(e) => { e.stopPropagation(); if(confirm('Видалити секцію?')) deleteInboxCategory(section.id); setOpenMenuId(null); }} className="w-full text-left px-2 py-1.5 hover:bg-rose-50 rounded text-[8px] font-black uppercase text-rose-500 flex items-center gap-2 border-t border-slate-50">
                                         <i className="fa-solid fa-trash text-[7px]"></i> Видалити
                                       </button>
                                     )}
                                   </div>
                                 )}
                               </div>
                             )}
                             
                             <div className="h-px flex-1 bg-slate-100/50"></div>
                          </div>
                        )}
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        <span className="text-[8px] font-black text-slate-200 min-w-[12px] text-center">{sectionTasks.length}</span>
                      </div>
                    </div>

                    {isAddingTask && (
                      <div className="px-10 py-1.5 bg-black/5">
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
                          className="w-full bg-white border border-slate-100 rounded px-3 py-0 text-[11px] font-bold focus:ring-1 focus:ring-orange-200 outline-none h-7 flex items-center leading-none"
                        />
                      </div>
                    )}

                    {!isCollapsed && (
                      <div className="flex flex-col">
                        {sectionTasks.map(renderTask)}
                        {sectionTasks.length === 0 && !isAddingTask && (
                          <div className="py-2 text-center opacity-10">
                             <span className="text-[7.5px] font-black uppercase tracking-widest italic">Порожня область</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
            })}
          </div>
        </div>
        
        {/* Right Sidebar */}
        <div className="flex h-full border-l border-slate-100 z-[40] bg-white shrink-0">
          <div onMouseDown={startResizing} className={`w-[1px] h-full cursor-col-resize hover:bg-orange-500/50 z-[100] ${isResizing ? 'bg-orange-500' : 'bg-slate-100/50'}`}></div>
          <div style={{ width: detailsWidth }} className="h-full bg-white relative overflow-hidden flex flex-col">
            {selectedTaskId ? (
              <TaskDetails task={tasks.find(t => t.id === selectedTaskId)!} onClose={() => setSelectedTaskId(null)} />
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center opacity-5 grayscale pointer-events-none bg-slate-50/20">
                <i className="fa-solid fa-compass-drafting text-4xl mb-4 text-orange-400"></i>
                <Typography variant="tiny" className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Деталі Квесту</Typography>
                <Typography variant="tiny" className="mt-2 text-[8px] font-black uppercase text-slate-300">Оберіть запис для аналізу</Typography>
              </div>
            )}
          </div>
        </div>

        <style>{`
           .bg-slate-400 { background-color: #94a3b8; }
           .bg-orange-400 { background-color: #fb923c; }
           .bg-emerald-400 { background-color: #34d399; }
           .bg-indigo-400 { background-color: #818cf8; }
           .bg-rose-400 { background-color: #fb7185; }
           .bg-amber-400 { background-color: #fbbf24; }
           .bg-violet-400 { background-color: #a78bfa; }
        `}</style>
    </div>
  );
};

export default Inbox;
