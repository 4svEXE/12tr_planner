
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useApp } from '../contexts/AppContext';
import { Task, TaskStatus, Priority, Project, InboxCategory, TimeBlock } from '../types';
import Card from '../components/ui/Card';
import Typography from '../components/ui/Typography';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import TaskDetails from '../components/TaskDetails';

type ViewMode = 'day' | 'week' | 'month' | 'year' | 'agenda';

const HOUR_HEIGHT = 60; // pixels per hour

const TreeNode: React.FC<{ id: string; label: string; icon: string; type: 'folder' | 'task' | 'note' | 'event'; level: number; isOpen?: boolean; onToggle?: () => void; onAdd?: (e: React.MouseEvent) => void; onEdit?: (e: React.MouseEvent) => void; onDelete?: (e: React.MouseEvent) => void; onClick?: () => void; isDraggable?: boolean; onDragStart?: (e: React.DragEvent) => void; children?: React.ReactNode; }> = ({ id, label, icon, type, level, isOpen, onToggle, onAdd, onEdit, onDelete, onClick, isDraggable, onDragStart, children }) => (
  <div className="flex flex-col">
    <div draggable={isDraggable} onDragStart={onDragStart} onClick={type === 'folder' ? onToggle : onClick} className={`group flex items-center gap-1.5 py-1 px-2 cursor-pointer hover:bg-slate-100 rounded-lg transition-colors relative ${level > 0 ? 'ml-3' : ''}`}>
      <div className="flex items-center gap-1">
         {type === 'folder' && <i className={`fa-solid fa-chevron-right text-[8px] text-slate-300 transition-transform ${isOpen ? 'rotate-90' : ''}`}></i>}
         <i className={`fa-solid ${icon} text-[10px] w-4 text-center ${type === 'folder' ? 'text-orange-400' : type === 'note' ? 'text-indigo-400' : type === 'event' ? 'text-pink-500' : 'text-slate-400'}`}></i>
      </div>
      <span className={`text-[11px] font-medium truncate flex-1 ${type === 'folder' ? 'text-slate-700 font-bold' : 'text-slate-500'}`}>{label}</span>
      <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
         {onAdd && <i onClick={onAdd} className="fa-solid fa-plus text-[9px] text-slate-300 hover:text-orange-500 p-0.5"></i>}
         {onEdit && <i onClick={onEdit} className="fa-solid fa-pen text-[9px] text-slate-300 hover:text-blue-500 p-0.5"></i>}
         {onDelete && <i onClick={onDelete} className="fa-solid fa-trash text-[9px] text-slate-300 hover:text-rose-500 p-0.5"></i>}
      </div>
    </div>
    {isOpen && children && <div className="border-l border-slate-100 ml-3.5 mt-0.5 pl-0.5">{children}</div>}
  </div>
);

