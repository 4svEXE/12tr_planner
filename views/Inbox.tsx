
import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Task, TaskStatus, Priority, InboxCategory } from '../types';
import TaskDetails from '../components/TaskDetails';
import { useApp } from '../contexts/AppContext';
import Typography from '../components/ui/Typography';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';

interface InboxProps {
  showCompleted?: boolean;
  showNextActions?: boolean;
}

const Inbox: React.FC<InboxProps> = ({ showCompleted = false, showNextActions = false }) => {
  const { 
    tasks, toggleTaskStatus, toggleTaskPin, addTask, 
    moveTaskToCategory, inboxCategories, addInboxCategory, 
    deleteInboxCategory, updateInboxCategory, detailsWidth, setDetailsWidth
  } = useApp();
  
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [dragOverSection, setDragOverSection] = useState<string | null>(null);
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  
  // Resizing state
  const [isResizing, setIsResizing] = useState(false);
  
  // Collapse state for sections
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  
  // Editing section state
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editSectionValue, setEditSectionValue] = useState('');

  // Quick add per section
  const [quickAddSection, setQuickAddSection] = useState<string | null>(null);
  const [quickAddValue, setQuickAddValue] = useState('');

  // Global Inbox entry
  const [globalAddValue, setGlobalAddValue] = useState('');

  const filteredTasks = useMemo(() => 
    tasks.filter(t => {
      const isHabit = t.projectSection === 'habits' || t.tags.includes('habit');
      if (t.isDeleted || isHabit) return false;
      
      if (showNextActions) {
        return t.status === TaskStatus.NEXT_ACTION;
      }
      
      const statusMatch = showCompleted ? t.status === TaskStatus.DONE : t.status !== TaskStatus.DONE;
      return statusMatch;
    }),
  [tasks, showCompleted, showNextActions]);

  // Resizing logic
  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    const newWidth = window.innerWidth - e.clientX;
    if (newWidth > 300 && newWidth < 800) {
      setDetailsWidth(newWidth);
    }
  }, [isResizing, setDetailsWidth]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResizing);
    } else {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    }
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [isResizing, resize, stopResizing]);

  const toggleCollapse = (id: string) => {
    setCollapsedSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const startEditingSection = (e: React.MouseEvent, section: InboxCategory) => {
    e.stopPropagation();
    if (['tasks', 'pinned', 'unsorted'].includes(section.id)) return;
    setEditingSectionId(section.id);
    setEditSectionValue(section.title);
  };

  const saveSectionRename = (id: string) => {
    if (editSectionValue.trim()) {
      updateInboxCategory(id, { title: editSectionValue.trim() });
    }
    setEditingSectionId(null);
  };

  const handleGlobalAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (globalAddValue.trim()) {
      addTask(globalAddValue.trim(), 'unsorted');
      setGlobalAddValue('');
      setCollapsedSections(prev => ({ ...prev, unsorted: false }));
    }
  };

  const handleAddSection = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSectionTitle.trim()) {
      addInboxCategory(newSectionTitle.trim());
      setNewSectionTitle('');
      setIsAddingSection(false);
    }
  };

  const handleQuickAdd = (categoryId: string) => {
    if (quickAddValue.trim()) {
      addTask(quickAddValue.trim(), categoryId);
      setQuickAddValue('');
      setQuickAddSection(null);
      setCollapsedSections(prev => ({ ...prev, [categoryId]: false }));
    }
  };

  const onDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = (e: React.DragEvent, sectionId: string) => {
    e.preventDefault();
    setDragOverSection(sectionId);
  };

  const onDrop = (e: React.DragEvent, category: InboxCategory) => {
    e.preventDefault();
    setDragOverSection(null);
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
      moveTaskToCategory(taskId, category.id, category.isPinned);
    }
  };

  const renderTask = (task: Task) => {
    const checklist = task.checklist || [];
    const totalItems = checklist.length;
    const completedItems = checklist.filter(i => i.completed).length;
    const hasChecklist = totalItems > 0;
    const progress = hasChecklist ? (completedItems / totalItems) * 100 : 0;

    return (
      <div 
        key={task.id} 
        draggable
        onDragStart={(e) => onDragStart(e, task.id)}
        className={`group flex flex-col cursor-grab active:cursor-grabbing hover:bg-slate-50 border-l-2 transition-all ${
          selectedTaskId === task.id ? 'bg-orange-50/50 border-orange-400' : 'border-transparent'
        }`}
        onClick={() => setSelectedTaskId(task.id)}
      >
        <div className="flex items-center gap-3 py-2 px-6">
          <button 
            onClick={(e) => { e.stopPropagation(); toggleTaskStatus(task); }}
            className={`w-4 h-4 rounded border flex items-center justify-center transition-all flex-shrink-0 ${
              task.status === TaskStatus.DONE ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 bg-white text-transparent hover:border-orange-400'
            }`}
          >
            <i className="fa-solid fa-check text-[8px]"></i>
          </button>

          <div className="flex-1 min-w-0 flex flex-col gap-0.5">
            <div className="flex items-center gap-3">
              <span className={`text-[13px] font-medium truncate ${task.status === TaskStatus.DONE ? 'text-slate-300 line-through' : 'text-slate-700'}`}>
                {task.title}
              </span>
              {task.tags.length > 0 && (
                <div className="flex gap-1.5 overflow-hidden">
                  {task.tags.slice(0, 2).map(tag => (
                    <span key={tag} className="text-[9px] text-slate-400 font-bold whitespace-nowrap">#{tag}</span>
                  ))}
                </div>
              )}
            </div>
            {hasChecklist && (
              <div className="flex items-center gap-3">
                <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-orange-500 transition-all duration-500" 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <span className="text-[9px] font-black text-slate-400 tabular-nums">
                  {completedItems}/{totalItems}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={(e) => { e.stopPropagation(); toggleTaskPin(task.id); }}
              className={`text-[10px] w-6 h-6 rounded hover:bg-slate-200 flex items-center justify-center ${task.isPinned ? 'text-orange-500' : 'text-slate-300'}`}
            >
              <i className="fa-solid fa-thumbtack"></i>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const title = showNextActions ? 'Наступні дії' : showCompleted ? 'Архівація' : 'Вхідні';

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden">
      <div className="flex flex-1 overflow-hidden">
        {/* Main List Section */}
        <div className="flex-1 flex flex-col min-w-0">
          <header className="px-8 py-6 border-b border-slate-100 flex items-center justify-between z-10 bg-white/80 backdrop-blur-md sticky top-0">
            <div className="flex items-center gap-6">
              <Typography variant="h1" className="text-2xl">{title}</Typography>
              {!showCompleted && !showNextActions && (
                <div className="flex items-center gap-3">
                  <div className="h-4 w-px bg-slate-200"></div>
                  <button 
                    onClick={() => setIsAddingSection(true)}
                    className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-orange-600 flex items-center gap-2 transition-colors"
                  >
                    <i className="fa-solid fa-plus-circle"></i> Нова секція
                  </button>
                </div>
              )}
            </div>
            <div className="flex items-center gap-4">
               <Badge variant="slate" icon="fa-layer-group" className="px-3 py-1">{filteredTasks.length} об'єктів</Badge>
            </div>
          </header>

          {/* Global Quick Add Field */}
          {!showCompleted && !showNextActions && (
            <div className="px-8 py-4 bg-slate-50/50 border-b border-slate-50">
              <form onSubmit={handleGlobalAdd} className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-orange-500 transition-colors">
                  <i className="fa-solid fa-feather-pointed text-xs"></i>
                </div>
                <input 
                  type="text"
                  value={globalAddValue}
                  onChange={(e) => setGlobalAddValue(e.target.value)}
                  placeholder="Скинути думку у Вхідні... (Enter щоб додати в Несортовано)"
                  className="w-full bg-white border border-slate-100 rounded-2xl py-3.5 pl-12 pr-6 text-sm font-bold shadow-sm focus:ring-4 focus:ring-orange-100 focus:border-orange-200 outline-none transition-all placeholder:text-slate-300"
                />
              </form>
            </div>
          )}

          <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col pb-20">
            {showNextActions ? (
              <div className="flex flex-col bg-white">
                {filteredTasks.map(renderTask)}
              </div>
            ) : (
              inboxCategories.map(section => {
                const sectionTasks = filteredTasks.filter(t => t.category === section.id || (section.isPinned && t.isPinned));
                const isCollapsed = collapsedSections[section.id];
                const isEditing = editingSectionId === section.id;
                const isQuickAdding = quickAddSection === section.id;
                
                return (
                  <div 
                    key={section.id}
                    onDragOver={(e) => onDragOver(e, section.id)}
                    onDrop={(e) => onDrop(e, section)}
                    className={`flex flex-col border-b border-slate-50 transition-all ${
                      dragOverSection === section.id ? 'bg-orange-50/30' : ''
                    }`}
                  >
                    {/* Horizontal Section Strip */}
                    <div 
                      onClick={() => toggleCollapse(section.id)}
                      className="group flex items-center gap-4 py-3 px-8 hover:bg-slate-50/50 cursor-pointer select-none transition-colors"
                    >
                      <i className={`fa-solid fa-chevron-right text-[10px] transition-transform text-slate-300 ${isCollapsed ? '' : 'rotate-90'}`}></i>
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <i className={`fa-solid ${section.icon} text-[11px] text-slate-400 group-hover:text-orange-500 transition-colors`}></i>
                        {isEditing ? (
                          <input 
                            autoFocus
                            value={editSectionValue}
                            onChange={(e) => setEditSectionValue(e.target.value)}
                            onBlur={() => saveSectionRename(section.id)}
                            onKeyDown={(e) => e.key === 'Enter' && saveSectionRename(section.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="text-[12px] font-black uppercase tracking-widest text-slate-800 bg-white border border-orange-200 rounded px-2 py-0.5 outline-none"
                          />
                        ) : (
                          <Typography variant="tiny" className="text-slate-500 font-black group-hover:text-slate-900 truncate">{section.title}</Typography>
                        )}
                        <span className="text-[10px] font-bold text-slate-300 px-1.5 py-0.5 rounded-md border border-slate-100 bg-white">{sectionTasks.length}</span>
                      </div>
                      <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => { e.stopPropagation(); setQuickAddSection(section.id); setCollapsedSections(p => ({...p, [section.id]: false})); }} className="text-[10px] text-slate-300 hover:text-orange-500 p-1"><i className="fa-solid fa-plus"></i></button>
                        {!['tasks', 'pinned', 'unsorted'].includes(section.id) && (
                          <>
                            <button onClick={(e) => startEditingSection(e, section)} className="text-[10px] text-slate-300 hover:text-orange-500 p-1"><i className="fa-solid fa-pen"></i></button>
                            <button onClick={(e) => { e.stopPropagation(); deleteInboxCategory(section.id); }} className="text-[10px] text-slate-300 hover:text-rose-400 p-1"><i className="fa-solid fa-trash"></i></button>
                          </>
                        )}
                      </div>
                    </div>
                    {!isCollapsed && (
                      <div className="flex flex-col bg-white">
                        {sectionTasks.map(renderTask)}
                        {isQuickAdding && (
                          <div className="px-14 py-2 border-l-2 border-orange-100 bg-orange-50/10">
                            <input autoFocus value={quickAddValue} onChange={(e) => setQuickAddValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleQuickAdd(section.id)} onBlur={() => !quickAddValue && setQuickAddSection(null)} placeholder="Що додати?" className="w-full bg-transparent border-none py-1 text-[13px] font-medium text-slate-700 outline-none placeholder:text-slate-300" />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
            {isAddingSection && !showNextActions && (
              <div className="mx-8 mt-6 bg-slate-50 rounded-2xl border-2 border-dashed border-orange-200 p-6 animate-in zoom-in-95 duration-200">
                <form onSubmit={handleAddSection} className="flex items-center gap-4">
                  <div className="flex-1">
                    <Typography variant="tiny" className="text-orange-600 mb-2 block">Назва нової секції</Typography>
                    <input autoFocus type="text" value={newSectionTitle} onChange={(e) => setNewSectionTitle(e.target.value)} placeholder="Напр: Пропозиції..." className="w-full bg-white border-none rounded-xl py-3 px-5 text-sm font-bold focus:ring-4 focus:ring-orange-100 shadow-sm" />
                  </div>
                  <div className="flex gap-2 pt-6">
                    <Button type="submit" className="px-6 py-3 rounded-xl">ДОДАТИ</Button>
                    <Button variant="ghost" onClick={() => setIsAddingSection(false)} className="px-4 py-3 rounded-xl">СКАСУВАТИ</Button>
                  </div>
                </form>
              </div>
            )}
            {filteredTasks.length === 0 && (
              <div className="flex flex-col items-center justify-center py-32 text-center opacity-20">
                <i className={`fa-solid ${showNextActions ? 'fa-bolt' : 'fa-inbox'} text-8xl mb-8`}></i>
                <Typography variant="h2">Тут порожньо</Typography>
                <Typography variant="body" className="mt-4">Ваш фокус ідеальний.</Typography>
              </div>
            )}
          </div>
        </div>

        {/* Resizable Details Panel */}
        {selectedTaskId && (
          <div className="flex h-full animate-in slide-in-from-right duration-300">
            {/* Draggable Divider */}
            <div 
              onMouseDown={startResizing}
              className={`w-[2px] h-full cursor-col-resize hover:bg-orange-500 transition-colors z-[100] ${isResizing ? 'bg-orange-500' : 'bg-slate-100'}`}
            ></div>
            
            <div style={{ width: detailsWidth }} className="h-full bg-white relative">
              <TaskDetails 
                task={tasks.find(t => t.id === selectedTaskId)!} 
                onClose={() => setSelectedTaskId(null)} 
              />
            </div>
          </div>
        )}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #f1f5f9; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #e2e8f0; }
        ${isResizing ? 'body { cursor: col-resize !important; user-select: none !important; }' : ''}
      `}</style>
    </div>
  );
};

export default Inbox;
