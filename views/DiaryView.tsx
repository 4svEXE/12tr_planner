
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

  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
      <div className={`bg-card p-4 md:p-5 rounded-[2rem] border border-theme shadow-sm transition-all duration-300 ${isMobileCalendar ? 'mb-6 mx-2' : ''}`}>
        <div className="flex items-center justify-between mb-4">
          <button 
            onClick={() => isMobileCalendar && setIsCalendarExpanded(!isCalendarExpanded)}
            className="flex items-center gap-2 text-left group"
          >
            <Typography variant="tiny" className="text-main font-black capitalize text-[10px] tracking-wider group-hover:text-primary transition-colors">
              {currentMonth.toLocaleString('uk-UA', { month: 'long', year: 'numeric' })}
            </Typography>
            {isMobileCalendar && (
              <i className={`fa-solid fa-chevron-down text-[8px] text-muted transition-transform ${isCalendarExpanded ? 'rotate-180' : ''}`}></i>
            )}
          </button>
          <div className="flex gap-2 shrink-0">
            <button onClick={() => setCurrentMonth(new Date(year, month - 1, 1))} className="w-7 h-7 rounded-xl hover:bg-black/5 flex items-center justify-center text-muted hover:text-primary transition-colors"><i className="fa-solid fa-chevron-left text-[9px]"></i></button>
            <button onClick={() => setCurrentMonth(new Date(year, month + 1, 1))} className="w-7 h-7 rounded-xl hover:bg-black/5 flex items-center justify-center text-muted hover:text-primary transition-colors"><i className="fa-solid fa-chevron-right text-[9px]"></i></button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 md:gap-2">
          {['П', 'В', 'С', 'Ч', 'П', 'С', 'Н'].map(w => (
            <div key={w} className="text-[7px] font-black text-muted/30 text-center uppercase tracking-tighter">{w}</div>
          ))}
          {daysToRender.map((date, i) => {
            if (date === null) return <div key={`empty-${i}`} className="h-8" />;
            const dY = date.getFullYear();
            const dM = String(date.getMonth() + 1).padStart(2, '0');
            const dD = String(date.getDate()).padStart(2, '0');
            const dateStr = `${dY}-${dM}-${dD}`;

            const isSelected = selectedDate === dateStr;
            const isToday = new Date().toLocaleDateString('en-CA') === dateStr;
            const hasEntry = diary.some(e => e.date === dateStr);

            return (
              <button
                key={dateStr}
                onClick={() => { setSelectedDate(dateStr); if(isMobileCalendar) setIsCalendarExpanded(false); }}
                className={`h-8 md:h-9 rounded-xl flex items-center justify-center text-[10px] font-bold transition-all relative ${isSelected ? 'bg-primary text-white shadow-lg' : isToday ? 'text-primary bg-primary/10' : 'text-main hover:bg-black/5'}`}
              >
                {date.getDate()}
                {hasEntry && !isSelected && <div className="absolute bottom-1.5 w-1 h-1 bg-primary/60 rounded-full"></div>}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const renderStatsPanel = () => (
    <div className="h-full flex flex-col bg-sidebar overflow-y-auto custom-scrollbar">
      <header className="p-6 border-b border-theme shrink-0">
        <Typography variant="tiny" className="text-primary mb-1 block font-black uppercase text-[9px]">Ретроспектива</Typography>
        <Typography variant="h2" className="text-base">Цей день в історії</Typography>
      </header>
      
      <div className="p-6 space-y-8 pb-32">
        <section className="space-y-4">
          <div className="flex items-center justify-between">
             <Typography variant="tiny" className="text-muted font-black uppercase tracking-widest text-[8px]">Спогади минулого</Typography>
             <i className="fa-solid fa-clock-rotate-left text-primary/30"></i>
          </div>
          
          {memoriesFromPast.length > 0 ? (
            memoriesFromPast.map(mem => (
              <Card key={mem.id} padding="sm" className="bg-main/20 border-theme shadow-sm hover:shadow-md transition-all cursor-pointer group" onClick={() => { setEditingEntryId(mem.id); setSelectedDate(mem.date); }}>
                <div className="flex justify-between items-start mb-2">
                   <span className="text-[10px] font-black text-primary">{new Date(mem.date).getFullYear()} рік</span>
                   <i className="fa-solid fa-arrow-right text-[8px] text-muted group-hover:translate-x-1 transition-transform"></i>
                </div>
                <p className="text-[11px] text-main/80 leading-relaxed italic line-clamp-4">
                  {mem.content.replace(/<[^>]*>?/gm, '').slice(0, 200)}...
                </p>
              </Card>
            ))
          ) : (
            <div className="p-10 border-2 border-dashed border-theme rounded-[2.5rem] text-center opacity-30 bg-black/5">
              <i className="fa-solid fa-ghost text-2xl mb-2 text-muted"></i>
              <p className="text-[9px] font-black uppercase tracking-widest">Немає спогадів для цієї дати</p>
            </div>
          )}
        </section>

        <section className="space-y-4">
           <Typography variant="tiny" className="text-muted font-black uppercase tracking-widest text-[8px]">Статус дня</Typography>
           <div className="grid grid-cols-2 gap-3">
              <div className="p-5 bg-emerald-500/10 rounded-[1.8rem] border border-emerald-500/20 flex flex-col justify-center">
                 <div className="text-2xl font-black text-emerald-500 leading-none mb-1">
                    {tasks.filter(t => !t.isDeleted && t.status === TaskStatus.DONE && t.completedAt && new Date(t.completedAt).toLocaleDateString('en-CA') === selectedDate).length}
                 </div>
                 <div className="text-[7px] font-black text-emerald-500/60 uppercase tracking-widest">Виконано</div>
              </div>
              <div className="p-5 bg-main/50 rounded-[1.8rem] border border-theme flex flex-col justify-center">
                 <div className="text-2xl font-black text-main leading-none mb-1">
                    {tasks.filter(t => !t.isDeleted && t.scheduledDate && new Date(t.scheduledDate).toLocaleDateString('en-CA') === selectedDate).length}
                 </div>
                 <div className="text-[7px] font-black text-muted uppercase tracking-widest">Планів</div>
              </div>
           </div>
        </section>
      </div>
    </div>
  );

  return (
    <div className="h-screen flex bg-main overflow-hidden relative">
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        <header className="px-4 md:px-8 py-3 md:py-6 bg-card border-b border-theme z-10 flex flex-col gap-3 shrink-0">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 md:w-11 md:h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shadow-sm">
                 <i className="fa-solid fa-book-open text-xs md:text-sm"></i>
              </div>
              <div>
                <Typography variant="h1" className="text-lg md:text-2xl font-black text-main">Щоденник</Typography>
                <Typography variant="tiny" className="text-muted uppercase tracking-widest text-[7px] hidden md:block">Архів подій та думок</Typography>
              </div>
            </div>
            
            <div className="lg:hidden flex bg-black/5 p-0.5 rounded-xl border border-theme shadow-inner">
               <button onClick={() => setMobileTab('list')} className={`px-4 py-2 rounded-[0.6rem] text-[8px] font-black uppercase transition-all flex items-center gap-1.5 ${mobileTab === 'list' ? 'bg-primary text-white shadow-md' : 'text-muted'}`}>
                 <i className="fa-solid fa-list-ul"></i>
                 Архів
               </button>
               <button onClick={() => setMobileTab('stats')} className={`px-4 py-2 rounded-[0.6rem] text-[8px] font-black uppercase transition-all flex items-center gap-1.5 ${mobileTab === 'stats' ? 'bg-primary text-white shadow-md' : 'text-muted'}`}>
                 <i className="fa-solid fa-chart-pie"></i>
                 Ретро
               </button>
            </div>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden relative">
          <aside className="w-72 p-6 hidden lg:flex flex-col gap-6 border-r border-theme bg-sidebar shrink-0 overflow-y-auto custom-scrollbar">
            {renderCalendar()}
            <div className="space-y-3 pt-2">
              <Button variant="primary" className="w-full py-4 rounded-2xl shadow-xl font-black tracking-widest uppercase text-[10px] gap-3" onClick={() => { setEditingEntryId('new'); setSelectedDate(new Date().toLocaleDateString('en-CA')); }}>
                <i className="fa-solid fa-plus text-xs"></i> НОВИЙ ЗАПИС
              </Button>
              <Button variant="white" className="w-full py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] gap-3" onClick={() => setShowReportWizard(true)}>
                <i className="fa-solid fa-chart-line text-xs text-primary"></i> ПІДСУМКИ ДНЯ
              </Button>
            </div>
          </aside>

          <main className={`flex-1 overflow-y-auto custom-scrollbar p-3 md:p-8 bg-main/30 ${isMobile && mobileTab === 'stats' ? 'hidden' : 'block'}`}>
            <div className="max-w-3xl mx-auto space-y-4 md:space-y-6 pb-40">
              <div className="block lg:hidden">{renderCalendar(true)}</div>
              
              {/* MOBILE COMPACT FAB BUTTONS */}
              {!editingEntryId && isMobile && (
                <div className="fixed bottom-20 right-4 flex flex-col gap-3 z-50 animate-in slide-in-from-bottom-4 duration-500">
                  <button 
                    onClick={() => setShowReportWizard(true)}
                    className="w-12 h-12 rounded-full bg-card border border-theme shadow-lg flex items-center justify-center text-primary active:scale-90 transition-all"
                    title="Звіт дня"
                  >
                    <i className="fa-solid fa-chart-line text-lg"></i>
                  </button>
                  <button 
                    onClick={() => { setEditingEntryId('new'); setSelectedDate(new Date().toLocaleDateString('en-CA')); }}
                    className="w-14 h-14 rounded-full bg-primary text-white shadow-2xl flex items-center justify-center active:scale-90 transition-all"
                    title="Написати"
                  >
                    <i className="fa-solid fa-pen-fancy text-xl"></i>
                  </button>
                </div>
              )}

              {(Object.entries(groupedByMonth) as [string, DiaryEntry[]][]).map(([month, entries]) => (
                <div key={month} className="space-y-3 px-2 md:px-0">
                  <div className="sticky top-0 z-10 bg-main/90 backdrop-blur-sm py-2">
                    <span className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] text-muted border-b border-theme pb-1">{month}</span>
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
                        className={`bg-card border-theme rounded-[1.8rem] md:rounded-[2.5rem] cursor-pointer overflow-hidden group/card transition-all ${editingEntryId === entry.id ? 'ring-2 ring-primary/40 border-primary shadow-lg' : 'shadow-sm hover:shadow-md'}`}>
                        <div className="flex items-center gap-4 md:gap-8 p-4 md:p-6">
                          <div className="w-10 md:w-14 flex flex-col items-center shrink-0 border-r border-theme pr-4 md:pr-8">
                             <span className="text-[7px] md:text-[9px] font-black text-muted uppercase leading-none mb-1.5">{d.toLocaleString('uk-UA', { weekday: 'short' })}</span>
                             <span className="text-base md:text-2xl font-black text-main leading-none">{d.getDate()}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-[13px] md:text-base font-black text-main truncate block uppercase tracking-tight">{title}</span>
                            <div className="flex items-center gap-3 mt-1.5">
                               <p className="text-[8px] text-muted truncate font-bold uppercase tracking-wider">{entry.date}</p>
                               <div className="w-1 h-1 rounded-full bg-theme"></div>
                               <span className="text-[8px] font-black text-primary uppercase">{new Date(entry.createdAt).toLocaleTimeString('uk-UA', {hour:'2-digit', minute:'2-digit'})}</span>
                            </div>
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); if(confirm('Видалити цей запис?')) deleteDiaryEntry(entry.id); }} className="w-9 h-9 md:w-11 md:h-11 rounded-xl md:rounded-2xl text-muted hover:text-rose-500 hover:bg-rose-500/10 flex items-center justify-center transition-all"><i className="fa-solid fa-trash-can text-sm md:text-base"></i></button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              ))}
            </div>
          </main>

          {isMobile && mobileTab === 'stats' && (
            <main className="flex-1 bg-sidebar overflow-hidden animate-in fade-in duration-300">
               {renderStatsPanel()}
            </main>
          )}
        </div>
      </div>

      <div className={`fixed inset-0 lg:relative lg:inset-auto h-full border-l border-theme bg-sidebar z-[60] transition-all duration-300 ease-in-out ${editingEntryId ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'} flex ${isMobile && !editingEntryId ? 'pointer-events-none' : ''}`}>
         {!isMobile && (
           <div onMouseDown={startResizing} className={`w-[1px] h-full cursor-col-resize hover:bg-primary z-[100] transition-colors ${isResizing ? 'bg-primary' : 'bg-theme'}`}></div>
         )}
         <div style={{ width: isMobile ? '100vw' : detailsWidth }} className="h-full flex flex-col bg-card shadow-2xl lg:shadow-none overflow-hidden">
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
