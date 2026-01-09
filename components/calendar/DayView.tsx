
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
  const [color, setColor] = useState(block?.color || '#f97316');

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-white w-full max-w-sm rounded-[2rem] p-8 shadow-2xl relative animate-in zoom-in-95 duration-200">
        <Typography variant="h2" className="mb-6 text-xl">Налаштувати блок</Typography>
        <div className="space-y-6">
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Дія або Рутина</label>
            <input autoFocus value={title} onChange={e => setTitle(e.target.value)} placeholder="Напр: Глибока робота" className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-orange-200 outline-none" />
          </div>
          
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Початок</label>
              <input type="number" min="0" max="23" value={start} onChange={e => setStart(parseInt(e.target.value))} className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 px-4 text-sm font-bold" />
            </div>
            <div className="flex-1">
              <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Кінець</label>
              <input type="number" min="1" max="24" value={end} onChange={e => setEnd(parseInt(e.target.value))} className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 px-4 text-sm font-bold" />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Тип та Колір</label>
            <div className="flex flex-wrap gap-2">
              {[
                { c: '#f97316', l: 'Робота' },
                { c: '#10b981', l: 'Рутина' },
                { c: '#6366f1', l: 'Навчання' },
                { c: '#ec4899', l: 'Відпочинок' },
                { c: '#facc15', l: 'Фокус' }
              ].map(opt => (
                <button 
                  key={opt.c} 
                  onClick={() => setColor(opt.c)} 
                  className={`px-3 py-1.5 rounded-xl border-2 transition-all flex items-center gap-2 ${color === opt.c ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'}`}
                >
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: opt.c }}></div>
                  <span className="text-[9px] font-black uppercase tracking-tight">{opt.l}</span>
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex gap-3 pt-4">
            <Button variant="ghost" className="flex-1 py-3" onClick={onClose}>СКАСУВАТИ</Button>
            <Button variant="primary" className="flex-[2] py-3" onClick={() => onSave({ title, startHour: start, endHour: end, type, color })}>ЗБЕРЕГТИ БЛОК</Button>
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
    const endTs = t.endDate ? new Date(t.endDate).setHours(0,0,0,0) : startTs;
    const curTs = new Date(currentDate).setHours(0,0,0,0);
    if (!startTs) return false;
    return curTs >= startTs && curTs <= (endTs || startTs);
  });

  const m = currentDate.getMonth();
  const d = currentDate.getDate();
  const y = currentDate.getFullYear();
  const personEvents = useMemo(() => {
    const events: any[] = [];
    people.forEach(p => {
      if (p.birthDate && p.birthDateShowInCalendar !== false) {
        const bd = new Date(p.birthDate);
        const matchesMD = bd.getMonth() === m && bd.getDate() === d;
        const matchesY = bd.getFullYear() === y;
        if (matchesMD && (p.birthDateRepeatYearly !== false || matchesY)) {
          events.push({ id: `bd-${p.id}`, title: `ДН: ${p.name}`, type: 'birthday' });
        }
      }
      p.importantDates?.forEach(idate => {
        if (idate.showInCalendar) {
          const id = new Date(idate.date);
          const matchesMD = id.getMonth() === m && id.getDate() === d;
          const matchesY = id.getFullYear() === y;
          if (matchesMD && (idate.repeatYearly || matchesY)) {
            events.push({ id: `id-${idate.id}`, title: `${idate.label}: ${p.name}`, type: 'important' });
          }
        }
      });
    });
    return events;
  }, [people, m, d, y]);

  const dayOfWeek = currentDate.getDay();
  const relevantBlocks = useMemo(() => timeBlocks.filter(b => b.dayOfWeek === dayOfWeek), [timeBlocks, dayOfWeek]);

  const timeIndicatorPos = (currentTime.getHours() + currentTime.getMinutes() / 60) * HOUR_HEIGHT;
  const isToday = currentDate.toDateString() === new Date().toDateString();

  return (
    <div className="flex h-full gap-4">
       <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar pr-2">
          <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-8">
              <div>
                <Typography variant="h3" className="text-slate-900 text-2xl mb-1">{currentDate.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' })}</Typography>
                <Typography variant="caption" className="text-orange-500">{currentDate.toLocaleDateString('uk-UA', { weekday: 'long' })}</Typography>
              </div>
              <Badge variant="orange" className="px-4 py-1.5 rounded-xl">{dayTasks.length} АКТИВНИХ КВЕСТІВ</Badge>
            </div>

            {/* Дати союзників */}
            {personEvents.length > 0 && (
              <div className="mb-8 space-y-3">
                 <Typography variant="tiny" className="text-slate-400 mb-2 uppercase tracking-widest font-black">Події союзників</Typography>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {personEvents.map(pe => (
                      <div key={pe.id} className={`p-5 rounded-[2rem] border-2 flex items-center gap-4 ${pe.type === 'birthday' ? 'bg-amber-50 border-amber-100' : 'bg-indigo-50 border-indigo-100'}`}>
                         <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-lg ${pe.type === 'birthday' ? 'bg-amber-500' : 'bg-indigo-500'}`}>
                            <i className={`fa-solid ${pe.type === 'birthday' ? 'fa-cake-candles' : 'fa-bell'}`}></i>
                         </div>
                         <div className="flex-1">
                            <div className={`text-[11px] font-black uppercase tracking-tight ${pe.type === 'birthday' ? 'text-amber-900' : 'text-indigo-900'}`}>{pe.title}</div>
                            <div className="text-[9px] font-bold opacity-60">Сьогодні важливий день!</div>
                         </div>
                      </div>
                    ))}
                 </div>
              </div>
            )}

            <div className="space-y-3">
               {dayTasks.map(t => (
                 <div key={t.id} onClick={() => onSelectTask(t.id)} className={`flex items-center gap-4 p-5 rounded-[2rem] transition-all cursor-pointer group border ${t.isEvent ? 'bg-pink-50/50 border-pink-100 hover:bg-pink-50' : 'bg-slate-50/50 border-slate-50 hover:bg-orange-50 hover:border-orange-100'}`}>
                   <button onClick={(e) => { e.stopPropagation(); toggleTaskStatus(t); }} className={`w-6 h-6 rounded-xl border-2 flex items-center justify-center transition-all ${t.status === TaskStatus.DONE ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200 bg-white text-transparent group-hover:border-orange-400'}`}>
                     <i className="fa-solid fa-check text-xs"></i>
                   </button>
                   <div className="flex-1 min-w-0">
                     <span className={`text-sm font-bold truncate block ${t.status === TaskStatus.DONE ? 'line-through text-slate-300' : 'text-slate-800'}`}>{t.title}</span>
                     <div className="flex items-center gap-2 mt-1">
                        {t.isEvent ? <Badge variant="rose" className="text-[7px] py-0">Подія</Badge> : <Badge variant="orange" className="text-[7px] py-0">Квест</Badge>}
                        {t.projectId && <span className="text-[8px] font-black text-slate-300 uppercase truncate"># {tasks.find(x => x.id === t.projectId)?.title || 'Проєкт'}</span>}
                     </div>
                   </div>
                   <i className="fa-solid fa-chevron-right text-[10px] text-slate-300 group-hover:translate-x-1 transition-transform"></i>
                 </div>
               ))}
               {dayTasks.length === 0 && personEvents.length === 0 && (
                 <div className="py-20 text-center opacity-20">
                    <i className="fa-solid fa-feather-pointed text-6xl mb-4"></i>
                    <Typography variant="h3">Сьогодні вільний день</Typography>
                 </div>
               )}
            </div>
          </div>
       </div>

       {/* Schedule Column */}
       <div className="w-96 bg-white border border-slate-100 flex flex-col shadow-sm rounded-[2.5rem] overflow-hidden relative">
          <header className="p-6 border-b border-slate-50 flex items-center justify-between shrink-0 bg-white/80 backdrop-blur z-20">
            <div className="flex flex-col">
              <Typography variant="tiny" className="text-slate-900 font-black mb-1">РОЗПОРЯДОК ДНЯ</Typography>
              <div className="flex items-center gap-3">
                <button onClick={() => setShowPresets(!showPresets)} className="text-[7px] font-black text-orange-500 uppercase tracking-widest hover:underline flex items-center gap-1">
                   <i className="fa-solid fa-layer-group"></i> Пресети ({routinePresets.length})
                </button>
                <button onClick={() => { const n = prompt('Назва пресету:'); if(n) saveRoutineAsPreset(n, dayOfWeek); }} className="text-[7px] font-black text-slate-400 uppercase tracking-widest hover:text-orange-500 flex items-center gap-1">
                   <i className="fa-solid fa-save"></i> Зберегти
                </button>
              </div>
            </div>
            <button onClick={() => setShowBlockModal({ dayOfWeek })} className="w-10 h-10 rounded-2xl bg-slate-900 text-white hover:bg-slate-800 shadow-xl transition-all flex items-center justify-center">
               <i className="fa-solid fa-plus text-xs"></i>
            </button>
          </header>

          <div ref={scheduleScrollRef} className="flex-1 overflow-y-auto custom-scrollbar relative bg-slate-50/20">
            <div className="absolute left-0 top-0 w-full" style={{ height: 24 * HOUR_HEIGHT }}>
               {/* Hour Grid */}
               {Array.from({ length: 24 }, (_, i) => (
                 <div key={i} className="flex items-start border-t border-slate-50/50" style={{ height: HOUR_HEIGHT }}>
                   <span className="text-[9px] font-black text-slate-300 p-2 w-12 text-right tabular-nums">{i}:00</span>
                   <div className="flex-1 h-px mt-[1px]"></div>
                 </div>
               ))}

               {/* Time Blocks */}
               {relevantBlocks.map(block => (
                 <div 
                   key={block.id} 
                   onClick={() => setShowBlockModal(block)}
                   className="absolute left-12 right-3 rounded-2xl p-3 text-white text-[11px] font-bold shadow-lg shadow-black/5 cursor-pointer hover:brightness-105 transition-all group overflow-hidden border-2 border-white/10"
                   style={{ 
                     top: block.startHour * HOUR_HEIGHT, 
                     height: (block.endHour - block.startHour) * HOUR_HEIGHT - 4,
                     backgroundColor: block.color || '#f97316'
                   }}
                 >
                   <div className="flex justify-between items-start mb-1">
                     <span className="truncate pr-4 uppercase tracking-tight">{block.title}</span>
                     <i onClick={(e) => { e.stopPropagation(); deleteTimeBlock(block.id); }} className="fa-solid fa-trash-can text-[9px] opacity-0 group-hover:opacity-100 hover:scale-110 transition-all"></i>
                   </div>
                   <div className="text-[9px] opacity-80 font-black tabular-nums">{block.startHour}:00 - {block.endHour}:00</div>
                 </div>
               ))}

               {/* Current Time Indicator */}
               {isToday && (
                 <div 
                   className="absolute left-0 right-0 z-30 pointer-events-none flex items-center" 
                   style={{ top: timeIndicatorPos }}
                 >
                   <div className="w-12 text-[8px] font-black text-pink-500 bg-white/90 backdrop-blur rounded-r-lg py-0.5 px-1.5 shadow-sm border border-pink-100 border-l-0 text-right tabular-nums">
                     {currentTime.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}
                   </div>
                   <div className="flex-1 h-0.5 bg-pink-500/30 relative">
                     <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-pink-500 shadow-lg shadow-pink-200 ring-4 ring-pink-100"></div>
                     <div className="absolute inset-0 bg-pink-500"></div>
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
         <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" onClick={() => setShowPresets(false)}></div>
           <div className="bg-white w-full max-w-xs rounded-[2rem] p-8 shadow-2xl relative animate-in slide-in-from-bottom-4 duration-300">
              <Typography variant="h2" className="mb-6 text-lg">Оберіть пресет</Typography>
              <div className="space-y-3">
                 {routinePresets.map(p => (
                   <button 
                    key={p.id} 
                    onClick={() => { applyRoutinePreset(p.id, dayOfWeek); setShowPresets(false); }} 
                    className="w-full p-4 rounded-2xl border border-slate-100 hover:border-orange-200 hover:bg-orange-50/20 text-left transition-all group"
                   >
                      <div className="text-xs font-black text-slate-800 group-hover:text-orange-600 mb-1">{p.name}</div>
                      <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{p.blocks.length} блоків розкладу</div>
                   </button>
                 ))}
                 {routinePresets.length === 0 && (
                   <div className="text-center py-8">
                      <i className="fa-solid fa-box-open text-slate-200 text-3xl mb-3"></i>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Пресетів не знайдено</p>
                   </div>
                 )}
              </div>
              <Button variant="ghost" className="w-full mt-6 py-3" onClick={() => setShowPresets(false)}>ЗАКРИТИ</Button>
           </div>
         </div>
       )}
    </div>
  );
};

export default DayView;
