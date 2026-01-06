
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { DiaryEntry } from '../types';
import Typography from '../components/ui/Typography';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Card from '../components/ui/Card';
import DiaryEditor from '../components/DiaryEditor';
import DailyReportWizard from '../components/DailyReportWizard';
import { marked } from 'https://esm.sh/marked@12.0.0';

const DiaryView: React.FC = () => {
  const { diary, deleteDiaryEntry } = useApp();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [editingEntryDate, setEditingEntryDate] = useState<string | null>(null);
  const [showReportWizard, setShowReportWizard] = useState(false);

  const sortedDiary = useMemo(() => {
    return [...diary].sort((a, b) => b.date.localeCompare(a.date));
  }, [diary]);

  const groupedByMonth = useMemo(() => {
    const groups: Record<string, DiaryEntry[]> = {};
    sortedDiary.forEach(entry => {
      const monthStr = new Date(entry.date).toLocaleDateString('uk-UA', { month: 'long', year: 'numeric' });
      if (!groups[monthStr]) groups[monthStr] = [];
      groups[monthStr].push(entry);
    });
    return groups;
  }, [sortedDiary]);

  const renderMarkdownPreview = (text: string) => {
    const rawHtml = marked.parse(text || "");
    return { __html: rawHtml };
  };

  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startOffset = firstDay === 0 ? 6 : firstDay - 1;

    const days = [];
    for (let i = 0; i < startOffset; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);

    return (
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/20">
        <div className="flex items-center justify-between mb-6">
          <Typography variant="h3" className="text-sm capitalize font-black">
            {currentMonth.toLocaleString('uk-UA', { month: 'long', year: 'numeric' })}
          </Typography>
          <div className="flex gap-1">
            <button onClick={() => setCurrentMonth(new Date(year, month - 1, 1))} className="w-8 h-8 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors"><i className="fa-solid fa-chevron-left text-[10px]"></i></button>
            <button onClick={() => setCurrentMonth(new Date())} className="px-3 text-[10px] font-black uppercase text-slate-400 hover:text-orange-600 transition-colors">Сьогодні</button>
            <button onClick={() => setCurrentMonth(new Date(year, month + 1, 1))} className="w-8 h-8 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors"><i className="fa-solid fa-chevron-right text-[10px]"></i></button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'].map(w => <div key={w} className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{w}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, i) => {
            if (day === null) return <div key={`empty-${i}`} />;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isSelected = selectedDate === dateStr;
            const hasEntry = diary.some(e => e.date === dateStr);
            const isToday = dateStr === new Date().toISOString().split('T')[0];

            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDate(dateStr)}
                className={`h-9 w-9 rounded-2xl flex items-center justify-center text-[11px] font-bold transition-all relative ${
                  isSelected 
                    ? 'bg-orange-600 text-white shadow-xl shadow-orange-200 scale-110 z-10' 
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {day}
                {hasEntry && !isSelected && <div className="absolute bottom-1 w-1 h-1 bg-orange-400 rounded-full"></div>}
                {isToday && !isSelected && <div className="absolute top-1 right-1 w-1 h-1 bg-pink-500 rounded-full"></div>}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden relative">
      <header className="p-8 bg-white/80 backdrop-blur-xl border-b border-slate-100 z-10 flex justify-between items-end">
        <div>
          <Typography variant="caption" className="text-orange-500 mb-1">Твій шлях у рефлексії</Typography>
          <Typography variant="h1" className="text-slate-900">Щоденник</Typography>
        </div>
        <div className="flex gap-4">
          <Button icon="fa-list-check" variant="secondary" className="rounded-2xl px-6 border-[var(--primary)]/20 text-[var(--primary)]" onClick={() => setShowReportWizard(true)}>ЗВІТ ДНЯ</Button>
          <Button icon="fa-plus" variant="primary" className="rounded-2xl px-10 shadow-orange-200" onClick={() => setEditingEntryDate(selectedDate)}>ЗАПИСАТИ</Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Navigator */}
        <aside className="w-80 p-8 space-y-8 hidden xl:block overflow-y-auto custom-scrollbar">
          {renderCalendar()}
          
          <Card blur padding="sm" className="bg-orange-50/50 border-orange-100">
             <Typography variant="tiny" className="text-orange-600 mb-2">Рефлексія</Typography>
             <p className="text-[10px] font-bold text-slate-600 leading-relaxed">
               Щоденник підтримує **Markdown**. Використовуйте заголовки, списки та цитати для кращого аналізу свого досвіду.
             </p>
          </Card>
        </aside>

        {/* Right: Feed */}
        <main className="flex-1 overflow-y-auto custom-scrollbar p-8">
          <div className="max-w-3xl mx-auto space-y-12 pb-32">
            {Object.keys(groupedByMonth).length > 0 ? Object.entries(groupedByMonth).map(([month, entries]) => (
              <div key={month} className="space-y-6">
                <div className="sticky top-0 z-20 bg-slate-50/90 backdrop-blur-sm py-2 px-4 rounded-xl">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">{month}</span>
                </div>
                
                {entries.map(entry => {
                  const d = new Date(entry.date);
                  const dayNum = d.getDate();
                  const weekday = d.toLocaleString('uk-UA', { weekday: 'short' }).toUpperCase();
                  
                  return (
                    <div 
                      key={entry.id} 
                      className="group flex gap-8 items-start animate-in slide-in-from-bottom-4 duration-500"
                    >
                      <div className="w-16 flex flex-col items-center">
                        <span className="text-[10px] font-black text-slate-300 mb-1 tracking-widest">{weekday}</span>
                        <span className="text-4xl font-black text-slate-900 leading-none">{dayNum}</span>
                        <div className="w-px h-full bg-slate-100 mt-4 group-last:bg-transparent min-h-[4rem]"></div>
                      </div>

                      <Card 
                        padding="lg" 
                        hover 
                        onClick={() => setEditingEntryDate(entry.date)}
                        className="flex-1 bg-white border-slate-100 hover:border-orange-200 cursor-pointer relative overflow-hidden group/card shadow-sm"
                      >
                         <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 opacity-50 group-hover/card:bg-orange-50 transition-all"></div>
                         <div className="relative z-10">
                           <div className="flex justify-between items-start mb-4">
                             <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                               Оновлено {new Date(entry.updatedAt).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}
                             </span>
                             <button 
                               onClick={(e) => { e.stopPropagation(); deleteDiaryEntry(entry.id); }}
                               className="opacity-0 group-hover/card:opacity-100 w-8 h-8 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 flex items-center justify-center transition-all"
                             >
                               <i className="fa-solid fa-trash-can text-[10px]"></i>
                             </button>
                           </div>
                           <div className="diary-preview-content prose prose-slate prose-sm line-clamp-4 overflow-hidden pointer-events-none" dangerouslySetInnerHTML={renderMarkdownPreview(entry.content)}>
                           </div>
                         </div>
                      </Card>
                    </div>
                  );
                })}
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center py-32 text-center opacity-20">
                 <i className="fa-solid fa-feather-pointed text-8xl mb-8"></i>
                 <Typography variant="h2">Тут ще немає спогадів</Typography>
                 <Typography variant="body" className="mt-4">Натисни +, щоб додати перший запис.</Typography>
              </div>
            )}
          </div>
        </main>
      </div>

      {editingEntryDate && (
        <DiaryEditor 
          date={editingEntryDate} 
          onClose={() => setEditingEntryDate(null)} 
        />
      )}

      {showReportWizard && (
        <DailyReportWizard onClose={() => setShowReportWizard(false)} />
      )}
      
      <style>{`
        .diary-preview-content p { margin-bottom: 0.5rem; }
        .diary-preview-content h1, .diary-preview-content h2 { font-size: 1rem; margin-top: 0.5rem; margin-bottom: 0.25rem; }
      `}</style>
    </div>
  );
};

export default DiaryView;
