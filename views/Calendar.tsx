
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

const TreeNode: React.FC<{ id: string; label: string; icon: string; type: 'folder' | 'task' | 'note'; level: number; isOpen?: boolean; onToggle?: () => void; onAdd?: (e: React.MouseEvent) => void; onEdit?: (e: React.MouseEvent) => void; onDelete?: (e: React.MouseEvent) => void; onClick?: () => void; isDraggable?: boolean; onDragStart?: (e: React.DragEvent) => void; children?: React.ReactNode; }> = ({ id, label, icon, type, level, isOpen, onToggle, onAdd, onEdit, onDelete, onClick, isDraggable, onDragStart, children }) => (
  <div className="flex flex-col">
    <div draggable={isDraggable} onDragStart={onDragStart} onClick={type === 'folder' ? onToggle : onClick} className={`group flex items-center gap-1.5 py-1 px-2 cursor-pointer hover:bg-slate-100 rounded-lg transition-colors relative ${level > 0 ? 'ml-3' : ''}`}>
      <div className="flex items-center gap-1">
         {type === 'folder' && <i className={`fa-solid fa-chevron-right text-[8px] text-slate-300 transition-transform ${isOpen ? 'rotate-90' : ''}`}></i>}
         <i className={`fa-solid ${icon} text-[10px] w-4 text-center ${type === 'folder' ? 'text-orange-400' : type === 'note' ? 'text-indigo-400' : 'text-slate-400'}`}></i>
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
    addProject, updateProject, deleteProject, detailsWidth, setDetailsWidth 
  } = useApp();
  
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [dragOverDay, setDragOverDay] = useState<number | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [editingBlock, setEditingBlock] = useState<TimeBlock | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const scheduleScrollRef = useRef<HTMLDivElement>(null);

  // Automatic scroll to current time when switching to Day view
  useEffect(() => {
    if (viewMode === 'day' && scheduleScrollRef.current) {
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

  const dateStr = currentDate.toISOString().split('T')[0];
  const dayOfWeek = (currentDate.getDay() + 6) % 7; // Map 0-6 to Mon-Sun where Mon=0
  const isSelectedToday = dateStr === new Date().toISOString().split('T')[0];
  
  const daySchedule = useMemo(() => 
    timeBlocks.filter(b => b.dayOfWeek === dayOfWeek).sort((a, b) => a.startHour - b.startHour),
  [timeBlocks, dayOfWeek]);

  const timeIndicatorTop = useMemo(() => {
    if (!isSelectedToday) return -1;
    const hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    return (hours * HOUR_HEIGHT) + (minutes * (HOUR_HEIGHT / 60));
  }, [currentTime, isSelectedToday]);

  const handleSaveBlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBlock) {
      if (editingBlock.id === 'new') {
        const { id, ...data } = editingBlock;
        addTimeBlock({ ...data, dayOfWeek });
      } else {
        updateTimeBlock(editingBlock);
      }
      setEditingBlock(null);
    }
  };

  const getBlockColor = (type: string, isPast: boolean) => {
    if (isPast) return 'bg-slate-100 border-slate-200 text-slate-400 grayscale opacity-40';
    switch (type) {
      case 'work': return 'bg-indigo-50 border-indigo-200 text-indigo-700';
      case 'study': return 'bg-purple-50 border-purple-200 text-purple-700';
      case 'rest': return 'bg-emerald-50 border-emerald-200 text-emerald-700';
      case 'routine': return 'bg-orange-50 border-orange-200 text-orange-700';
      default: return 'bg-slate-50 border-slate-200 text-slate-700';
    }
  };

  const navigate = (direction: number) => {
    const next = new Date(currentDate);
    if (viewMode === 'year') next.setFullYear(currentDate.getFullYear() + direction);
    else if (viewMode === 'month') next.setMonth(currentDate.getMonth() + direction);
    else if (viewMode === 'week') next.setDate(currentDate.getDate() + (direction * 7));
    else next.setDate(currentDate.getDate() + direction);
    setCurrentDate(next);
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
    e.preventDefault(); setDragOverDay(null);
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

  const renderProjectTree = (parentId?: string, level = 0) => {
    return projects.filter(p => p.parentFolderId === parentId).map(p => (
      <TreeNode key={p.id} id={p.id} label={p.name} icon={p.isStrategic ? 'fa-bolt-lightning' : 'fa-folder'} type="folder" level={level} isOpen={expandedNodes[`proj_${p.id}`]} onToggle={() => toggleNode(`proj_${p.id}`)}
        onAdd={(e) => { e.stopPropagation(); const t = prompt('Назва:'); if(t) addTask(t, 'unsorted', p.id); }}
        onEdit={(e) => { e.stopPropagation(); const n = prompt('Нова назва:', p.name); if(n) updateProject({...p, name: n}); }}
        onDelete={(e) => { e.stopPropagation(); if(confirm('Видалити?')) deleteProject(p.id); }}>
        {renderProjectTree(p.id, level + 1)}
        {tasks.filter(t => t.projectId === p.id && !t.scheduledDate && !t.isDeleted).map(t => (
          <TreeNode key={t.id} id={t.id} label={t.title} icon={t.category === 'note' ? 'fa-note-sticky' : 'fa-file-lines'} type={t.category === 'note' ? 'note' : 'task'} level={level + 1} onClick={() => setSelectedTaskId(t.id)} isDraggable onDragStart={(e) => onDragStart(e, t.id)}
            onEdit={(e) => { e.stopPropagation(); setSelectedTaskId(t.id); }} onDelete={(e) => { e.stopPropagation(); deleteTask(t.id); }} />
        ))}
      </TreeNode>
    ));
  };

  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({ 'root_inbox': true, 'root_next': true, 'root_projects': true });
  const toggleNode = (nodeId: string) => setExpandedNodes(prev => ({ ...prev, [nodeId]: !prev[nodeId] }));

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
                    <TreeNode key={t.id} id={t.id} label={t.title} icon={t.category === 'note' ? 'fa-note-sticky' : 'fa-file-lines'} type={t.category === 'note' ? 'note' : 'task'} level={1} onClick={() => setSelectedTaskId(t.id)} isDraggable onDragStart={(e) => onDragStart(e, t.id)} onEdit={() => setSelectedTaskId(t.id)} onDelete={() => deleteTask(t.id)} />
                  ))}
                </TreeNode>
              ))}
           </TreeNode>
           <TreeNode id="root_next" label="НАСТУПНІ ДІЇ" icon="fa-bolt" type="folder" level={-1} isOpen={expandedNodes['root_next']} onToggle={() => toggleNode('root_next')}>
              {tasks.filter(t => t.status === TaskStatus.NEXT_ACTION && !t.scheduledDate && !t.isDeleted).map(t => (
                <TreeNode key={t.id} id={t.id} label={t.title} icon={t.category === 'note' ? 'fa-note-sticky' : 'fa-file-bolt'} type={t.category === 'note' ? 'note' : 'task'} level={0} onClick={() => setSelectedTaskId(t.id)} isDraggable onDragStart={(e) => onDragStart(e, t.id)} onEdit={() => setSelectedTaskId(t.id)} onDelete={() => deleteTask(t.id)} />
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
              <button onClick={() => { setCurrentDate(new Date()); if(viewMode==='year') setViewMode('month'); }} className="px-3 text-[9px] font-black uppercase text-slate-500 hover:text-orange-600 border-x border-slate-200 transition-colors">Сьогодні</button>
              <button onClick={() => navigate(1)} className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-orange-600 transition-colors"><i className="fa-solid fa-chevron-right text-[10px]"></i></button>
            </div>
          </div>
          <div className="flex bg-slate-100 rounded-xl p-0.5">
            {(['day', 'week', 'month', 'year'] as ViewMode[]).map(mode => (
              <button key={mode} onClick={() => setViewMode(mode)} className={`px-4 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${viewMode === mode ? 'bg-white shadow-sm text-orange-600' : 'text-slate-400 hover:text-slate-600'}`}>{mode === 'day' ? 'День' : mode === 'week' ? 'Тиж' : mode === 'month' ? 'Міс' : 'Рік'}</button>
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
                       {tasks.filter(t => t.scheduledDate === new Date(currentDate).setHours(0,0,0,0) && !t.isDeleted).map(t => (
                         <div key={t.id} onClick={() => setSelectedTaskId(t.id)} className="flex items-center gap-4 p-4 bg-slate-50 rounded-3xl hover:bg-orange-50 transition-all cursor-pointer group">
                           <button onClick={(e) => { e.stopPropagation(); toggleTaskStatus(t); }} className={`w-6 h-6 rounded-xl border-2 flex items-center justify-center transition-all ${t.status === TaskStatus.DONE ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-200 text-transparent group-hover:border-orange-400'}`}>
                             <i className="fa-solid fa-check text-[10px]"></i>
                           </button>
                           <span className={`text-sm font-bold ${t.status === TaskStatus.DONE ? 'line-through text-slate-300' : 'text-slate-700'}`}>{t.title}</span>
                         </div>
                       ))}
                       {tasks.filter(t => t.scheduledDate === new Date(currentDate).setHours(0,0,0,0) && !t.isDeleted).length === 0 && (
                         <div className="py-20 text-center opacity-30 italic text-sm flex flex-col items-center gap-6">
                           <i className="fa-solid fa-mug-hot text-5xl"></i>
                           Жодних запланованих квестів на сьогодні.
                         </div>
                       )}
                    </div>
                  </div>
               </div>

               <div className="w-96 bg-white border border-slate-100 flex flex-col shadow-sm rounded-3xl overflow-hidden relative">
                  <header className="p-4 border-b border-slate-50 flex items-center justify-between shrink-0 bg-white/80 backdrop-blur z-20">
                    <div className="flex flex-col">
                      <Typography variant="tiny" className="text-slate-900 font-black">РОЗПОРЯДОК</Typography>
                      <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Повторюється щотижня</span>
                    </div>
                    <div className="flex gap-2">
                       <div className="relative group/presets">
                          <button className="w-8 h-8 rounded-xl bg-slate-50 text-slate-400 hover:text-orange-500 transition-all flex items-center justify-center shadow-sm">
                            <i className="fa-solid fa-clock-rotate-left text-xs"></i>
                          </button>
                          <div className="absolute right-0 top-full mt-2 w-48 bg-white shadow-2xl rounded-2xl border border-slate-100 p-2 opacity-0 invisible group-hover/presets:opacity-100 group-hover/presets:visible transition-all z-50">
                             <div className="text-[8px] font-black text-slate-300 uppercase p-2 border-b border-slate-50 mb-1">Обрати пресет</div>
                             {routinePresets.map(p => (
                               <button key={p.id} onClick={() => applyRoutinePreset(p.id, dayOfWeek)} className="w-full text-left p-2 rounded-lg text-[10px] font-bold text-slate-600 hover:bg-orange-50 hover:text-orange-600 transition-all truncate">{p.name}</button>
                             ))}
                             {routinePresets.length === 0 && <div className="p-2 text-[8px] text-slate-300 italic">Немає пресетів</div>}
                             <div className="h-px bg-slate-50 my-1"></div>
                             <button onClick={() => { const n = prompt('Назва пресета:'); if(n) saveRoutineAsPreset(n, dayOfWeek); }} className="w-full text-left p-2 rounded-lg text-[10px] font-black text-orange-500 hover:bg-orange-50 transition-all uppercase tracking-tighter">+ Зберегти цей день</button>
                          </div>
                       </div>
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
                       {timeIndicatorTop > 0 && (
                         <div className="absolute left-10 right-0 z-30 flex items-center pointer-none" style={{ top: timeIndicatorTop }}>
                            <div className="w-2 h-2 rounded-full bg-rose-500 -ml-1 shadow-[0_0_8px_rgba(244,63,94,0.5)]"></div>
                            <div className="flex-1 h-0.5 bg-rose-500/50"></div>
                         </div>
                       )}
                       {isSelectedToday && <div className="absolute left-10 right-0 top-0 bg-slate-400/5 pointer-events-none z-10" style={{ height: Math.max(0, timeIndicatorTop) }}></div>}
                       <div className="absolute left-12 right-4 top-0 h-full pointer-events-none">
                          {daySchedule.map(b => {
                            const top = b.startHour * HOUR_HEIGHT;
                            const height = (b.endHour - b.startHour) * HOUR_HEIGHT;
                            const isPast = isSelectedToday && (b.endHour <= currentTime.getHours());
                            const status = blockHistory[dateStr]?.[b.id] || 'pending';
                            
                            return (
                              <div 
                                key={b.id} 
                                onClick={() => setEditingBlock(b)}
                                className={`absolute left-0 right-0 p-3 rounded-2xl border-2 transition-all cursor-pointer pointer-events-auto shadow-sm hover:shadow-md hover:scale-[1.01] z-20 group ${getBlockColor(b.type, isPast)} ${status === 'completed' ? 'border-emerald-400' : status === 'missed' ? 'border-rose-400' : ''}`}
                                style={{ top: top + 4, height: height - 8 }}
                              >
                                <div className="flex justify-between items-start">
                                  <div className="flex flex-col min-w-0">
                                    <span className="text-[10px] font-black uppercase truncate leading-tight">{b.title}</span>
                                    <span className="text-[8px] font-bold opacity-60">{b.startHour}:00 - {b.endHour}:00</span>
                                  </div>
                                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={(e) => { e.stopPropagation(); setBlockStatus(dateStr, b.id, status === 'completed' ? 'pending' : 'completed'); }} className={`w-5 h-5 rounded-lg flex items-center justify-center transition-all bg-white shadow-sm ${status === 'completed' ? 'text-emerald-500' : 'text-slate-300'}`}><i className="fa-solid fa-check text-[8px]"></i></button>
                                    <button onClick={(e) => { e.stopPropagation(); setBlockStatus(dateStr, b.id, status === 'missed' ? 'pending' : 'missed'); }} className={`w-5 h-5 rounded-lg flex items-center justify-center transition-all bg-white shadow-sm ${status === 'missed' ? 'text-rose-500' : 'text-slate-300'}`}><i className="fa-solid fa-xmark text-[8px]"></i></button>
                                  </div>
                                </div>
                                {height > 40 && status === 'pending' && isPast && (
                                  <div className="mt-2 flex items-center gap-1.5 animate-pulse">
                                    <div className="w-1 h-1 rounded-full bg-rose-500"></div>
                                    <span className="text-[7px] font-black uppercase text-rose-500 tracking-tighter">Звітність?</span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                       </div>
                    </div>
                  </div>
               </div>
            </div>
          ) : viewMode === 'week' ? (
            <div className="flex h-full gap-4 overflow-x-auto no-scrollbar pb-4">
              {weekDays.map((day, idx) => {
                const ts = day.getTime();
                const isToday = ts === new Date().setHours(0,0,0,0);
                const dayTasks = tasks.filter(t => !t.isDeleted && t.scheduledDate === ts);
                const isOver = dragOverDay === ts;

                return (
                  <div 
                    key={idx} 
                    onDragOver={(e) => { e.preventDefault(); setDragOverDay(ts); }}
                    onDragLeave={() => setDragOverDay(null)}
                    onDrop={(e) => onDrop(e, ts)}
                    className={`flex-1 min-w-[280px] flex flex-col rounded-[2.5rem] border transition-all ${
                      isToday ? 'bg-orange-50/20 border-orange-200 ring-2 ring-orange-100 shadow-xl' : isOver ? 'bg-orange-100 border-orange-400 scale-[1.02] z-10' : 'bg-slate-100/50 border-slate-200'
                    }`}
                  >
                    <div className={`p-6 border-b flex items-center justify-between ${isToday ? 'bg-orange-100/50 border-orange-200' : 'bg-white/50 border-slate-200'}`}>
                      <div>
                        <div className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isToday ? 'text-orange-600' : 'text-slate-400'}`}>
                          {day.toLocaleString('uk-UA', { weekday: 'long' })}
                        </div>
                        <div className={`text-xl font-black ${isToday ? 'text-orange-700' : 'text-slate-900'}`}>
                          {day.getDate()} {day.toLocaleString('uk-UA', { month: 'short' })}
                        </div>
                      </div>
                      <Badge variant={isToday ? 'orange' : 'slate'} className="font-mono">{dayTasks.length}</Badge>
                    </div>
                    
                    <div className="flex-1 p-4 space-y-3 overflow-y-auto custom-scrollbar">
                      {dayTasks.map(task => (
                        <div 
                          key={task.id}
                          draggable
                          onDragStart={(e) => onDragStart(e, task.id)}
                          onClick={() => setSelectedTaskId(task.id)}
                          className={`group bg-white p-4 rounded-3xl border transition-all cursor-grab active:cursor-grabbing hover:shadow-xl hover:shadow-orange-100/20 ${
                            selectedTaskId === task.id ? 'border-orange-400 shadow-xl' : 'border-slate-100 hover:border-orange-200'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <button 
                              onClick={(e) => { e.stopPropagation(); toggleTaskStatus(task); }}
                              className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-all shrink-0 ${
                                task.status === TaskStatus.DONE ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 bg-white text-transparent hover:border-orange-400'
                              }`}
                            >
                              <i className="fa-solid fa-check text-[8px]"></i>
                            </button>
                            <div className="flex-1 min-w-0">
                              <div className={`text-[11px] font-black leading-tight mb-1 truncate ${task.status === TaskStatus.DONE ? 'text-slate-300 line-through' : 'text-slate-700'}`}>
                                {task.title}
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="slate" className="text-[7px] py-0">{task.xp} XP</Badge>
                                {task.checklist && task.checklist.length > 0 && (
                                  <span className="text-[8px] font-black text-slate-300">
                                    <i className="fa-solid fa-list-check mr-1"></i>
                                    {task.checklist.filter(i => i.completed).length}/{task.checklist.length}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      <button 
                        onClick={() => { const t = prompt('Що плануємо?'); if(t) addTask(t, 'unsorted', undefined, 'actions'); }}
                        className="w-full py-4 rounded-3xl border-2 border-dashed border-slate-200 text-slate-300 hover:border-orange-200 hover:text-orange-400 hover:bg-white transition-all text-[10px] font-black uppercase tracking-widest"
                      >
                        + ДОДАТИ КВЕСТ
                      </button>

                      {dayTasks.length === 0 && (
                        <div className="py-12 text-center opacity-10 flex flex-col items-center gap-3">
                          <i className="fa-solid fa-mountain-sun text-4xl"></i>
                          <span className="text-[9px] font-black uppercase">Вільний шлях</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
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
                const dayTasksList = tasks.filter(t => !t.isDeleted && t.scheduledDate === ts);
                return (
                  <div key={i} onDragOver={(e) => { e.preventDefault(); setDragOverDay(ts); }} onDragLeave={() => setDragOverDay(null)} onDrop={(e) => onDrop(e, ts)} onClick={() => { setCurrentDate(date); setViewMode('day'); }}
                    className={`min-h-[110px] p-2 flex flex-col transition-all relative cursor-pointer ${isCurrentMonth ? 'bg-white' : 'bg-slate-50/50'} ${dragOverDay === ts ? 'bg-orange-50 ring-2 ring-orange-200 z-10' : ''} hover:bg-slate-50`}>
                    <span className={`text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-lg ${isTodayCell ? 'bg-orange-600 text-white shadow-lg' : isCurrentMonth ? 'text-slate-900' : 'text-slate-300'}`}>{date.getDate()}</span>
                    <div className="flex-1 space-y-0.5 mt-1 overflow-hidden">
                      {dayTasksList.slice(0, 3).map(t => (
                        <div key={t.id} className="text-[9px] font-bold truncate bg-orange-50/50 px-1.5 py-0.5 rounded border border-orange-100/30 text-slate-600">{t.title}</div>
                      ))}
                      {dayTasksList.length > 3 && <div className="text-[7px] font-black text-orange-500 uppercase px-1">+{dayTasksList.length - 3}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6 pb-10">
              {Array.from({ length: 12 }, (_, monthIdx) => {
                const monthDate = new Date(currentDate.getFullYear(), monthIdx, 1);
                const monthName = monthDate.toLocaleString('uk-UA', { month: 'long' });
                const daysInMonth = new Date(currentDate.getFullYear(), monthIdx + 1, 0).getDate();
                const firstDay = (new Date(currentDate.getFullYear(), monthIdx, 1).getDay() + 6) % 7;
                return (
                  <Card key={monthIdx} padding="sm" className="bg-white border-slate-100 hover:shadow-lg transition-all cursor-default group">
                    <Typography variant="tiny" className="text-center mb-2 font-black text-orange-500 group-hover:text-orange-600 transition-colors uppercase tracking-widest">{monthName}</Typography>
                    <div className="grid grid-cols-7 gap-0.5 text-[8px] text-center font-bold text-slate-300 mb-1">
                      {['П', 'В', 'С', 'Ч', 'П', 'С', 'Н'].map(d => <div key={d}>{d}</div>)}
                    </div>
                    <div className="grid grid-cols-7 gap-0.5">
                      {Array.from({ length: 42 }, (_, i) => {
                        const dayNum = i - firstDay + 1;
                        const isValid = dayNum > 0 && dayNum <= daysInMonth;
                        const isDayToday = isValid && new Date(currentDate.getFullYear(), monthIdx, dayNum).toDateString() === new Date().toDateString();
                        return (
                          <div key={i} onClick={() => isValid && (setCurrentDate(new Date(currentDate.getFullYear(), monthIdx, dayNum)), setViewMode('day'))} className={`aspect-square flex items-center justify-center rounded-md text-[9px] font-bold transition-all ${isValid ? 'cursor-pointer hover:bg-orange-50 hover:text-orange-600 text-slate-600' : 'opacity-0'} ${isDayToday ? 'bg-orange-600 text-white shadow-sm' : ''}`}>
                            {isValid ? dayNum : ''}
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {editingBlock && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 tiktok-blur">
          <div className="absolute inset-0 bg-slate-900/20" onClick={() => setEditingBlock(null)}></div>
          <Card className="w-full max-w-md relative z-10 shadow-2xl p-8 rounded-[2.5rem] border-none animate-in zoom-in-95 duration-200">
             <div className="flex justify-between items-center mb-8">
                <Typography variant="h2" className="text-xl">Редагування блоку</Typography>
                <button onClick={() => setEditingBlock(null)} className="text-slate-300 hover:text-rose-500"><i className="fa-solid fa-xmark"></i></button>
             </div>
             <form onSubmit={handleSaveBlock} className="space-y-6">
                <div>
                   <label className="text-[9px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Назва активності</label>
                   <input autoFocus value={editingBlock.title} onChange={e => setEditingBlock({...editingBlock, title: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-4 focus:ring-orange-100 outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="text-[9px] font-black uppercase text-slate-400 mb-2 block">Початок (год)</label>
                      <input type="number" min="0" max="23" value={editingBlock.startHour} onChange={e => setEditingBlock({...editingBlock, startHour: parseInt(e.target.value)})} className="w-full bg-slate-50 border-none rounded-2xl px-5 py-3 text-sm font-bold" />
                   </div>
                   <div>
                      <label className="text-[9px] font-black uppercase text-slate-400 mb-2 block">Кінець (год)</label>
                      <input type="number" min="0" max="24" value={editingBlock.endHour} onChange={e => setEditingBlock({...editingBlock, endHour: parseInt(e.target.value)})} className="w-full bg-slate-50 border-none rounded-2xl px-5 py-3 text-sm font-bold" />
                   </div>
                </div>
                <div>
                   <label className="text-[9px] font-black uppercase text-slate-400 mb-2 block">Тип активності</label>
                   <div className="flex flex-wrap gap-2">
                      {['work', 'study', 'rest', 'routine'].map(t => (
                        <button type="button" key={t} onClick={() => setEditingBlock({...editingBlock, type: t as any})} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${editingBlock.type === t ? 'bg-orange-600 text-white border-orange-600 shadow-lg' : 'bg-white text-slate-400 border-slate-100 hover:bg-slate-50'}`}>{t}</button>
                      ))}
                   </div>
                </div>
                <div className="pt-4 flex gap-3">
                   <button type="button" onClick={() => { if(editingBlock.id !== 'new') deleteTimeBlock(editingBlock.id); setEditingBlock(null); }} className="flex-1 py-4 text-[10px] font-black uppercase text-rose-500 hover:bg-rose-50 rounded-2xl transition-all">Видалити</button>
                   <Button type="submit" className="flex-[2] rounded-2xl py-4 shadow-orange-100">ЗБЕРЕГТИ</Button>
                </div>
             </form>
          </Card>
        </div>
      )}

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
