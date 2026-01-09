
import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { DiaryEntry, TaskStatus } from '../types';
import Typography from '../components/ui/Typography';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import DiaryEditor from '../components/DiaryEditor';
import DailyReportWizard from '../components/DailyReportWizard';
import { useResizer } from '../hooks/useResizer';

const DiaryView: React.FC = () => {
  const { diary, tasks, people, deleteDiaryEntry } = useApp();
  const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [showReportWizard, setShowReportWizard] = useState(false);
  const [isCalendarExpanded, setIsCalendarExpanded] = useState(false);
  const [mobileTab, setMobileTab] = useState<'list' | 'stats'>('list');
  const { isResizing, startResizing, detailsWidth } = useResizer(400, 800);

  const isMobile = window.innerWidth < 1024;

  const sortedDiary = useMemo(() => {
    return [...diary].sort((a, b) => {
      if (b.date !== a.date) return b.date.localeCompare(a.date);
      return b.createdAt - a.createdAt;
    });
  }, [diary]);

  const groupedByMonth = useMemo(() => {
    const groups: Record<string, DiaryEntry[]> = {};
    sortedDiary.forEach(entry => {
      const dateParts = entry.date.split('-').map(Number);
      const dateObj = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
      if (isNaN(dateObj.getTime())) return;
      const monthStr = dateObj.toLocaleDateString('uk-UA', { month: 'long', year: 'numeric' });
      if (!groups[monthStr]) groups[monthStr] = [];
      groups[monthStr].push(entry);
    });
    return groups;
  }, [sortedDiary]);

  const memoriesFromPast = useMemo(() => {
    const target = new Date(selectedDate);
    const day = target.getDate();
    const month = target.getMonth();
    
    return diary.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate.getDate() === day && 
             entryDate.getMonth() === month && 
             entryDate.getFullYear() < target.getFullYear();
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [diary, selectedDate]);

  const renderCalendar = (isMobileCalendar = false) => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const getMonthDays = () => {
      const firstDay = (new Date(year, month, 1).getDay() + 6) % 7;
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const days: (Date | null)[] = [];
      for (let i = 0; i < firstDay; i++) days.push(null);
      for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
      while (days.length % 7 !== 0) days.push(null);
      return days;
    };

    const getWeekDays = () => {
      const start = new Date(currentMonth);
      const day = start.getDay();
      const diff = start.getDate() - day + (day === 0 ? -6 : 1); 
      const monday = new Date(start.setDate(diff));
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        return d;
      });
    };

    const isMinimized = isMobileCalendar && !isCalendarExpanded;
    const daysToRender = isMinimized ? getWeekDays() : getMonthDays();

    return (
      <div className={`bg-white p-4 md:p-5 rounded-[2rem] border border-slate-100 shadow-sm transition-all duration-300 ${isMobileCalendar ? 'mb-4' : ''}`}>
        <div className="flex items-center justify-between mb-4">
          <button 
            onClick={() => isMobileCalendar && setIsCalendarExpanded(!isCalendarExpanded)}
            className="flex items-center gap-2 text-left"
          >
            <Typography variant="tiny" className="text-slate-900 font-black capitalize text-[10px] tracking-wider">
              {currentMonth.toLocaleString('uk-UA', { month: 'long', year: 'numeric' })}
            </Typography>
            {isMobileCalendar && (
              <i className={`fa-solid fa-chevron-down text-[8px] text-slate-300 transition-transform ${isCalendarExpanded ? 'rotate-180' : ''}`}></i>
            )}
          </button>
          <div className="flex gap-1 shrink-0">
            <button onClick={() => setCurrentMonth(new Date(year, month - 1, 1))} className="w-7 h-7 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-400"><i className="fa-solid fa-chevron-left text-[9px]"></i></button>
            <button onClick={() => setCurrentMonth(new Date(year, month + 1, 1))} className="w-7 h-7 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-400"><i className="fa-solid fa-chevron-right text-[9px]"></i></button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 md:gap-2">
          {['П', 'В', 'С', 'Ч', 'П', 'С', 'Н'].map(w => (
            <div key={w} className="text-[7px] font-black text-slate-200 text-center uppercase">{w}</div>
          ))}
          {daysToRender.map((date, i) => {
            if (date === null) return <div key={`empty-${i}`} className="h-8" />;
            const dateStr = date.toISOString().split('T')[0];
            const isSelected = selectedDate === dateStr;
            const isToday = new Date().toISOString().split('T')[0] === dateStr;
            const hasEntry = diary.some(e => e.date === dateStr);

            return (
              <button
                key={dateStr}
                onClick={() => { setSelectedDate(dateStr); if(isMobileCalendar) setIsCalendarExpanded(false); }}
                className={`h-8 md:h-9 rounded-xl flex items-center justify-center text-[10px] font-bold transition-all relative ${isSelected ? 'bg-orange-600 text-white shadow-lg' : isToday ? 'text-orange-600 bg-orange-50' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                {date.getDate()}
                {hasEntry && !isSelected && <div className="absolute bottom-1 w-1 h-1 bg-orange-400 rounded-full"></div>}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const renderStatsPanel = () => (
    <div className="h-full flex flex-col bg-white overflow-y-auto custom-scrollbar">
      <header className="p-6 border-b border-slate-50 shrink-0">
        <Typography variant="tiny" className="text-orange-500 mb-1 block font-black uppercase text-[9px]">Ретроспектива</Typography>
        <Typography variant="h2" className="text-base">Цей день в історії</Typography>
      </header>
      
      <div className="p-6 space-y-8">
        <section className="space-y-4">
          <div className="flex items-center justify-between">
             <Typography variant="tiny" className="text-slate-400 font-black uppercase tracking-widest text-[8px]">Спогади минулого</Typography>
             <i className="fa-solid fa-clock-rotate-left text-orange-200"></i>
          </div>
          
          {memoriesFromPast.length > 0 ? (
            memoriesFromPast.map(mem => (
              <Card key={mem.id} padding="sm" className="bg-gradient-to-br from-orange-50/50 to-white border-orange-100 shadow-sm hover:shadow-md transition-all cursor-pointer group" onClick={() => { setEditingEntryId(mem.id); setSelectedDate(mem.date); }}>
                <div className="flex justify-between items-start mb-2">
                   <span className="text-[10px] font-black text-orange-600">{new Date(mem.date).getFullYear()} рік</span>
                   <i className="fa-solid fa-arrow-right text-[8px] text-slate-300 group-hover:translate-x-1 transition-transform"></i>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed italic line-clamp-3">
                  {mem.content.replace(/<[^>]*>?/gm, '').slice(0, 150)}...
                </p>
              </Card>
            ))
          ) : (
            <div className="p-10 border-2 border-dashed border-slate-100 rounded-[2rem] text-center opacity-30">
              <i className="fa-solid fa-ghost text-2xl mb-2 text-slate-300"></i>
              <p className="text-[9px] font-black uppercase">Тут поки порожньо</p>
            </div>
          )}
        </section>

        <section className="space-y-4">
           <Typography variant="tiny" className="text-slate-400 font-black uppercase tracking-widest text-[8px]">Квести дня</Typography>
           <div className="grid grid-cols-2 gap-3">
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                 <div className="text-lg font-black text-emerald-700">{tasks.filter(t => !t.isDeleted && t.status === TaskStatus.DONE && t.completedAt && new Date(t.completedAt).toLocaleDateString('en-CA') === selectedDate).length}</div>
                 <div className="text-[7px] font-black text-emerald-600 uppercase">Виконано</div>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                 <div className="text-lg font-black text-slate-700">{tasks.filter(t => !t.isDeleted && t.scheduledDate && new Date(t.scheduledDate).toLocaleDateString('en-CA') === selectedDate).length}</div>
                 <div className="text-[7px] font-black text-slate-400 uppercase">Планів</div>
              </div>
           </div>
        </section>
      </div>
    </div>
  );

  return (
    <div className="h-screen flex bg-slate-50 overflow-hidden relative">
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        <header className="px-4 md:px-6 py-3 md:py-4 bg-white border-b border-slate-100 z-10 flex flex-col gap-3 shrink-0">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shadow-sm">
                 <i className="fa-solid fa-book-open text-sm"></i>
              </div>
              <Typography variant="h1" className="text-lg md:text-xl">Щоденник</Typography>
            </div>
            
            {/* MOBILE TOGGLE */}
            <div className="lg:hidden flex bg-slate-100 p-0.5 rounded-xl border border-slate-200">
               <button onClick={() => setMobileTab('list')} className={`px-4 py-1.5 rounded-lg text-[8px] font-black uppercase transition-all ${mobileTab === 'list' ? 'bg-white shadow-sm text-orange-600' : 'text-slate-400'}`}>Записи</button>
               <button onClick={() => setMobileTab('stats')} className={`px-4 py-1.5 rounded-lg text-[8px] font-black uppercase transition-all ${mobileTab === 'stats' ? 'bg-white shadow-sm text-orange-600' : 'text-slate-400'}`}>Ретро</button>
            </div>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden relative">
          {/* DESKTOP SIDEBAR */}
          <aside className="w-72 p-6 hidden lg:flex flex-col gap-6 border-r border-slate-100 bg-white/50 shrink-0 overflow-y-auto custom-scrollbar">
            {renderCalendar()}
            <div className="space-y-3 pt-2">
              <Button variant="primary" className="w-full py-4 rounded-2xl shadow-xl shadow-orange-100 font-black tracking-widest uppercase text-[10px] gap-3" onClick={() => { setEditingEntryId('new'); setSelectedDate(new Date().toLocaleDateString('en-CA')); }}>
                <i className="fa-solid fa-plus text-xs"></i> НОВИЙ ЗАПИС
              </Button>
              <Button variant="secondary" className="w-full py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] gap-3 border-orange-100/50" onClick={() => setShowReportWizard(true)}>
                <i className="fa-solid fa-chart-line text-xs"></i> ПІДСУМКИ ДНЯ
              </Button>
            </div>
          </aside>

          {/* MAIN CONTENT AREA */}
          <main className={`flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 bg-slate-50/30 ${isMobile && mobileTab === 'stats' ? 'hidden' : 'block'}`}>
            <div className="max-w-3xl mx-auto space-y-5 pb-40">
              <div className="block lg:hidden">{renderCalendar(true)}</div>
              
              {/* MOBILE QUICK ACTION */}
              <div className="lg:hidden grid grid-cols-2 gap-3 mb-6">
                <button onClick={() => setEditingEntryId('new')} className="bg-orange-600 text-white p-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 text-[10px] font-black uppercase"><i className="fa-solid fa-plus"></i> ЗАПИС</button>
                <button onClick={() => setShowReportWizard(true)} className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm flex items-center justify-center gap-2 text-[10px] font-black uppercase text-slate-600"><i className="fa-solid fa-chart-line"></i> ЗВІТ</button>
              </div>

              {(Object.entries(groupedByMonth) as [string, DiaryEntry[]][]).map(([month, entries]) => (
                <div key={month} className="space-y-3">
                  <div className="sticky top-0 z-10 bg-slate-50/90 backdrop-blur-sm py-2 px-1">
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">{month}</span>
                  </div>
                  {entries.map(entry => {
                    const dateParts = entry.date.split('-').map(Number);
                    const d = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
                    let title = 'Без заголовка';
                    try {
                      const blocks = JSON.parse(entry.content);
                      title = blocks.find((b: any) => b.content.trim() !== '' && b.content !== '<br>')?.content?.replace(/<[^>]*>?/gm, '') || 'Без заголовка';
                    } catch(e) { title = entry.content.split('\n')[0].replace('#', '').trim() || 'Без заголовка'; }

                    return (
                      <Card key={entry.id} padding="none" hover onClick={() => { setEditingEntryId(entry.id); setSelectedDate(entry.date); }}
                        className={`bg-white border-slate-100 rounded-[1.8rem] cursor-pointer overflow-hidden group/card transition-all ${editingEntryId === entry.id ? 'ring-2 ring-orange-100 border-orange-200 shadow-lg' : 'shadow-sm'}`}>
                        <div className="flex items-center gap-4 md:gap-6 p-4 md:p-5">
                          <div className="w-10 md:w-12 flex flex-col items-center shrink-0 border-r border-slate-50 pr-4 md:pr-5">
                             <span className="text-[7px] md:text-[8px] font-black text-slate-300 uppercase leading-none mb-1.5">{d.toLocaleString('uk-UA', { weekday: 'short' })}</span>
                             <span className="text-sm md:text-lg font-black text-slate-800 leading-none">{d.getDate()}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-[13px] md:text-[15px] font-black text-slate-700 truncate block uppercase tracking-tight">{title}</span>
                            <div className="flex items-center gap-3 mt-1">
                               <p className="text-[8px] text-slate-300 truncate font-black uppercase tracking-widest">{entry.date}</p>
                               <div className="w-1 h-1 rounded-full bg-slate-200"></div>
                               <span className="text-[8px] font-black text-orange-400 uppercase">{new Date(entry.createdAt).toLocaleTimeString('uk-UA', {hour:'2-digit', minute:'2-digit'})}</span>
                            </div>
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); if(confirm('Видалити цей запис?')) deleteDiaryEntry(entry.id); }} className="w-9 h-9 rounded-xl text-slate-200 hover:text-rose-500 flex items-center justify-center transition-all"><i className="fa-solid fa-trash-can text-sm"></i></button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              ))}
            </div>
          </main>

          {/* MOBILE STATS VIEW */}
          {isMobile && mobileTab === 'stats' && (
            <main className="flex-1 bg-white overflow-hidden">
               {renderStatsPanel()}
            </main>
          )}
        </div>
      </div>

      {/* RIGHT SIDE PANEL (DESKTOP EDITOR OR STATS) */}
      <div className={`fixed inset-0 lg:relative lg:inset-auto h-full border-l border-slate-100 bg-white z-[60] transition-all duration-300 ease-in-out ${editingEntryId ? 'translate-x-0' : 'translate-x-0'} flex ${isMobile && !editingEntryId ? 'hidden' : ''}`}>
         <div onMouseDown={startResizing} className={`hidden lg:block w-[1px] h-full cursor-col-resize hover:bg-orange-500 z-[100] transition-colors ${isResizing ? 'bg-orange-500' : 'bg-slate-100'}`}></div>
         <div style={{ width: isMobile ? '100vw' : detailsWidth }} className="h-full flex flex-col bg-white shadow-2xl lg:shadow-none overflow-hidden">
            {editingEntryId ? (
              <DiaryEditor id={editingEntryId === 'new' ? undefined : editingEntryId} date={selectedDate} onClose={() => setEditingEntryId(null)} />
            ) : (
              !isMobile && renderStatsPanel()
            )}
         </div>
      </div>

      {showReportWizard && <DailyReportWizard onClose={() => setShowReportWizard(false)} />}
    </div>
  );
};

export default DiaryView;
