import React, { useState, useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { DiaryEntry, TaskStatus } from '../types';
import Typography from '../components/ui/Typography';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import DiaryEditor from '../components/DiaryEditor';
import DailyReportWizard from '../components/DailyReportWizard';
import { useResizer } from '../hooks/useResizer';

const DiaryView: React.FC = () => {
  const { diary, tasks, deleteDiaryEntry } = useApp();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [showReportWizard, setShowReportWizard] = useState(false);
  const [isCalendarExpanded, setIsCalendarExpanded] = useState(false);
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

  const renderCalendar = (isMobile = false) => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // Logic for Full Month Grid
    const getMonthDays = () => {
      const firstDay = (new Date(year, month, 1).getDay() + 6) % 7;
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const days: (Date | null)[] = [];
      for (let i = 0; i < firstDay; i++) days.push(null);
      for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
      while (days.length % 7 !== 0) days.push(null);
      return days;
    };

    // Logic for Single Week (Minimized)
    const getWeekDays = () => {
      const start = new Date(currentMonth);
      const day = start.getDay();
      const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Monday
      const monday = new Date(start.setDate(diff));
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        return d;
      });
    };

    const isMinimized = isMobile && !isCalendarExpanded;
    const daysToRender = isMinimized ? getWeekDays() : getMonthDays();

    const handlePrev = () => {
      if (isMinimized) {
        const prevWeek = new Date(currentMonth);
        prevWeek.setDate(prevWeek.getDate() - 7);
        setCurrentMonth(prevWeek);
      } else {
        setCurrentMonth(new Date(year, month - 1, 1));
      }
    };

    const handleNext = () => {
      if (isMinimized) {
        const nextWeek = new Date(currentMonth);
        nextWeek.setDate(nextWeek.getDate() + 7);
        setCurrentMonth(nextWeek);
      } else {
        setCurrentMonth(new Date(year, month + 1, 1));
      }
    };

    return (
      <div className={`bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm transition-all duration-300 ${isMobile ? 'mb-4' : ''}`}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Typography variant="tiny" className="text-slate-900 font-black truncate capitalize text-[10px] tracking-wider">
              {currentMonth.toLocaleString('uk-UA', { month: 'long', year: 'numeric' })}
            </Typography>
            {isMobile && (
              <button 
                onClick={() => {
                  setIsCalendarExpanded(!isCalendarExpanded);
                  if (!isCalendarExpanded) {
                    setCurrentMonth(new Date(selectedDate));
                  }
                }}
                className="w-6 h-6 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center transition-transform"
                style={{ transform: isCalendarExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
              >
                <i className="fa-solid fa-chevron-down text-[8px]"></i>
              </button>
            )}
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={handlePrev} className="w-7 h-7 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors">
              <i className="fa-solid fa-chevron-left text-[9px]"></i>
            </button>
            <button onClick={handleNext} className="w-7 h-7 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors">
              <i className="fa-solid fa-chevron-right text-[9px]"></i>
            </button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {['П', 'В', 'С', 'Ч', 'П', 'С', 'Н'].map(w => (
            <div key={w} className="text-[7px] font-black text-slate-300 text-center uppercase tracking-tighter">{w}</div>
          ))}
          {daysToRender.map((date, i) => {
            if (date === null) return <div key={`empty-${i}`} className="h-8 md:h-9" />;
            
            const dateStr = date.toISOString().split('T')[0];
            const isSelected = selectedDate === dateStr;
            const isToday = new Date().toISOString().split('T')[0] === dateStr;
            
            // Check for Diary Entries
            const hasDiaryEntry = diary.some(e => e.date === dateStr);
            // Check for Calendar Events (ONLY Tasks marked as isEvent)
            const hasCalendarEvent = tasks.some(t => 
                !t.isDeleted && 
                t.status !== TaskStatus.DONE && 
                t.isEvent === true && // Тільки Події
                t.scheduledDate && 
                new Date(t.scheduledDate).toISOString().split('T')[0] === dateStr
            );

            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDate(dateStr)}
                className={`h-8 md:h-9 rounded-xl flex items-center justify-center text-[11px] font-bold transition-all relative ${
                  isSelected 
                    ? 'bg-orange-600 text-white shadow-lg' 
                    : isToday 
                      ? 'text-orange-600 bg-orange-50' 
                      : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {date.getDate()}
                <div className="absolute bottom-1 flex gap-0.5">
                   {hasDiaryEntry && !isSelected && <div className="w-1 h-1 bg-orange-400 rounded-full"></div>}
                   {hasCalendarEvent && !isSelected && <div className="w-1 h-1 bg-pink-400 rounded-full"></div>}
                </div>
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
        </header>

        <div className="flex-1 flex overflow-hidden relative">
          {/* Desktop Sidebar - Visible from lg (1024px) */}
          <aside className="w-72 p-6 hidden lg:flex flex-col gap-6 border-r border-slate-100 bg-white/50 shrink-0 overflow-y-auto custom-scrollbar">
            {renderCalendar()}
            
            <div className="space-y-3 pt-2">
              <Button 
                variant="primary" 
                className="w-full py-4 rounded-2xl shadow-xl shadow-orange-100 font-black tracking-widest uppercase text-[10px] gap-3" 
                onClick={() => { setEditingEntryId('new'); setSelectedDate(new Date().toISOString().split('T')[0]); }}
              >
                <i className="fa-solid fa-plus text-xs"></i>
                НОВИЙ ЗАПИС
              </Button>
              <Button 
                variant="secondary" 
                className="w-full py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] gap-3 border-orange-100/50" 
                onClick={() => setShowReportWizard(true)}
              >
                <i className="fa-solid fa-chart-line text-xs"></i>
                ПІДСУМКИ ДНЯ
              </Button>
            </div>

            <div className="mt-auto pt-6 border-t border-slate-100 opacity-50">
               <div className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Статистика</div>
               <div className="flex justify-between items-center text-[10px] font-bold text-slate-600">
                  <span>Всього записів:</span>
                  <span className="text-orange-600">{diary.length}</span>
               </div>
            </div>
          </aside>

          <main className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 bg-slate-50/30">
            <div className="max-w-3xl mx-auto space-y-5 pb-40">
              
              {/* Mobile/Tablet Calendar - Visible below lg */}
              <div className="block lg:hidden">
                {renderCalendar(true)}
              </div>

              {(Object.entries(groupedByMonth) as [string, DiaryEntry[]][]).map(([month, entries]) => (
                <div key={month} className="space-y-3">
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
                        className={`bg-white border-slate-100 rounded-[1.8rem] cursor-pointer overflow-hidden group/card transition-all ${editingEntryId === entry.id ? 'ring-2 ring-orange-100 border-orange-200 shadow-lg' : 'shadow-sm'}`}
                      >
                        <div className="flex items-center gap-4 md:gap-6 p-5">
                          <div className="w-10 md:w-12 flex flex-col items-center shrink-0 border-r border-slate-50 pr-4 md:pr-5">
                             <span className="text-[7px] md:text-[8px] font-black text-slate-300 uppercase leading-none mb-1.5">{d.toLocaleString('uk-UA', { weekday: 'short' })}</span>
                             <span className="text-sm md:text-lg font-black text-slate-800 leading-none">{d.getDate()}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-[13px] md:text-[15px] font-black text-slate-700 truncate block uppercase tracking-tight">
                              {title}
                            </span>
                            <div className="flex items-center gap-3 mt-1">
                               <p className="text-[8px] text-slate-300 truncate font-black uppercase tracking-widest">
                                 {entry.date}
                               </p>
                               <div className="w-1 h-1 rounded-full bg-slate-200"></div>
                               <span className="text-[8px] font-black text-orange-400 uppercase">{new Date(entry.createdAt).toLocaleTimeString('uk-UA', {hour:'2-digit', minute:'2-digit'})}</span>
                            </div>
                          </div>
                          <div className="flex gap-2 lg:opacity-0 lg:group-hover/card:opacity-100 transition-opacity">
                             <button onClick={(e) => { e.stopPropagation(); if(confirm('Видалити цей запис?')) deleteDiaryEntry(entry.id); }} className="w-9 h-9 rounded-xl text-slate-200 hover:text-rose-500 hover:bg-rose-50 flex items-center justify-center transition-all"><i className="fa-solid fa-trash-can text-sm"></i></button>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              ))}
              
              {diary.length === 0 && (
                <div className="flex flex-col items-center justify-center py-32 text-center opacity-10">
                   <i className="fa-solid fa-feather text-7xl mb-6"></i>
                   <Typography variant="h2">Порожній щоденник</Typography>
                   <Typography variant="body" className="mt-3">Твоя історія починається з першого запису.</Typography>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* Mobile/Tablet Action Panel (Fixed Bottom) - Hidden on lg */}
      <div className="lg:hidden fixed bottom-20 left-4 right-4 z-[45] pointer-events-none">
        <div className="flex items-center justify-center gap-4 pointer-events-auto">
          <button 
            onClick={() => setShowReportWizard(true)}
            className="flex-1 bg-white/95 backdrop-blur-xl border border-slate-200 h-14 rounded-[1.5rem] shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all text-slate-600 group"
          >
            <i className="fa-solid fa-chart-line text-xs group-hover:text-orange-500"></i>
            <span className="text-[10px] font-black uppercase tracking-widest">Новий звіт</span>
          </button>
          
          <button 
            onClick={() => { setEditingEntryId('new'); setSelectedDate(new Date().toISOString().split('T')[0]); }}
            className="w-16 h-14 bg-orange-600 text-white rounded-[1.5rem] shadow-2xl shadow-orange-200 flex items-center justify-center text-2xl active:scale-90 transition-all hover:bg-orange-700"
          >
            <i className="fa-solid fa-plus"></i>
          </button>
        </div>
      </div>

      {/* Editor Panel - Slide-in */}
      <div className={`fixed inset-0 lg:relative lg:inset-auto h-full border-l border-slate-100 bg-white z-[60] transition-all duration-300 ease-in-out ${editingEntryId ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 lg:translate-x-0 lg:hidden'} flex`}>
         <div onMouseDown={startResizing} className={`hidden lg:block w-[1px] h-full cursor-col-resize hover:bg-orange-500 z-[100] transition-colors ${isResizing ? 'bg-orange-500' : 'bg-slate-100'}`}></div>
         <div style={{ width: window.innerWidth < 1024 ? '100vw' : detailsWidth }} className="h-full flex flex-col bg-white shadow-2xl lg:shadow-none">
            {editingEntryId ? (
              <DiaryEditor 
                id={editingEntryId === 'new' ? undefined : editingEntryId}
                date={selectedDate} 
                onClose={() => setEditingEntryId(null)} 
              />
            ) : (
              <div className="hidden lg:flex h-full flex-col items-center justify-center p-12 text-center opacity-5 grayscale pointer-events-none select-none">
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