const Calendar: React.FC = () => {
  const { 
    tasks, projects, inboxCategories, timeBlocks, blockHistory, routinePresets, 
    addTimeBlock, updateTimeBlock, deleteTimeBlock, setBlockStatus,
    saveRoutineAsPreset, applyRoutinePreset, scheduleTask, toggleTaskStatus, updateTask, deleteTask, addTask, 
    addProject, updateProject, deleteProject, detailsWidth, setDetailsWidth,
    calendarDate, setCalendarDate, calendarViewMode, setCalendarViewMode
  } = useApp();
  
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [dragOverDay, setDragOverDay] = useState<number | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [editingBlock, setEditingBlock] = useState<TimeBlock | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const scheduleScrollRef = useRef<HTMLDivElement>(null);

  const currentDate = useMemo(() => new Date(calendarDate), [calendarDate]);
  const viewMode = calendarViewMode;

  useEffect(() => {
    if ((viewMode === 'day' || viewMode === 'week') && scheduleScrollRef.current) {
      const hours = currentTime.getHours();
      const container = scheduleScrollRef.current;
      const targetScroll = (hours * HOUR_HEIGHT) - (container.clientHeight / 2) + (HOUR_HEIGHT / 2);
      
      setTimeout(() => {
        container.scrollTo({
          top: Math.max(0, targetScroll),
          behavior: 'smooth'
        });
      }, 100);
    }
  }, [viewMode, currentDate]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const navigate = (direction: number) => {
    const next = new Date(currentDate);
    if (viewMode === 'year') next.setFullYear(currentDate.getFullYear() + direction);
    else if (viewMode === 'month') next.setMonth(currentDate.getMonth() + direction);
    else if (viewMode === 'week') next.setDate(currentDate.getDate() + (direction * 7));
    else next.setDate(currentDate.getDate() + direction);
    setCalendarDate(next.getTime());
  };

  const startResizing = useCallback((e: React.MouseEvent) => { e.preventDefault(); setIsResizing(true); }, []);
  const stopResizing = useCallback(() => setIsResizing(false), []);
  const resize = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    const newWidth = window.innerWidth - e.clientX;
    if (newWidth > 300 && newWidth < 800) setDetailsWidth(newWidth);
  }, [isResizing, setDetailsWidth]);

  useEffect(() => {
    if (isResizing) { window.addEventListener('mousemove', resize); window.addEventListener('mouseup', stopResizing); }
    else { window.removeEventListener('mousemove', resize); window.removeEventListener('mouseup', stopResizing); }
    return () => { window.removeEventListener('mousemove', resize); window.removeEventListener('mouseup', stopResizing); };
  }, [isResizing, resize, stopResizing]);

  const onDragStart = (e: React.DragEvent, taskId: string) => e.dataTransfer.setData('taskId', taskId);
  const onDrop = (e: React.DragEvent, timestamp: number) => {
    e.preventDefault(); 
    setDragOverDay(null);
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) scheduleTask(taskId, timestamp);
  };

  const weekDays = useMemo(() => {
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0,0,0,0);
    
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      return d;
    });
  }, [currentDate]);

  const handleAddQuickEvent = (timestamp: number) => {
    const id = addTask('Нова подія', 'tasks');
    const task = tasks.find(t => t.id === id);
    if (task) {
      updateTask({ ...task, isEvent: true, scheduledDate: timestamp });
      setSelectedTaskId(id);
    }
  };

  const renderProjectTree = (parentId?: string, level = 0) => {
    return projects.filter(p => p.parentFolderId === parentId).map(p => (
      <TreeNode key={p.id} id={p.id} label={p.name} icon={p.isStrategic ? 'fa-bolt-lightning' : 'fa-folder'} type="folder" level={level} isOpen={expandedNodes[`proj_${p.id}`]} onToggle={() => toggleNode(`proj_${p.id}`)}
        onAdd={(e) => { e.stopPropagation(); const t = prompt('Назва:'); if(t) addTask(t, 'unsorted', p.id); }}
        onEdit={(e) => { e.stopPropagation(); const n = prompt('Нова назва:', p.name); if(n) updateProject({...p, name: n}); }}
        onDelete={(e) => { e.stopPropagation(); if(confirm('Видалити?')) deleteProject(p.id); }}>
        {renderProjectTree(p.id, level + 1)}
        {tasks.filter(t => t.projectId === p.id && !t.scheduledDate && !t.isDeleted).map(t => (
          <TreeNode key={t.id} id={t.id} label={t.title} icon={t.isEvent ? 'fa-calendar-star' : t.category === 'note' ? 'fa-note-sticky' : 'fa-file-lines'} type={t.isEvent ? 'event' : t.category === 'note' ? 'note' : 'task'} level={level + 1} onClick={() => setSelectedTaskId(t.id)} isDraggable onDragStart={(e) => onDragStart(e, t.id)}
            onEdit={(e) => { e.stopPropagation(); setSelectedTaskId(t.id); }} onDelete={(e) => { e.stopPropagation(); deleteTask(t.id); }} />
        ))}
      </TreeNode>
    ));
  };

  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({ 'root_inbox': true, 'root_next': true, 'root_projects': true, 'root_events': true });
  const toggleNode = (nodeId: string) => setExpandedNodes(prev => ({ ...prev, [nodeId]: !prev[nodeId] }));

  // Yearly view helper
  const renderYearMonth = (year: number, month: number) => {
    const monthName = new Date(year, month, 1).toLocaleString('uk-UA', { month: 'long' });
    const firstDay = (new Date(year, month, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);

    return (
      <div key={month} className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm hover:border-orange-200 transition-colors cursor-pointer" onClick={() => { setCalendarDate(new Date(year, month, 1).getTime()); setCalendarViewMode('month'); }}>
        <Typography variant="tiny" className="text-slate-400 font-black mb-2 text-center uppercase tracking-widest">{monthName}</Typography>
        <div className="grid grid-cols-7 gap-0.5 text-[6px] font-black text-slate-200 mb-1 text-center">
          {['П', 'В', 'С', 'Ч', 'П', 'С', 'Н'].map(d => <div key={d}>{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-0.5">
          {days.map((d, i) => {
            if (d === null) return <div key={`empty-${i}`} />;
            const isToday = new Date().getFullYear() === year && new Date().getMonth() === month && new Date().getDate() === d;
            const dayTs = new Date(year, month, d).setHours(0,0,0,0);
            const hasTask = tasks.some(t => !t.isDeleted && (t.scheduledDate === dayTs || (t.isEvent && t.endDate && dayTs >= t.scheduledDate! && dayTs <= t.endDate)));
            return (
              <div key={i} className={`h-3 w-3 rounded-[2px] flex items-center justify-center text-[5px] font-bold ${isToday ? 'bg-orange-600 text-white' : hasTask ? 'bg-orange-100 text-orange-600' : 'text-slate-400'}`}>
                {d}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden relative">
      <aside className="w-64 bg-white border-r border-slate-100 flex flex-col hidden lg:flex shrink-0 select-none shadow-sm">
        <div className="p-4 border-b border-slate-50 flex items-center justify-between">
           <Typography variant="tiny" className="text-slate-400 font-black">СТРУКТУРА БЕКЛОГУ</Typography>
           <button onClick={() => { const n = prompt('Назва:'); if(n) addProject({ name: n, color: '#f97316', isStrategic: false }); }} className="text-[10px] text-slate-300 hover:text-orange-500"><i className="fa-solid fa-folder-plus"></i></button>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
           <TreeNode id="root_inbox" label="ВХІДНІ" icon="fa-inbox" type="folder" level={-1} isOpen={expandedNodes['root_inbox']} onToggle={() => toggleNode('root_inbox')}>
              {inboxCategories.map(cat => (
                <TreeNode key={cat.id} id={cat.id} label={cat.title} icon={cat.icon} type="folder" level={0} isOpen={expandedNodes[`cat_${cat.id}`]} onToggle={() => toggleNode(`cat_${cat.id}`)} onAdd={(e) => { e.stopPropagation(); const t = prompt('Назва:'); if(t) addTask(t, cat.id); }}>
                  {tasks.filter(t => (t.category === cat.id || (cat.id === 'notes' && t.category === 'note')) && !t.scheduledDate && !t.isDeleted && t.status !== TaskStatus.DONE).map(t => (
                    <TreeNode key={t.id} id={t.id} label={t.title} icon={t.isEvent ? 'fa-calendar-star' : t.category === 'note' ? 'fa-note-sticky' : 'fa-file-lines'} type={t.isEvent ? 'event' : t.category === 'note' ? 'note' : 'task'} level={1} onClick={() => setSelectedTaskId(t.id)} isDraggable onDragStart={(e) => onDragStart(e, t.id)} onEdit={() => setSelectedTaskId(t.id)} onDelete={() => deleteTask(t.id)} />
                  ))}
                </TreeNode>
              ))}
           </TreeNode>
           <TreeNode id="root_events" label="ПОДІЇ" icon="fa-calendar-check" type="folder" level={-1} isOpen={expandedNodes['root_events']} onToggle={() => toggleNode('root_events')}>
              {tasks.filter(t => t.isEvent && !t.scheduledDate && !t.isDeleted).map(t => (
                <TreeNode key={t.id} id={t.id} label={t.title} icon="fa-calendar-star" type="event" level={0} onClick={() => setSelectedTaskId(t.id)} isDraggable onDragStart={(e) => onDragStart(e, t.id)} onEdit={() => setSelectedTaskId(t.id)} onDelete={() => deleteTask(t.id)} />
              ))}
           </TreeNode>
           <TreeNode id="root_next" label="НАСТУПНІ ДІЇ" icon="fa-bolt" type="folder" level={-1} isOpen={expandedNodes['root_next']} onToggle={() => toggleNode('root_next')}>
              {tasks.filter(t => t.status === TaskStatus.NEXT_ACTION && !t.scheduledDate && !t.isDeleted).map(t => (
                <TreeNode key={t.id} id={t.id} label={t.title} icon={t.isEvent ? 'fa-calendar-star' : t.category === 'note' ? 'fa-note-sticky' : 'fa-file-bolt'} type={t.isEvent ? 'event' : t.category === 'note' ? 'note' : 'task'} level={0} onClick={() => setSelectedTaskId(t.id)} isDraggable onDragStart={(e) => onDragStart(e, t.id)} onEdit={() => setSelectedTaskId(t.id)} onDelete={() => deleteTask(t.id)} />
              ))}
           </TreeNode>
           <TreeNode id="root_projects" label="ПРОЄКТИ" icon="fa-folder-tree" type="folder" level={-1} isOpen={expandedNodes['root_projects']} onToggle={() => toggleNode('root_projects')}>
              {renderProjectTree(undefined)}
           </TreeNode>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="p-4 bg-white border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm z-20">
          <div className="flex items-center gap-4">
            <Typography variant="h3" className="text-slate-900 capitalize min-w-[140px] text-base">
              {viewMode === 'year' ? currentDate.getFullYear() : currentDate.toLocaleString('uk-UA', { month: 'long', year: 'numeric' })}
            </Typography>
            <div className="flex bg-slate-100 rounded-xl p-0.5">
              <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-orange-600 transition-colors"><i className="fa-solid fa-chevron-left text-[10px]"></i></button>
              <button onClick={() => { setCalendarDate(Date.now()); if(viewMode==='year') setCalendarViewMode('month'); }} className="px-3 text-[9px] font-black uppercase text-slate-500 hover:text-orange-600 border-x border-slate-200 transition-colors">Сьогодні</button>
              <button onClick={() => navigate(1)} className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-orange-600 transition-colors"><i className="fa-solid fa-chevron-right text-[10px]"></i></button>
            </div>
          </div>
          <div className="flex bg-slate-100 rounded-xl p-0.5">
            {(['day', 'week', 'month', 'year'] as ViewMode[]).map(mode => (
              <button key={mode} onClick={() => setCalendarViewMode(mode)} className={`px-4 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${viewMode === mode ? 'bg-white shadow-sm text-orange-600' : 'text-slate-400 hover:text-slate-600'}`}>{mode === 'day' ? 'День' : mode === 'week' ? 'Тиж' : mode === 'month' ? 'Міс' : 'Рік'}</button>
            ))}
          </div>
        </header>

        <div className="flex-1 overflow-auto bg-slate-50/50 p-4">
          {viewMode === 'day' ? (
            <div className="flex h-full gap-4">
               <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar pr-2">
                  <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
                    <div className="flex justify-between items-center mb-8">
                      <Typography variant="h3" className="text-slate-800 text-xl">{currentDate.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', weekday: 'long' })}</Typography>
                      <Badge variant="orange" className="px-3 py-1">{tasks.filter(t => t.scheduledDate === new Date(currentDate).setHours(0,0,0,0) && !t.isDeleted).length} КВЕСТІВ</Badge>
                    </div>
                    <div className="space-y-3">
                       {tasks.filter(t => {
                         if (t.isDeleted) return false;
                         const startTs = t.scheduledDate ? new Date(t.scheduledDate).setHours(0,0,0,0) : null;
                         const endTs = t.endDate ? new Date(t.endDate).setHours(0,0,0,0) : startTs;
                         const curTs = new Date(currentDate).setHours(0,0,0,0);
                         if (!startTs) return false;
                         return curTs >= startTs && curTs <= (endTs || startTs);
                       }).map(t => (
                         <div key={t.id} onClick={() => setSelectedTaskId(t.id)} className={`flex items-center gap-4 p-4 rounded-3xl transition-all cursor-pointer group ${t.isEvent ? 'bg-pink-50 border border-pink-100' : 'bg-slate-50 border border-transparent hover:bg-orange-50'}`}>
                           <button onClick={(e) => { e.stopPropagation(); toggleTaskStatus(t); }} className={`w-6 h-6 rounded-xl border-2 flex items-center justify-center transition-all ${t.status === TaskStatus.DONE ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200 bg-white text-transparent group-hover:border-orange-400'}`}>
                             <i className="fa-solid fa-check text-xs"></i>
                           </button>
                           <div className="flex-1">
                             <span className={`text-sm font-bold ${t.status === TaskStatus.DONE ? 'line-through text-slate-300' : 'text-slate-700'}`}>{t.title}</span>
                             {t.isEvent && <div className="text-[8px] font-black uppercase text-pink-400 tracking-tighter">Подія</div>}
                           </div>
                         </div>
                       ))}
                    </div>
                  </div>
               </div>
               {/* Daily Schedule sidebar */}
               <div className="w-96 bg-white border border-slate-100 flex flex-col shadow-sm rounded-3xl overflow-hidden relative">
                  <header className="p-4 border-b border-slate-50 flex items-center justify-between shrink-0 bg-white/80 backdrop-blur z-20">
                    <div className="flex flex-col">
                      <Typography variant="tiny" className="text-slate-900 font-black">РОЗПОРЯДОК</Typography>
                      <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Повторюється щотижня</span>
                    </div>
                    <div className="flex gap-2">
                       <button onClick={() => setEditingBlock({ id: 'new', title: 'Новий блок', startHour: 9, endHour: 10, type: 'work' })} className="w-8 h-8 rounded-xl bg-orange-600 text-white hover:bg-orange-700 shadow-lg shadow-orange-100 transition-all flex items-center justify-center"><i className="fa-solid fa-plus text-xs"></i></button>
                    </div>
                  </header>
                  <div ref={scheduleScrollRef} className="flex-1 overflow-y-auto custom-scrollbar relative">
                    <div className="absolute left-0 top-0 w-full" style={{ height: 24 * HOUR_HEIGHT }}>
                       {Array.from({ length: 24 }, (_, i) => (
                         <div key={i} className="flex items-start border-t border-slate-50" style={{ height: HOUR_HEIGHT }}>
                           <span className="text-[8px] font-black text-slate-300 p-2 w-10 text-right">{i}:00</span>
                           <div className="flex-1 h-px bg-slate-50 mt-[1px]"></div>
                         </div>
                       ))}
                    </div>
                  </div>
               </div>
            </div>
          ) : viewMode === 'week' ? (
            <div className="flex flex-col h-full bg-white rounded-3xl overflow-hidden shadow-xl border border-slate-200">
               <div className="flex border-b border-slate-100 bg-slate-50/50">
                  <div className="w-12 border-r border-slate-100"></div>
                  {weekDays.map((d, i) => {
                    const isToday = d.toDateString() === new Date().toDateString();
                    return (
                      <div key={i} className="flex-1 p-2 text-center border-r border-slate-100 last:border-r-0">
                         <div className="text-[8px] font-black uppercase text-slate-400 mb-1">{d.toLocaleString('uk-UA', { weekday: 'short' })}</div>
                         <div className={`mx-auto w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-black ${isToday ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-800'}`}>{d.getDate()}</div>
                      </div>
                    );
                  })}
               </div>
               <div ref={scheduleScrollRef} className="flex-1 overflow-y-auto custom-scrollbar relative">
                  <div className="flex" style={{ height: 24 * HOUR_HEIGHT }}>
                     <div className="w-12 border-r border-slate-100 bg-slate-50/20 sticky left-0 z-20">
                        {Array.from({ length: 24 }, (_, i) => (
                          <div key={i} className="h-[60px] text-[8px] font-black text-slate-300 text-right pr-2 pt-2 border-b border-slate-50">{i}:00</div>
                        ))}
                     </div>
                     {weekDays.map((d, dayIdx) => {
                       const dayTs = d.getTime();
                       const dayTasks = tasks.filter(t => {
                         if (t.isDeleted) return false;
                         const start = t.scheduledDate ? new Date(t.scheduledDate).setHours(0,0,0,0) : null;
                         const end = t.endDate ? new Date(t.endDate).setHours(0,0,0,0) : start;
                         if (!start) return false;
                         return dayTs >= start && dayTs <= (end || start);
                       });

                       return (
                         <div 
                           key={dayIdx} 
                           onDragOver={(e) => { e.preventDefault(); setDragOverDay(dayTs); }}
                           onDragLeave={() => setDragOverDay(null)}
                           onDrop={(e) => onDrop(e, dayTs)}
                           onClick={() => handleAddQuickEvent(dayTs)}
                           className={`flex-1 border-r border-slate-100 last:border-r-0 relative group cursor-pointer transition-colors ${dragOverDay === dayTs ? 'bg-orange-50/30 ring-inset ring-2 ring-orange-200' : 'hover:bg-slate-50/50'}`}
                         >
                            {Array.from({ length: 24 }, (_, i) => <div key={i} className="h-[60px] border-b border-slate-50/50"></div>)}
                            
                            {/* Empty slot indicator */}
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 flex flex-col pointer-events-none">
                                {Array.from({ length: 24 }, (_, i) => (
                                  <div key={i} className="h-[60px] flex items-center justify-center">
                                     <i className="fa-solid fa-plus text-[10px] text-orange-200"></i>
                                  </div>
                                ))}
                            </div>

                            <div className="absolute inset-0 p-1.5 space-y-1.5">
                               {dayTasks.map(t => (
                                 <div 
                                   key={t.id} 
                                   draggable
                                   onDragStart={(e) => onDragStart(e, t.id)}
                                   onClick={(e) => { e.stopPropagation(); setSelectedTaskId(t.id); }} 
                                   className={`p-2 rounded-xl border text-[10px] font-bold shadow-sm transition-all hover:scale-[1.02] cursor-grab active:cursor-grabbing ${t.isEvent ? 'bg-pink-500 text-white border-pink-600' : 'bg-white border-slate-100 text-slate-700 hover:border-orange-200'}`}
                                 >
                                    <div className="truncate mb-0.5">{t.title}</div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-[7px] opacity-70 uppercase font-black">{t.isEvent ? 'Подія' : 'Завдання'}</span>
                                      {t.status === TaskStatus.DONE && <i className="fa-solid fa-check text-[8px]"></i>}
                                    </div>
                                 </div>
                               ))}
                            </div>
                         </div>
                       );
                     })}
                  </div>
               </div>
            </div>
          ) : viewMode === 'month' ? (
            <div className="grid grid-cols-7 gap-px bg-slate-200 rounded-2xl overflow-hidden shadow-xl border border-slate-200">
              {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'].map(d => (
                <div key={d} className="bg-slate-50 p-2 text-center text-[8px] font-black uppercase text-slate-400 border-b border-slate-200">{d}</div>
              ))}
              {Array.from({length: 42}, (_, i) => { 
                const s = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1); 
                s.setDate(s.getDate() - (s.getDay()===0?6:s.getDay()-1) + i); 
                return s; 
              }).map((date, i) => {
                const ts = new Date(date).setHours(0,0,0,0);
                const isTodayCell = ts === new Date().setHours(0,0,0,0);
                const isCurrentMonth = date.getMonth() === currentDate.getMonth();
                const dayTasksList = tasks.filter(t => {
                  if (t.isDeleted) return false;
                  const startTs = t.scheduledDate ? new Date(t.scheduledDate).setHours(0,0,0,0) : null;
                  const endTs = t.endDate ? new Date(t.endDate).setHours(0,0,0,0) : startTs;
                  if (!startTs) return false;
                  return ts >= startTs && ts <= (endTs || startTs);
                });
                
                return (
                  <div key={i} onDragOver={(e) => { e.preventDefault(); setDragOverDay(ts); }} onDragLeave={() => setDragOverDay(null)} onDrop={(e) => onDrop(e, ts)}
                    className={`min-h-[110px] p-2 flex flex-col transition-all relative group ${isCurrentMonth ? 'bg-white' : 'bg-slate-50/50'} ${dragOverDay === ts ? 'bg-orange-50 ring-2 ring-orange-200 z-10' : ''}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-lg ${isTodayCell ? 'bg-orange-600 text-white shadow-lg' : isCurrentMonth ? 'text-slate-900' : 'text-slate-300'}`}>{date.getDate()}</span>
                      <button onClick={(e) => { e.stopPropagation(); handleAddQuickEvent(ts); }} className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded-lg bg-slate-50 text-slate-400 hover:text-orange-600 flex items-center justify-center transition-all"><i className="fa-solid fa-plus text-[8px]"></i></button>
                    </div>
                    <div className="flex-1 space-y-0.5 mt-1 overflow-hidden">
                      {dayTasksList.slice(0, 4).map(t => (
                        <div key={t.id} onClick={(e) => { e.stopPropagation(); setSelectedTaskId(t.id); }} className={`text-[9px] font-bold truncate px-1.5 py-0.5 rounded border transition-all ${t.isEvent ? 'bg-pink-500 text-white border-pink-600 shadow-sm' : 'bg-orange-50/50 border-orange-100/30 text-slate-600 hover:bg-orange-100'}`}>{t.title}</div>
                      ))}
                      {dayTasksList.length > 4 && <div className="text-[7px] font-black text-orange-500 uppercase px-1">+{dayTasksList.length - 4}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : viewMode === 'year' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-10">
              {Array.from({ length: 12 }, (_, i) => renderYearMonth(currentDate.getFullYear(), i))}
            </div>
          ) : (
            <div className="text-center py-20 opacity-20"><Typography variant="h2">Даний режим перегляду в розробці</Typography></div>
          )}
        </div>
      </main>

      {selectedTaskId && (
        <div className="flex h-full animate-in slide-in-from-right duration-300 border-l border-slate-100 bg-white z-[60]">
           <div onMouseDown={startResizing} className={`w-[2px] h-full cursor-col-resize hover:bg-orange-500 ${isResizing ? 'bg-orange-500' : 'bg-slate-50'}`}></div>
           <div style={{ width: detailsWidth }}>
              <TaskDetails task={tasks.find(t => t.id === selectedTaskId)!} onClose={() => setSelectedTaskId(null)} />
           </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;
