
import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useApp } from '../../contexts/AppContext';
import { TaskStatus, TimeBlock } from '../../types';
import Typography from '../ui/Typography';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

interface DayViewProps {
  currentDate: Date;
  onSelectTask: (id: string) => void;
  onAddQuickEvent: (timestamp: number) => void;
  onShowScheduleMobile?: () => void;
}

const HOUR_HEIGHT = 64;

const TimeBlockModal: React.FC<{
  block?: Partial<TimeBlock>;
  onClose: () => void;
  onSave: (block: Omit<TimeBlock, 'id'>) => void;
}> = ({ block, onClose, onSave }) => {
  const [title, setTitle] = useState(block?.title || '');
  const [start, setStart] = useState(block?.startHour || 9);
  const [end, setEnd] = useState(block?.endHour || 10);
  const [color, setColor] = useState(block?.color || 'var(--primary)');

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 tiktok-blur">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-[var(--bg-card)] w-full max-w-sm rounded-[2rem] p-6 md:p-8 shadow-2xl relative animate-in zoom-in-95 duration-200 border border-[var(--border-color)]">
        <Typography variant="h2" className="mb-6 text-xl">Налаштувати блок</Typography>
        <div className="space-y-6">
          <div>
            <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block tracking-widest">Дія або Рутина</label>
            <input autoFocus value={title} onChange={e => setTitle(e.target.value)} placeholder="Напр: Глибока робота" className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-2xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-[var(--primary)]/20 outline-none text-[var(--text-main)]" />
          </div>
          
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block tracking-widest">Початок</label>
              <input type="number" min="0" max="23" value={start} onChange={e => setStart(parseInt(e.target.value))} className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-2xl py-3 px-4 text-sm font-bold text-[var(--text-main)]" />
            </div>
            <div className="flex-1">
              <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block tracking-widest">Кінець</label>
              <input type="number" min="1" max="24" value={end} onChange={e => setEnd(parseInt(e.target.value))} className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-2xl py-3 px-4 text-sm font-bold text-[var(--text-main)]" />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block tracking-widest">Колір</label>
            <div className="flex flex-wrap gap-2">
              {['var(--primary)', '#10b981', '#6366f1', '#ec4899', '#facc15'].map(c => (
                <button key={c} onClick={() => setColor(c)} className={`w-8 h-8 rounded-full border-2 transition-all ${color === c ? 'border-[var(--text-main)] scale-110 shadow-md' : 'border-transparent opacity-60'}`} style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
          
          <div className="flex gap-3 pt-4">
            <Button variant="white" className="flex-1 py-3" onClick={onClose}>СКАСУВАТИ</Button>
            <Button variant="primary" className="flex-[2] py-3" onClick={() => onSave({ title, startHour: start, endHour: end, type: 'work', color })}>ЗБЕРЕГТИ</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * COMPONENT: DaySchedule
 * Винесено в окремий компонент для використання в сайдбарі
 */
export const DaySchedule: React.FC<{ currentDate: Date; onBack?: () => void; isMobile?: boolean }> = ({ currentDate, onBack, isMobile }) => {
  const { timeBlocks, addTimeBlock, updateTimeBlock, deleteTimeBlock, routinePresets, applyRoutinePreset, saveRoutineAsPreset } = useApp();
  const [showBlockModal, setShowBlockModal] = useState<Partial<TimeBlock> | null>(null);
  const [showPresets, setShowPresets] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null);
  const scheduleScrollRef = useRef<HTMLDivElement>(null);

  // Оновлення часу кожну хвилину
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // АВТО-СКРОЛ до поточного часу
  useEffect(() => {
    if (scheduleScrollRef.current) {
      const isToday = currentDate.toDateString() === new Date().toDateString();
      const targetHour = isToday ? new Date().getHours() : 9; // Для інших днів скролимо до ранку
      
      // Розраховуємо позицію: година * висоту - трохи зверху
      const scrollPos = (targetHour * HOUR_HEIGHT) - 100;
      
      scheduleScrollRef.current.scrollTo({
        top: Math.max(0, scrollPos),
        behavior: 'smooth'
      });
    }
  }, [currentDate]);

  const dayOfWeek = (currentDate.getDay());
  const relevantBlocks = useMemo(() => timeBlocks.filter(b => b.dayOfWeek === dayOfWeek), [timeBlocks, dayOfWeek]);
  const timeIndicatorPos = (currentTime.getHours() + currentTime.getMinutes() / 60) * HOUR_HEIGHT;
  const isToday = currentDate.toDateString() === new Date().toDateString();

  // DRAG AND DROP HANDLERS
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedBlockId(id);
    e.dataTransfer.setData('timeBlockId', id);
    e.dataTransfer.effectAllowed = 'move';
    
    const target = e.currentTarget as HTMLElement;
    setTimeout(() => {
      target.style.opacity = '0.5';
    }, 0);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedBlockId(null);
    const target = e.currentTarget as HTMLElement;
    target.style.opacity = '1';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const blockId = e.dataTransfer.getData('timeBlockId');
    if (!blockId) return;

    const container = e.currentTarget as HTMLElement;
    const rect = container.getBoundingClientRect();
    const y = e.clientY - rect.top + container.scrollTop;
    
    const newStartHour = Math.max(0, Math.min(23, Math.floor(y / HOUR_HEIGHT)));
    
    const block = timeBlocks.find(b => b.id === blockId);
    if (block) {
      const duration = block.endHour - block.startHour;
      const newEndHour = Math.min(24, newStartHour + duration);
      
      updateTimeBlock({
        ...block,
        startHour: newStartHour,
        endHour: newEndHour
      });
    }
  };

  return (
    <div className="flex flex-col h-full bg-[var(--bg-card)]">
      <header className="p-4 md:p-6 border-b border-[var(--border-color)] flex items-center justify-between shrink-0 bg-[var(--bg-card)]/80 backdrop-blur z-20">
         <div className="flex items-center gap-3">
           {isMobile && onBack && (
             <button onClick={onBack} className="w-9 h-9 rounded-xl bg-[var(--bg-main)] flex items-center justify-center text-[var(--text-muted)]">
               <i className="fa-solid fa-chevron-left"></i>
             </button>
           )}
           <div className="flex flex-col">
             <Typography variant="tiny" className="text-[var(--text-main)] font-black mb-0.5 text-[10px] tracking-widest uppercase">РОЗПОРЯДОК</Typography>
             <div className="flex items-center gap-2">
               <button onClick={() => setShowPresets(true)} className="text-[7px] font-black text-[var(--primary)] uppercase tracking-widest hover:underline">Пресет</button>
               <button onClick={() => { const n = prompt('Назва пресету:'); if(n) saveRoutineAsPreset(n, dayOfWeek); }} className="text-[7px] font-black text-[var(--text-muted)] uppercase tracking-widest hover:text-[var(--primary)]">Зберегти</button>
             </div>
           </div>
         </div>
         <button onClick={() => setShowBlockModal({ dayOfWeek })} className="w-9 h-9 rounded-xl bg-[var(--text-main)] text-[var(--bg-main)] hover:opacity-90 shadow-lg transition-all flex items-center justify-center">
            <i className="fa-solid fa-plus text-xs"></i>
         </button>
      </header>

      <div ref={scheduleScrollRef} className="flex-1 overflow-y-auto custom-scrollbar relative bg-[var(--bg-main)]/10 scroll-smooth">
         <div 
          className="absolute left-0 top-0 w-full" 
          style={{ height: 24 * HOUR_HEIGHT }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
         >
            {Array.from({ length: 24 }, (_, i) => (
              <div key={i} className="flex items-start border-t border-[var(--border-color)]/30" style={{ height: HOUR_HEIGHT }}>
                <span className="text-[9px] font-black text-[var(--text-muted)] opacity-30 p-2 w-12 text-right tabular-nums">{i}:00</span>
                <div className="flex-1 h-full border-l border-[var(--border-color)]/20 ml-1"></div>
              </div>
            ))}

            {relevantBlocks.map(block => (
              <div 
                key={block.id} 
                draggable
                onDragStart={(e) => handleDragStart(e, block.id)}
                onDragEnd={handleDragEnd}
                onClick={() => setShowBlockModal(block)}
                className={`absolute left-14 right-4 rounded-2xl p-3 text-white text-[11px] font-black shadow-xl shadow-black/5 cursor-grab active:cursor-grabbing hover:brightness-110 transition-all group overflow-hidden border-2 border-white/10 ${draggedBlockId === block.id ? 'z-50' : 'z-10'}`}
                style={{ 
                  top: block.startHour * HOUR_HEIGHT, 
                  height: (block.endHour - block.startHour) * HOUR_HEIGHT - 4,
                  backgroundColor: block.color || 'var(--primary)'
                }}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="truncate pr-4 uppercase tracking-tighter leading-tight pointer-events-none">{block.title}</span>
                  <i onClick={(e) => { e.stopPropagation(); deleteTimeBlock(block.id); }} className="fa-solid fa-trash-can text-[9px] opacity-0 group-hover:opacity-100 hover:scale-110 transition-all cursor-pointer"></i>
                </div>
                <div className="text-[8px] opacity-70 font-bold tabular-nums pointer-events-none">{block.startHour}:00 - {block.endHour}:00</div>
              </div>
            ))}

            {isToday && (
              <div className="absolute left-0 right-0 z-30 pointer-events-none flex items-center" style={{ top: timeIndicatorPos }}>
                <div className="w-12 text-[8px] font-black text-rose-500 bg-[var(--bg-card)]/90 backdrop-blur rounded-r-lg py-0.5 px-1 shadow-sm border border-rose-100 border-l-0 text-right tabular-nums">
                  {currentTime.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="flex-1 h-0.5 bg-rose-500/40 relative">
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-rose-500 shadow-lg ring-4 ring-rose-500/20"></div>
                </div>
              </div>
            )}
         </div>
      </div>

      {showBlockModal && (
        <TimeBlockModal 
          block={showBlockModal} 
          onClose={() => setShowBlockModal(null)} 
          onSave={(data) => {
            if (showBlockModal.id) updateTimeBlock({ ...data, id: showBlockModal.id } as TimeBlock);
            else addTimeBlock({ ...data, dayOfWeek } as Omit<TimeBlock, 'id'>);
            setShowBlockModal(null);
          }} 
        />
      )}

      {showPresets && (
         <div className="fixed inset-0 z-[310] flex items-center justify-center p-4 tiktok-blur">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowPresets(false)}></div>
            <div className="bg-[var(--bg-card)] w-full max-w-xs rounded-[2rem] p-6 md:p-8 shadow-2xl relative animate-in slide-in-from-bottom-4 duration-300 border border-[var(--border-color)]">
               <Typography variant="h2" className="mb-6 text-lg uppercase font-black">Оберіть пресет</Typography>
               <div className="space-y-2">
                  {routinePresets.map(p => (
                    <button key={p.id} onClick={() => { applyRoutinePreset(p.id, dayOfWeek); setShowPresets(false); }} className="w-full p-4 rounded-2xl border border-[var(--border-color)] hover:border-[var(--primary)]/40 hover:bg-[var(--primary)]/5 text-left transition-all group">
                       <div className="text-xs font-black text-[var(--text-main)] group-hover:text-[var(--primary)] mb-1 uppercase tracking-tight">{p.name}</div>
                       <div className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest opacity-60">{p.blocks.length} блоків</div>
                    </button>
                  ))}
               </div>
               <Button variant="white" className="w-full mt-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest" onClick={() => setShowPresets(false)}>ЗАКРИТИ</Button>
            </div>
         </div>
      )}
    </div>
  );
};

const DayView: React.FC<DayViewProps> = ({ currentDate, onSelectTask, onShowScheduleMobile }) => {
  const { tasks, toggleTaskStatus, people } = useApp();

  const dayTasks = tasks.filter(t => {
    if (t.isDeleted) return false;
    const startTs = t.scheduledDate ? new Date(t.scheduledDate).setHours(0,0,0,0) : null;
    const curTs = new Date(currentDate).setHours(0,0,0,0);
    return startTs === curTs;
  });

  const m = currentDate.getMonth();
  const d = currentDate.getDate();
  const personEvents = useMemo(() => {
    const events: any[] = [];
    people.forEach(p => {
      if (p.birthDate) {
        const bd = new Date(p.birthDate);
        if (bd.getMonth() === m && bd.getDate() === d) events.push({ id: `bd-${p.id}`, title: `🎂 ДН: ${p.name}`, type: 'birthday' });
      }
    });
    return events;
  }, [people, m, d]);

  return (
    <div className="h-full flex flex-col gap-4 overflow-hidden relative">
       <div className="flex-1 flex flex-col gap-4 overflow-y-auto no-scrollbar">
          <div className="bg-[var(--bg-card)] rounded-[2.5rem] shadow-sm border border-[var(--border-color)] overflow-hidden shrink-0">
            <div className="flex items-center justify-between gap-3 p-8 border-b border-[var(--border-color)]/30">
              <div className="min-w-0 flex flex-col">
                <div className="flex items-baseline gap-3 flex-wrap">
                  <Typography variant="h3" className="text-2xl font-black leading-none text-[var(--primary)] uppercase tracking-tight">
                    {currentDate.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' })}
                  </Typography>
                  <Typography variant="caption" className="text-[var(--text-muted)] lowercase text-xs font-bold">
                    {currentDate.toLocaleDateString('uk-UA', { weekday: 'long' })}
                  </Typography>
                </div>
              </div>
              <Badge variant="orange" className="px-4 py-1 rounded-xl uppercase font-black text-[10px] tracking-widest shrink-0 whitespace-nowrap">
                {dayTasks.length} АКТИВНО
              </Badge>
            </div>

            <div className="p-8 space-y-4">
                {personEvents.map(pe => (
                  <div key={pe.id} className="p-5 rounded-3xl border-2 bg-amber-500/5 border-amber-500/20 flex items-center gap-4 animate-in fade-in">
                     <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-white shadow-lg shrink-0">
                        <i className="fa-solid fa-cake-candles"></i>
                     </div>
                     <div className="min-w-0">
                        <div className="text-[12px] font-black uppercase tracking-tight text-amber-800 truncate">{pe.title}</div>
                        <div className="text-[9px] font-bold text-amber-600/60 uppercase">Сьогодні особлива подія</div>
                     </div>
                  </div>
                ))}

                <div className="space-y-3">
                   {dayTasks.map(t => (
                     <div key={t.id} onClick={() => onSelectTask(t.id)} className={`flex items-center gap-5 p-6 rounded-[2.5rem] transition-all cursor-pointer group border ${t.isEvent ? 'bg-[var(--primary)]/5 border-[var(--primary)]/20' : 'bg-[var(--bg-main)]/30 border-[var(--border-color)] hover:border-[var(--primary)]/40 shadow-sm'}`}>
                       <button onClick={(e) => { e.stopPropagation(); toggleTaskStatus(t); }} className={`w-7 h-7 rounded-xl border-2 flex items-center justify-center transition-all shrink-0 ${t.status === TaskStatus.DONE ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-[var(--border-color)] bg-[var(--bg-card)] group-hover:border-[var(--primary)]'}`}>
                         <i className="fa-solid fa-check text-xs"></i>
                       </button>
                       <div className="flex-1 min-w-0 text-left">
                         <span className={`text-[15px] font-black truncate block tracking-tight uppercase ${t.status === TaskStatus.DONE ? 'line-through text-[var(--text-muted)] opacity-50' : 'text-[var(--text-main)]'}`}>{t.title}</span>
                         <div className="flex items-center gap-2 mt-1">
                            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] opacity-60">Quest Log</span>
                         </div>
                       </div>
                       <i className="fa-solid fa-chevron-right text-xs text-[var(--text-muted)] opacity-20 group-hover:translate-x-1 group-hover:opacity-100 transition-all"></i>
                     </div>
                   ))}
                   {dayTasks.length === 0 && personEvents.length === 0 && (
                     <div className="py-32 text-center opacity-10 flex flex-col items-center select-none pointer-events-none grayscale">
                        <i className="fa-solid fa-mountain-sun text-8xl mb-6"></i>
                        <Typography variant="h3" className="text-xl uppercase tracking-[0.3em] font-black">Горизонт чистий</Typography>
                        <p className="text-[10px] font-bold uppercase tracking-widest mt-2">Час для стратегічного планування або відпочинку</p>
                     </div>
                   )}
                </div>
            </div>
          </div>
       </div>

       {/* MOBILE ONLY: Button to open Day Schedule */}
       <button 
         onClick={onShowScheduleMobile}
         className="lg:hidden fixed bottom-24 right-6 w-14 h-14 rounded-full bg-[var(--text-main)] text-[var(--bg-main)] shadow-2xl flex items-center justify-center z-40 hover:scale-110 active:scale-95 transition-all border-4 border-[var(--bg-card)]"
       >
         <i className="fa-solid fa-clock text-xl"></i>
       </button>
    </div>
  );
};

export default DayView;
