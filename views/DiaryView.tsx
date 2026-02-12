import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { DiaryEntry, TaskStatus, AiSuggestion } from '../types';
import Typography from '../components/ui/Typography';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import DiaryEditor from '../components/DiaryEditor';
import DailyReportAiWizard from '../components/DailyReportAiWizard';
import { useResizer } from '../hooks/useResizer';

const DiaryView: React.FC = () => {
  const { diary = [], tasks, deleteDiaryEntry, character, aiEnabled, setActiveTab, setIsReportWizardOpen } = useApp();
  const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [isCalendarExpanded, setIsCalendarExpanded] = useState(false);

  const [showAiWizard, setShowAiWizard] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<AiSuggestion[] | null>(null);

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

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    if (isCalendarExpanded || !isMobile) {
      const firstDay = (new Date(year, month, 1).getDay() + 6) % 7;
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const days: (Date | null)[] = [];
      for (let i = 0; i < firstDay; i++) days.push(null);
      for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
      while (days.length % 7 !== 0) days.push(null);
      return days;
    } else {
      const sel = new Date(selectedDate);
      const start = new Date(sel);
      start.setDate(sel.getDate() - sel.getDay() + (sel.getDay() === 0 ? -6 : 1));
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        return d;
      });
    }
  }, [currentMonth, isCalendarExpanded, isMobile, selectedDate]);

  const handleDeleteEntry = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Видалити цей запис назавжди?')) {
      deleteDiaryEntry(id);
      if (editingEntryId === id) setEditingEntryId(null);
    }
  };

  const renderInlineCalendar = () => {
    return (
      <div className={`bg-[var(--bg-card)] border-b border-[var(--border-color)] transition-all duration-300 overflow-hidden ${isCalendarExpanded ? 'pb-4' : 'pb-2'}`}>
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between py-2 mb-2">
            <Typography variant="tiny" className="text-[var(--text-main)] font-black capitalize text-[10px] tracking-widest">
              {currentMonth.toLocaleString('uk-UA', { month: 'long', year: 'numeric' })}
            </Typography>
            <div className="flex items-center gap-1">
              <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))} className="w-7 h-7 rounded-lg hover:bg-black/5 text-[var(--text-muted)] flex items-center justify-center transition-all"><i className="fa-solid fa-chevron-left text-[8px]"></i></button>
              <button onClick={() => setIsCalendarExpanded(!isCalendarExpanded)} className="px-2 h-7 rounded-lg hover:bg-black/5 text-[var(--text-muted)] flex items-center justify-center gap-2 transition-all">
                <i className={`fa-solid ${isCalendarExpanded ? 'fa-chevron-up' : 'fa-calendar-week'} text-[10px]`}></i>
                <span className="text-[8px] font-black uppercase">{isCalendarExpanded ? 'Згорнути' : 'Місяць'}</span>
              </button>
              <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))} className="w-7 h-7 rounded-lg hover:bg-black/5 text-[var(--text-muted)] flex items-center justify-center transition-all"><i className="fa-solid fa-chevron-right text-[8px]"></i></button>
            </div>
          </div>

          <div className={`grid grid-cols-7 gap-1 transition-all duration-500`}>
            {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'].map(w => (
              <div key={w} className="text-[7px] font-black text-[var(--text-muted)] opacity-30 text-center uppercase mb-1">{w}</div>
            ))}
            {calendarDays.map((date, i) => {
              if (!date) return <div key={`empty-${i}`} className="h-10 md:h-12" />;
              const ds = date.toLocaleDateString('en-CA');
              const isSelected = selectedDate === ds;
              const hasEntry = diary.some(e => e.date === ds);
              const isToday = ds === new Date().toLocaleDateString('en-CA');

              return (
                <button
                  key={ds}
                  onClick={() => { setSelectedDate(ds); setCurrentMonth(new Date(date.getFullYear(), date.getMonth(), 1)); }}
                  className={`h-10 md:h-12 rounded-2xl flex flex-col items-center justify-center relative transition-all group ${isSelected ? 'bg-[var(--primary)] text-white shadow-lg' : 'hover:bg-black/5'}`}
                >
                  <span className={`text-[10px] md:text-sm font-black ${isSelected ? 'text-white' : isToday ? 'text-[var(--primary)]' : 'text-[var(--text-main)]'}`}>{date.getDate()}</span>
                  {hasEntry && (
                    <div className={`w-1 h-1 rounded-full mt-1 ${isSelected ? 'bg-white' : 'bg-[var(--primary)]'}`}></div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen flex bg-[var(--bg-main)] overflow-hidden relative text-[var(--text-main)]">
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        <header className="px-4 md:px-8 py-3 bg-[var(--bg-card)] border-b border-[var(--border-color)] z-20 flex flex-col shrink-0">
          <div className="flex justify-between items-center h-12">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 md:w-11 md:h-11 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center shadow-sm"><i className="fa-solid fa-book-open text-xs"></i></div>
              <Typography variant="h1" className="text-lg md:text-2xl font-black uppercase tracking-tighter">Щоденник</Typography>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsReportWizardOpen(true)}
                className="px-4 h-9 md:h-10 bg-[var(--primary)] text-white rounded-xl text-[9px] font-black uppercase shadow-lg shadow-[var(--primary)]/20 transition-all hover:scale-[1.02] active:scale-95 whitespace-nowrap"
              >
                Звіт дня
              </button>
            </div>
          </div>
        </header>

        {renderInlineCalendar()}

        <div className="flex-1 flex overflow-hidden">
          <aside className="w-72 p-6 hidden lg:flex flex-col gap-6 border-r border-[var(--border-color)] bg-[var(--bg-sidebar)] shrink-0 overflow-y-auto no-print">
            <div className="p-4 bg-indigo-50/50 rounded-3xl border border-indigo-100 mb-4">
              <Typography variant="tiny" className="text-indigo-600 font-black mb-2 uppercase text-[8px] tracking-widest">Статистика</Typography>
              <div className="text-2xl font-black text-slate-800">{diary.length}</div>
              <div className="text-[7px] font-black uppercase text-slate-400">Всього записів</div>
            </div>
            <Button variant="primary" className="w-full rounded-2xl shadow-xl font-black uppercase text-[10px] tracking-widest" onClick={() => { setEditingEntryId('new'); }}>НОВИЙ ЗАПИС</Button>
          </aside>

          <main className="flex-1 overflow-y-auto custom-scrollbar p-3 md:p-8 bg-[var(--bg-main)]/30">
            <div className="w-full space-y-6 pb-40">
              {Object.entries(groupedByMonth).length > 0 ? (Object.entries(groupedByMonth) as [string, DiaryEntry[]][]).map(([month, monthEntries]) => (
                <div key={month} className="space-y-3">
                  <div className="flex items-center gap-3 px-2">
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] opacity-40">{month}</span>
                    <div className="h-px flex-1 bg-[var(--border-color)] opacity-20"></div>
                  </div>
                  {monthEntries.map(entry => {
                    const dateParts = entry.date.split('-').map(Number);
                    const d = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
                    let title = 'Запис';
                    try {
                      const blocks = JSON.parse(entry.content);
                      title = blocks.find((b: any) => b.content && b.content.trim() !== '' && b.content !== '<br>')?.content?.replace(/<[^>]*>?/gm, '') || 'Без заголовка';
                    } catch (e) { title = entry.content.split('\n')[0].trim(); }

                    const isSelected = selectedDate === entry.date;

                    return (
                      <Card key={entry.id} padding="none" onClick={() => { setEditingEntryId(entry.id); setSelectedDate(entry.date); }}
                        className={`bg-[var(--bg-card)] border-[var(--border-color)] rounded-[2rem] cursor-pointer overflow-hidden transition-all group ${isSelected ? 'ring-1 ring-[var(--primary)] border-[var(--primary)] shadow-xl' : 'shadow-sm hover:shadow-md'}`}>
                        <div className="flex items-center gap-5 p-4 md:p-6 relative">
                          <div className="w-10 md:w-14 flex flex-col items-center shrink-0 border-r border-[var(--border-color)] pr-4">
                            <span className="text-[8px] md:text-[9px] font-black text-[var(--text-muted)] uppercase mb-1">{d.toLocaleString('uk-UA', { weekday: 'short' })}</span>
                            <span className={`text-base md:text-2xl font-black transition-colors ${isSelected ? 'text-[var(--primary)]' : 'text-[var(--text-main)]'}`}>{d.getDate()}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className={`text-[14px] md:text-base font-black truncate block uppercase tracking-tight ${isSelected ? 'text-[var(--primary)]' : 'text-[var(--text-main)]'}`}>{title}</span>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="indigo" className="text-[7px] py-0 px-1.5">{entry.date}</Badge>
                              <span className="text-[7px] font-black text-[var(--text-muted)] uppercase opacity-30">Updated {new Date(entry.updatedAt).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </div>
                          <button
                            onClick={(e) => handleDeleteEntry(e, entry.id)}
                            className="absolute top-4 right-4 w-8 h-8 rounded-xl bg-rose-50 text-rose-400 hover:bg-rose-500 hover:text-white transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center shadow-sm"
                          >
                            <i className="fa-solid fa-trash-can text-[10px]"></i>
                          </button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )) : (
                <div className="py-24 text-center opacity-10 flex flex-col items-center select-none pointer-events-none grayscale">
                  <i className="fa-solid fa-feather-pointed text-8xl mb-6"></i>
                  <Typography variant="h2" className="text-2xl font-black uppercase tracking-[0.2em]">Історія порожня</Typography>
                  <p className="text-xs font-bold uppercase tracking-widest mt-2">Час написати перший розділ...</p>
                </div>
              )}
            </div>
          </main>
        </div>

        {isMobile && !editingEntryId && (
          <button
            onClick={() => { setEditingEntryId('new'); }}
            className="fixed bottom-24 right-6 w-14 h-14 rounded-full bg-[var(--primary)] text-white shadow-2xl flex items-center justify-center z-[50] hover:scale-110 active:scale-95 transition-all border-4 border-[var(--bg-card)]"
          >
            <i className="fa-solid fa-plus text-2xl"></i>
          </button>
        )}
      </div>

      <div className={`fixed inset-0 lg:relative lg:inset-auto h-full border-l border-[var(--border-color)] bg-[var(--bg-sidebar)] z-[2100] transition-all duration-300 ${editingEntryId ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'} flex ${isMobile && !editingEntryId ? 'pointer-events-none' : ''}`}>
        <div style={{ width: isMobile ? '100vw' : detailsWidth }} className="h-full bg-[var(--bg-card)] shadow-2xl overflow-hidden flex flex-col">
          {editingEntryId && (
            <div className="flex-1 flex flex-col">
              <header className="p-4 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-card)] shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center text-xs shadow-sm"><i className="fa-solid fa-pen-nib"></i></div>
                  <Typography variant="h3" className="text-xs font-black uppercase tracking-widest">Редактор</Typography>
                </div>
                <div className="flex items-center gap-2">
                  {editingEntryId !== 'new' && (
                    <button onClick={(e) => handleDeleteEntry(e, editingEntryId)} className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white flex items-center justify-center transition-all"><i className="fa-solid fa-trash-can"></i></button>
                  )}
                  <button onClick={() => setEditingEntryId(null)} className="w-10 h-10 rounded-2xl bg-black/5 flex items-center justify-center text-[var(--text-muted)] hover:text-rose-500 transition-all"><i className="fa-solid fa-xmark text-lg"></i></button>
                </div>
              </header>
              <div className="flex-1 overflow-hidden">
                <DiaryEditor id={editingEntryId === 'new' ? undefined : editingEntryId} date={selectedDate} onClose={() => setEditingEntryId(null)} />
              </div>
              <footer className="p-6 border-t border-[var(--border-color)] bg-black/[0.02] shrink-0 pb-safe">
                <button
                  onClick={() => setEditingEntryId(null)}
                  className="w-full py-4 bg-[var(--primary)] text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-[var(--primary)]/20 active:scale-95 transition-all"
                >
                  Зберегти та вийти
                </button>
              </footer>
            </div>
          )}
        </div>
      </div>

      {showAiWizard && aiSuggestions && <DailyReportAiWizard suggestions={aiSuggestions} onClose={() => setShowAiWizard(false)} />}
    </div>
  );
};

export default DiaryView;