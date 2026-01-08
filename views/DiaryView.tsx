import React, { useState, useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { DiaryEntry } from '../types';
import Typography from '../components/ui/Typography';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import DiaryEditor from '../components/DiaryEditor';
import DailyReportWizard from '../components/DailyReportWizard';
import { useResizer } from '../hooks/useResizer';

const DiaryView: React.FC = () => {
  const { diary, deleteDiaryEntry } = useApp();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [showReportWizard, setShowReportWizard] = useState(false);
  const { isResizing, startResizing, detailsWidth } = useResizer(400, 800);

  const sortedDiary = useMemo(() => {
    return [...diary].sort((a, b) => {
      if (b.date !== a.date) return b.date.localeCompare(a.date);
      return b.createdAt - a.createdAt;
    });
  }, [diary]);

  const groupedByMonth = useMemo(() => {
    const groups: Record<string, DiaryEntry[]> = {};
    sortedDiary.forEach(entry => {
      const dateObj = new Date(entry.date);
      if (isNaN(dateObj.getTime())) return;
      const monthStr = dateObj.toLocaleDateString('uk-UA', { month: 'long', year: 'numeric' });
      if (!groups[monthStr]) groups[monthStr] = [];
      groups[monthStr].push(entry);
    });
    return groups;
  }, [sortedDiary]);

  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = (new Date(year, month, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);

    return (
      <div className="bg-white p-3 rounded-[1.5rem] border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <Typography variant="tiny" className="text-slate-900 font-black truncate capitalize text-[9px]">
            {currentMonth.toLocaleString('uk-UA', { month: 'long', year: 'numeric' })}
          </Typography>
          <div className="flex gap-1 shrink-0">
            <button onClick={() => setCurrentMonth(new Date(year, month - 1, 1))} className="w-5 h-5 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors"><i className="fa-solid fa-chevron-left text-[7px]"></i></button>
            <button onClick={() => setCurrentMonth(new Date(year, month + 1, 1))} className="w-5 h-5 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors"><i className="fa-solid fa-chevron-right text-[7px]"></i></button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {['П', 'В', 'С', 'Ч', 'П', 'С', 'Н'].map(w => <div key={w} className="text-[6px] font-black text-slate-300 text-center uppercase">{w}</div>)}
          {days.map((day, i) => {
            if (day === null) return <div key={`empty-${i}`} />;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isSelected = selectedDate === dateStr;
            const hasEntry = diary.some(e => e.date === dateStr);
            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDate(dateStr)}
                className={`h-6 rounded-lg flex items-center justify-center text-[9px] font-bold transition-all relative ${isSelected ? 'bg-orange-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                {day}
                {hasEntry && !isSelected && <div className="absolute bottom-1 w-0.5 h-0.5 bg-orange-400 rounded-full"></div>}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen flex bg-slate-50 overflow-hidden relative">
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        <header className="px-6 py-4 bg-white border-b border-slate-100 z-10 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center shadow-sm">
               <i className="fa-solid fa-book-open"></i>
            </div>
            <div>
              <Typography variant="h1" className="text-xl">Щоденник</Typography>
              <Typography variant="tiny" className="text-orange-500 font-black uppercase tracking-widest text-[8px]">{new Date(selectedDate).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' })}</Typography>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" className="text-[10px] px-4 py-2 font-black uppercase tracking-widest" onClick={() => setShowReportWizard(true)}>ЗВІТ</Button>
            <Button variant="primary" className="text-[10px] px-6 py-2 font-black uppercase tracking-widest shadow-orange-100" onClick={() => { setEditingEntryId('new'); setSelectedDate(new Date().toISOString().split('T')[0]); }}>НОВИЙ</Button>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          <aside className="w-56 p-6 hidden xl:flex flex-col gap-6 border-r border-slate-100 bg-white/50 shrink-0">
            {renderCalendar()}
          </aside>

          <main className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-slate-50/30">
            {/* Вирівнювання по лівому краю без обмеження ширини по центру */}
            <div className="max-w-4xl space-y-4 pb-32">
              {(Object.entries(groupedByMonth) as [string, DiaryEntry[]][]).map(([month, entries]) => (
                <div key={month} className="space-y-2">
                  <div className="sticky top-0 z-10 bg-slate-50/90 backdrop-blur-sm py-2 px-1">
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">{month}</span>
                  </div>
                  {entries.map(entry => {
                    const d = new Date(entry.date);
                    let title = 'Без заголовка';
                    try {
                      const blocks = JSON.parse(entry.content);
                      title = blocks.find((b: any) => b.content.trim() !== '' && b.content !== '<br>')?.content?.replace(/<[^>]*>?/gm, '') || 'Без заголовка';
                    } catch(e) {
                      title = entry.content.split('\n')[0].replace('#', '').trim() || 'Без заголовка';
                    }

                    return (
                      <Card 
                        key={entry.id} 
                        padding="none"
                        hover 
                        onClick={() => {
                          setEditingEntryId(entry.id);
                          setSelectedDate(entry.date);
                        }}
                        className={`bg-white border-slate-100 rounded-[1.5rem] cursor-pointer overflow-hidden group/card transition-all ${editingEntryId === entry.id ? 'ring-2 ring-orange-100 border-orange-200 shadow-lg' : 'shadow-sm'}`}
                      >
                        <div className="flex items-center gap-5 p-4">
                          <div className="w-10 flex flex-col items-center shrink-0 border-r border-slate-50 pr-4">
                             <span className="text-[7px] font-black text-slate-300 uppercase leading-none mb-1">{d.toLocaleString('uk-UA', { weekday: 'short' })}</span>
                             <span className="text-sm font-black text-slate-800 leading-none">{d.getDate()}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-[14px] font-black text-slate-700 truncate block uppercase tracking-tight">
                              {title}
                            </span>
                            <p className="text-[8px] text-slate-300 truncate font-black uppercase tracking-widest mt-0.5">
                              {entry.date}
                            </p>
                          </div>
                          <div className="flex gap-2 opacity-0 group-hover/card:opacity-100 transition-opacity">
                             <button onClick={(e) => { e.stopPropagation(); if(confirm('Видалити цей запис?')) deleteDiaryEntry(entry.id); }} className="w-8 h-8 rounded-xl text-slate-200 hover:text-rose-500 hover:bg-rose-50 flex items-center justify-center transition-all"><i className="fa-solid fa-trash-can text-xs"></i></button>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              ))}
              
              {diary.length === 0 && (
                <div className="flex flex-col items-center justify-center py-32 text-center opacity-10">
                   <i className="fa-solid fa-feather text-6xl mb-4"></i>
                   <Typography variant="h2">Порожній щоденник</Typography>
                   <Typography variant="body" className="mt-2">Твоя історія починається з першого запису.</Typography>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* Editor Panel - Slide-in */}
      <div className={`fixed inset-0 sm:relative sm:inset-auto h-full border-l border-slate-100 bg-white z-[60] transition-all duration-300 ease-in-out ${editingEntryId ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 sm:translate-x-0 sm:hidden'} flex`}>
         <div onMouseDown={startResizing} className={`hidden sm:block w-[1px] h-full cursor-col-resize hover:bg-orange-500 z-[100] transition-colors ${isResizing ? 'bg-orange-500' : 'bg-slate-100'}`}></div>
         <div style={{ width: window.innerWidth < 640 ? '100vw' : detailsWidth }} className="h-full flex flex-col bg-white shadow-2xl sm:shadow-none">
            {editingEntryId ? (
              <DiaryEditor 
                id={editingEntryId === 'new' ? undefined : editingEntryId}
                date={selectedDate} 
                onClose={() => setEditingEntryId(null)} 
              />
            ) : (
              <div className="hidden sm:flex h-full flex-col items-center justify-center p-12 text-center opacity-5 grayscale pointer-events-none select-none">
                 <i className="fa-solid fa-book-open text-8xl mb-8"></i>
                 <Typography variant="tiny" className="text-[14px] font-black uppercase tracking-[0.4em]">Твій Шлях</Typography>
                 <Typography variant="body" className="mt-4 max-w-[200px] text-xs font-bold leading-relaxed">Оберіть запис ліворуч.</Typography>
              </div>
            )}
         </div>
      </div>

      {showReportWizard && (
        <DailyReportWizard onClose={() => setShowReportWizard(false)} />
      )}
    </div>
  );
};

export default DiaryView;