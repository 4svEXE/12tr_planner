
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
}

const HOUR_HEIGHT = 60;

const TimeBlockModal: React.FC<{
  block?: Partial<TimeBlock>;
  onClose: () => void;
  onSave: (block: Omit<TimeBlock, 'id'>) => void;
}> = ({ block, onClose, onSave }) => {
  const [title, setTitle] = useState(block?.title || '');
  const [start, setStart] = useState(block?.startHour || 9);
  const [end, setEnd] = useState(block?.endHour || 10);
  const [type, setType] = useState<TimeBlock['type']>(block?.type || 'work');
  const [color, setColor] = useState(block?.color || 'var(--primary)');

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 tiktok-blur">
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
            <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block tracking-widest">Тип та Колір</label>
            <div className="flex flex-wrap gap-2">
              {[
                { c: 'var(--primary)', l: 'Робота' },
                { c: '#10b981', l: 'Рутина' },
                { c: '#6366f1', l: 'Навчання' },
                { c: '#ec4899', l: 'Відпочинок' },
                { c: '#facc15', l: 'Фокус' }
              ].map(opt => (
                <button 
                  key={opt.c} 
                  onClick={() => setColor(opt.c)} 
                  className={`px-3 py-1.5 rounded-xl border-2 transition-all flex items-center gap-2 ${color === opt.c ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--text-main)]' : 'border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-muted)] hover:border-[var(--primary)]/20'}`}
                >
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: opt.c }}></div>
                  <span className="text-[9px] font-black uppercase tracking-tight">{opt.l}</span>
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex gap-3 pt-4">
            <Button variant="white" className="flex-1 py-3" onClick={onClose}>СКАСУВАТИ</Button>
            <Button variant="primary" className="flex-[2] py-3" onClick={() => onSave({ title, startHour: start, endHour: end, type, color })}>ЗБЕРЕГТИ</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const DayView: React.FC<DayViewProps> = ({ currentDate, onSelectTask, onAddQuickEvent }) => {
  const { 
    tasks, toggleTaskStatus, timeBlocks, addTimeBlock, updateTimeBlock, deleteTimeBlock, 
    saveRoutineAsPreset, applyRoutinePreset, routinePresets, people 
  } = useApp();
  const scheduleScrollRef = useRef<HTMLDivElement>(null);
  const [showBlockModal, setShowBlockModal] = useState<Partial<TimeBlock> | null>(null);
  const [showPresets, setShowPresets] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (scheduleScrollRef.current) {
      const container = scheduleScrollRef.current;
      const isToday = currentDate.toDateString() === new Date().toDateString();
      const focusHour = isToday ? currentTime.getHours() + currentTime.getMinutes() / 60 : 9;
      const targetScroll = (focusHour * HOUR_HEIGHT) - (container.clientHeight / 2);
      
      setTimeout(() => {
        container.scrollTo({ top: Math.max(0, targetScroll), behavior: 'smooth' });
      }, 100);
    }
  }, [currentDate]);

  const dayTasks = tasks.filter(t => {
    if (t.isDeleted) return false;
    const startTs = t.scheduledDate ? new Date(t.scheduledDate).setHours(0,0,0,0) : null;
    const curTs = new Date(currentDate).setHours(0,0,0,0);
    return startTs === curTs;
  });

  const m = currentDate.getMonth();
  const d = currentDate.getDate();
  const y = currentDate.getFullYear();
  const personEvents = useMemo(() => {
    const events: any[] = [];
    people.forEach(p => {
      if (p.birthDate && p.birthDateShowInCalendar !== false) {
        const bd = new Date(p.birthDate);
        if (bd.getMonth() === m && bd.getDate() === d) {
          events.push({ id: `bd-${p.id}`, title: `🎂 ДН: ${p.name}`, type: 'birthday' });
        }
      }
    });
    return events;
  }, [people, m, d]);

  const dayOfWeek = currentDate.getDay();
  const relevantBlocks = useMemo(() => timeBlocks.filter(b => b.dayOfWeek === dayOfWeek), [timeBlocks, dayOfWeek]);
  const timeIndicatorPos = (currentTime.getHours() + currentTime.getMinutes() / 60) * HOUR_HEIGHT;
  const isToday = currentDate.toDateString() === new Date().toDateString();

  return (
    <div className="flex flex-col lg:flex-row h-full gap-4 md:gap-6">
       <div className="flex-1 space-y-4 overflow-y-auto no-scrollbar">
          <div className="bg-[var(--bg-card)] rounded-2xl md:rounded-[2.5rem] p-5 md:p-10 shadow-sm border border-[var(--border-color)]">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 md:mb-8">
              <div>
                <Typography variant="h3" className="text-xl md:text-2xl mb-1">{currentDate.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' })}</Typography>
                <Typography variant="caption" className="text-[var(--primary)]">{currentDate.toLocaleDateString('uk-UA', { weekday: 'long' })}</Typography>
              </div>
              <Badge variant="orange" className="px-4 py-1.5 rounded-xl uppercase font-black text-[8px] md:text-[10px] tracking-widest">{dayTasks.length} АКТИВНИХ КВЕСТІВ</Badge>
            </div>

            {personEvents.length > 0 && (
              <div className="mb-6 md:mb-8 space-y-3">
                 <Typography variant="tiny" className="text-[var(--text-muted)] mb-2 uppercase tracking-widest font-black text-[8px]">Події союзників</Typography>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {personEvents.map(pe => (
                      <div key={pe.id} className="p-4 md:p-5 rounded-2xl md:rounded-[2rem] border-2 bg-amber-500/5 border-amber-500/20 flex items-center gap-3 md:gap-4">
                         <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-white shadow-lg shrink-0">
                            <i className="fa-solid fa-cake-candles"></i>
                         </div>
                         <div className="min-w-0">
                            <div className="text-[10px] md:text-[11px] font-black uppercase tracking-tight text-amber-700 truncate">{pe.title}</div>
                            <div className="text-[8px] md:text-[9px] font-bold text-amber-600/60">Важлива подія сьогодні!</div>
                         </div>
                      </div>
                    ))}
                 </div>
              </div>
            )}

            <div className="space-y-2 md:space-y-3">
               {dayTasks.map(t => (
                 <div key={t.id} onClick={() => onSelectTask(t.id)} className={`flex items-center gap-3 md:gap-4 p-4 md:p-5 rounded-xl md:rounded-[2rem] transition-all cursor-pointer group border ${t.isEvent ? 'bg-[var(--primary)]/5 border-[var(--primary)]/20' : 'bg-[var(--bg-main)]/30 border-[var(--border-color)] hover:border-[var(--primary)]/40 shadow-sm'}`}>
                   <button onClick={(e) => { e.stopPropagation(); toggleTaskStatus(t); }} className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all shrink-0 ${t.status === TaskStatus.DONE ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-[var(--border-color)] bg-[var(--bg-card)] text-transparent group-hover:border-[var(--primary)]'}`}>
                     <i className="fa-solid fa-check text-xs"></i>
                   </button>
                   <div className="flex-1 min-w-0">
                     <span className={`text-[13px] md:text-sm font-bold truncate block ${t.status === TaskStatus.DONE ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text-main)]'}`}>{t.title}</span>
                     <div className="flex items-center gap-2 mt-1">
                        <Badge variant={t.isEvent ? "rose" : "slate"} className="text-[7px] md:text-[8px] py-0 px-1.5">{t.isEvent ? 'Подія' : 'Квест'}</Badge>
                     </div>
                   </div>
                   <i className="fa-solid fa-chevron-right text-[10px] text-[var(--text-muted)] opacity-30 group-hover:translate-x-1 group-hover:opacity-100 transition-all"></i>
                 </div>
               ))}
               {dayTasks.length === 0 && personEvents.length === 0 && (
                 <div className="py-12 md:py-20 text-center opacity-10 flex flex-col items-center">
                    <i className="fa-solid fa-mountain-sun text-5xl md:text-6xl mb-4"></i>
                    <Typography variant="h3" className="text-base uppercase tracking-[0.2em]">Вільний горизонт</Typography>
                 </div>
               )}
            </div>
          </div>
       </div>

       {/* Schedule Column */}
       <div className="w-full lg:w-96 bg-[var(--bg-card)] border border-[var(--border-color)] flex flex-col shadow-sm rounded-2xl md:rounded-[2.5rem] overflow-hidden relative min-h-[400px]">
          <header className="p-4 md:p-6 border-b border-[var(--border-color)] flex items-center justify-between shrink-0 bg-[var(--bg-card)]/80 backdrop-blur z-20">
            <div className="flex flex-col">
              <Typography variant="tiny" className="text-[var(--text-main)] font-black mb-1 text-[8px] md:text-[10px]">РОЗПОРЯДОК</Typography>
              <div className="flex items-center gap-3">
                <button onClick={() => setShowPresets(!showPresets)} className="text-[7px] font-black text-[var(--primary)] uppercase tracking-widest hover:underline">
                   ПРЕСЕТИ ({routinePresets.length})
                </button>
                <button onClick={() => { const n = prompt('Назва пресету:'); if(n) saveRoutineAsPreset(n, dayOfWeek); }} className="text-[7px] font-black text-[var(--text-muted)] uppercase tracking-widest hover:text-[var(--primary)]">
                   ЗБЕРЕГТИ
                </button>
              </div>
            </div>
            <button onClick={() => setShowBlockModal({ dayOfWeek })} className="w-10 h-10 rounded-xl bg-[var(--text-main)] text-[var(--bg-main)] hover:opacity-90 shadow-xl transition-all flex items-center justify-center">
               <i className="fa-solid fa-plus text-xs"></i>
            </button>
          </header>

          <div ref={scheduleScrollRef} className="flex-1 overflow-y-auto custom-scrollbar relative bg-[var(--bg-main)]/20">
            <div className="absolute left-0 top-0 w-full" style={{ height: 24 * HOUR_HEIGHT }}>
               {Array.from({ length: 24 }, (_, i) => (
                 <div key={i} className="flex items-start border-t border-[var(--border-color)]/30" style={{ height: HOUR_HEIGHT }}>
                   <span className="text-[9px] font-black text-[var(--text-muted)] opacity-30 p-2 w-10 md:w-12 text-right tabular-nums">{i}:00</span>
                   <div className="flex-1 h-px mt-[1px]"></div>
                 </div>
               ))}

               {relevantBlocks.map(block => (
                 <div 
                   key={block.id} 
                   onClick={() => setShowBlockModal(block)}
                   className="absolute left-10 md:left-12 right-2 md:right-3 rounded-xl md:rounded-2xl p-2 md:p-3 text-white text-[10px] md:text-[11px] font-bold shadow-lg shadow-black/5 cursor-pointer hover:brightness-105 transition-all group overflow-hidden border-2 border-white/10"
                   style={{ 
                     top: block.startHour * HOUR_HEIGHT, 
                     height: (block.endHour - block.startHour) * HOUR_HEIGHT - 4,
                     backgroundColor: block.color || 'var(--primary)'
                   }}
                 >
                   <div className="flex justify-between items-start">
                     <span className="truncate pr-4 uppercase tracking-tight leading-tight">{block.title}</span>
                     <i onClick={(e) => { e.stopPropagation(); deleteTimeBlock(block.id); }} className="fa-solid fa-trash-can text-[9px] opacity-0 group-hover:opacity-100 hover:scale-110 transition-all"></i>
                   </div>
                   <div className="text-[8px] md:text-[9px] opacity-70 font-black tabular-nums mt-1">{block.startHour}:00 - {block.endHour}:00</div>
                 </div>
               ))}

               {isToday && (
                 <div 
                   className="absolute left-0 right-0 z-30 pointer-events-none flex items-center" 
                   style={{ top: timeIndicatorPos }}
                 >
                   <div className="w-10 md:w-12 text-[7px] md:text-[8px] font-black text-rose-500 bg-[var(--bg-card)]/90 backdrop-blur rounded-r-lg py-0.5 px-1 shadow-sm border border-rose-100 border-l-0 text-right tabular-nums">
                     {currentTime.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}
                   </div>
                   <div className="flex-1 h-0.5 bg-rose-500/30 relative">
                     <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-rose-500 shadow-lg ring-4 ring-rose-100"></div>
                   </div>
                 </div>
               )}
            </div>
          </div>
       </div>

       {showBlockModal && (
         <TimeBlockModal 
           block={showBlockModal} 
           onClose={() => setShowBlockModal(null)} 
           onSave={(data) => {
             if (showBlockModal.id) {
               updateTimeBlock({ ...data, id: showBlockModal.id } as TimeBlock);
             } else {
               addTimeBlock({ ...data, dayOfWeek } as Omit<TimeBlock, 'id'>);
             }
             setShowBlockModal(null);
           }} 
         />
       )}

       {showPresets && (
         <div className="fixed inset-0 z-[310] flex items-center justify-center p-4 tiktok-blur">
           <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowPresets(false)}></div>
           <div className="bg-[var(--bg-card)] w-full max-w-xs rounded-[2rem] p-6 md:p-8 shadow-2xl relative animate-in slide-in-from-bottom-4 duration-300 border border-[var(--border-color)]">
              <Typography variant="h2" className="mb-6 text-lg">Оберіть пресет</Typography>
              <div className="space-y-2">
                 {routinePresets.map(p => (
                   <button 
                    key={p.id} 
                    onClick={() => { applyRoutinePreset(p.id, dayOfWeek); setShowPresets(false); }} 
                    className="w-full p-4 rounded-2xl border border-[var(--border-color)] hover:border-[var(--primary)]/40 hover:bg-[var(--primary)]/5 text-left transition-all group"
                   >
                      <div className="text-xs font-black text-[var(--text-main)] group-hover:text-[var(--primary)] mb-1 uppercase tracking-tight">{p.name}</div>
                      <div className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest opacity-60">{p.blocks.length} блоків</div>
                   </button>
                 ))}
                 {routinePresets.length === 0 && (
                   <div className="text-center py-8 opacity-20">
                      <i className="fa-solid fa-box-open text-3xl mb-2"></i>
                      <p className="text-[9px] font-black uppercase tracking-widest">Пресетів нема</p>
                   </div>
                 )}
              </div>
              <Button variant="white" className="w-full mt-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest" onClick={() => setShowPresets(false)}>ЗАКРИТИ</Button>
           </div>
         </div>
       )}
    </div>
  );
};

export default DayView;
