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

  const dailyHabits = useMemo(() =>
    tasks.filter(t => !t.isDeleted && !t.isArchived && (t.projectSection === 'habits' || t.tags.includes('habit'))),
    [tasks]
  );


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

  const renderSidebarCalendar = () => {
    return (
      <div className="bg-white/50 backdrop-blur-sm rounded-[2rem] border border-slate-100 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4 px-1">
          <Typography variant="tiny" className="text-slate-800 font-bold capitalize text-[9px] tracking-widest">
            {currentMonth.toLocaleString('uk-UA', { month: 'long', year: 'numeric' })}
          </Typography>
          <div className="flex items-center gap-1">
            <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))} className="w-6 h-6 rounded-lg hover:bg-black/5 text-slate-400 flex items-center justify-center transition-all"><i className="fa-solid fa-chevron-left text-[7px]"></i></button>
            <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))} className="w-6 h-6 rounded-lg hover:bg-black/5 text-slate-400 flex items-center justify-center transition-all"><i className="fa-solid fa-chevron-right text-[7px]"></i></button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'].map(w => (
            <div key={w} className="text-[7px] font-bold text-slate-400 opacity-40 text-center uppercase mb-1">{w}</div>
          ))}
          {calendarDays.map((date, i) => {
            if (!date) return <div key={`empty-${i}`} className="h-7" />;
            const ds = date.toLocaleDateString('en-CA');
            const isSelected = selectedDate === ds;
            const hasEntry = diary.some(e => e.date === ds);
            const isToday = ds === new Date().toLocaleDateString('en-CA');

            return (
              <button
                key={ds}
                onClick={() => {
                  setSelectedDate(ds);
                  if (!hasEntry) setEditingEntryId('new');
                  else {
                    const entry = diary.find(e => e.date === ds);
                    if (entry) setEditingEntryId(entry.id);
                  }
                }}
                className={`h-7 rounded-xl flex flex-col items-center justify-center relative transition-all group ${isSelected ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-black/5'}`}
              >
                <span className={`text-[9px] font-bold ${isSelected ? 'text-white' : isToday ? 'text-indigo-600' : 'text-slate-600'}`}>{date.getDate()}</span>
                {hasEntry && (
                  <div className={`w-0.5 h-0.5 rounded-full mt-0.5 ${isSelected ? 'bg-white' : 'bg-indigo-500'}`}></div>
                )}
              </button>
            );
          })}
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
              <Typography variant="h1" className="text-lg md:text-2xl font-bold uppercase tracking-tighter">Щоденник</Typography>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsReportWizardOpen(true)}
                className="px-4 h-9 md:h-10 bg-[var(--primary)] text-white rounded-xl text-[9px] font-bold uppercase shadow-lg shadow-[var(--primary)]/20 transition-all hover:scale-[1.02] active:scale-95 whitespace-nowrap"
              >
                Звіт дня
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          {/* CENTER: LIST OF ENTRIES */}
          <main className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-12 bg-[var(--bg-main)]/30 relative">
            {/* Timeline Line */}
            <div className="absolute left-[3.5rem] md:left-[6.2rem] top-0 bottom-0 w-0.5 bg-gradient-to-b from-transparent via-[var(--border-color)] to-transparent opacity-30 hidden md:block"></div>

            <div className="max-w-3xl mx-auto space-y-12 pb-40">
              {Object.entries(groupedByMonth).length > 0 ? (Object.entries(groupedByMonth) as [string, DiaryEntry[]][]).map(([month, monthEntries]) => (
                <div key={month} className="space-y-6">
                  {/* Broad Sticky Month Header */}
                  <div className="sticky top-0 z-20 pt-4 pb-2 bg-gradient-to-b from-[var(--bg-main)] via-[var(--bg-main)] to-transparent">
                    <div className="flex items-center justify-between gap-4 py-2.5 px-6 rounded-2xl border border-[var(--border-color)] bg-white/80 backdrop-blur-md shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                        <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-800">{month}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{monthEntries.length} записів</span>
                        <div className="w-1 h-1 rounded-full bg-slate-200"></div>
                        <span className="text-[9px] font-bold text-indigo-400 uppercase"><i className="fa-solid fa-book-open mr-1"></i> Архів</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {monthEntries.map(entry => {
                      const dateParts = entry.date.split('-').map(Number);
                      const d = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
                      let title = 'Запис';
                      try {
                        const blocks = JSON.parse(entry.content);
                        title = blocks.find((b: any) => b.content && b.content.trim() !== '' && b.content !== '<br>')?.content?.replace(/<[^>]*>?/gm, '') || 'Без заголовка';
                      } catch (e) { title = entry.content.split('\n')[0].trim(); }

                      const isSelected = selectedDate === entry.date && editingEntryId === entry.id;

                      return (
                        <div key={entry.id} className="relative pl-0 md:pl-20 group">
                          {/* Timeline Dot */}
                          <div className={`absolute left-[5.55rem] top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-[3px] border-[var(--bg-main)] shadow-sm hidden md:block z-10 transition-all duration-300 ${isSelected ? 'bg-indigo-600 scale-125' : 'bg-slate-300 group-hover:bg-indigo-400'}`}></div>

                          <Card padding="none" onClick={() => { setEditingEntryId(entry.id); setSelectedDate(entry.date); }}
                            className={`bg-[var(--bg-card)] border-[var(--border-color)] rounded-2xl cursor-pointer overflow-hidden transition-all group/card ${isSelected ? 'ring-2 ring-indigo-500 border-transparent shadow-2xl scale-[1.01]' : 'shadow-sm hover:shadow-lg hover:border-indigo-200'}`}>
                            <div className="flex items-center gap-4 p-3 md:p-4 relative">
                              <div className="w-10 md:w-12 flex flex-col items-center shrink-0 border-r border-slate-100 pr-4">
                                <span className="text-[7px] md:text-[8px] font-bold text-slate-400 uppercase mb-0.5">{d.toLocaleString('uk-UA', { weekday: 'short' })}</span>
                                <span className={`text-base md:text-xl font-bold transition-colors ${isSelected ? 'text-indigo-600' : 'text-slate-800'}`}>{d.getDate()}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className={`text-[12px] md:text-[14px] font-bold truncate block transition-all ${isSelected ? 'text-indigo-600' : 'text-slate-800'}`}>{title}</span>
                                {dailyHabits.length > 0 && (
                                  <div className="flex items-center gap-1.5 mt-2">
                                    <div className="flex items-center gap-1 text-[7px] font-bold text-slate-400 uppercase tracking-widest">
                                      <i className="fa-regular fa-clock text-[8px] text-indigo-400"></i>
                                      {new Date(entry.updatedAt).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                    <div className="w-0.5 h-0.5 rounded-full bg-slate-200"></div>
                                    <div className="flex items-center gap-1.5 text-[7px] font-bold text-emerald-500 uppercase tracking-widest bg-emerald-50 px-1.5 py-0.5 rounded">
                                      <i className="fa-solid fa-repeat text-[7px]"></i>
                                      {dailyHabits.filter(h => h.habitHistory?.[entry.date]?.status === 'completed').length} / {dailyHabits.length}
                                    </div>
                                    <div className="w-0.5 h-0.5 rounded-full bg-slate-200"></div>
                                    <div className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">
                                      {entry.date.replaceAll('-', '.')}
                                    </div>
                                  </div>
                                )}
                                {dailyHabits.length === 0 && (
                                  <div className="flex items-center gap-3 mt-2">
                                    <div className="flex items-center gap-1.5 text-[7px] font-bold text-slate-400 uppercase tracking-widest">
                                      <i className="fa-regular fa-clock text-[8px] text-indigo-400"></i>
                                      {new Date(entry.updatedAt).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                    <div className="w-0.5 h-0.5 rounded-full bg-slate-200"></div>
                                    <div className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">
                                      {entry.date.replaceAll('-', '.')}
                                    </div>
                                  </div>
                                )}

                              </div>
                              <div className="opacity-0 group-hover/card:opacity-100 transition-all flex gap-1">
                                <button
                                  onClick={(e) => { e.stopPropagation(); setEditingEntryId(entry.id); }}
                                  className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-500 hover:bg-indigo-500 hover:text-white transition-all flex items-center justify-center shadow-sm"
                                >
                                  <i className="fa-solid fa-pen-nib text-[10px]"></i>
                                </button>
                                <button
                                  onClick={(e) => handleDeleteEntry(e, entry.id)}
                                  className="w-8 h-8 rounded-xl bg-rose-50 text-rose-400 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center shadow-sm"
                                >
                                  <i className="fa-solid fa-trash-can text-[10px]"></i>
                                </button>
                              </div>
                            </div>
                          </Card>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )) : (
                <div className="py-32 text-center opacity-10 flex flex-col items-center select-none pointer-events-none grayscale">
                  <div className="w-32 h-32 rounded-[3.5rem] bg-indigo-50 flex items-center justify-center mb-8 rotate-12">
                    <i className="fa-solid fa-feather-pointed text-6xl text-indigo-600"></i>
                  </div>
                  <Typography variant="h2" className="text-3xl font-bold uppercase tracking-[0.3em] text-slate-800">Історія порожня</Typography>
                  <p className="text-sm font-bold uppercase tracking-widest mt-4 text-slate-400">Час написати перший розділ вашої легенди...</p>
                </div>
              )}
            </div>
          </main>

          {/* RIGHT: CALENDAR & STATS */}
          <aside className="w-80 p-8 hidden lg:flex flex-col gap-6 border-l border-[var(--border-color)] bg-[var(--bg-sidebar)] shrink-0 overflow-y-auto no-print">
            <div className="space-y-6">
              <div className="p-6 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-2xl border border-indigo-100/50 shadow-sm relative overflow-hidden">
                <div className="relative z-10">
                  <Typography variant="tiny" className="text-indigo-600 font-black mb-1 uppercase text-[9px] tracking-[0.2em] opacity-60">Статистика</Typography>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-slate-800 tracking-tighter">{diary.length}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">глав</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2">
                <Button variant="primary" className="w-full py-4 rounded-2xl shadow-xl shadow-indigo-200 font-black uppercase text-[10px] tracking-widest transition-all hover:scale-[1.02] active:scale-95" onClick={() => { setEditingEntryId('new'); }}>
                  <i className="fa-solid fa-plus mr-2"></i> НОВИЙ ЗАПИС
                </Button>
              </div>

              {renderSidebarCalendar()}
            </div>

            <div className="mt-auto p-6 bg-slate-50/50 rounded-2xl border border-slate-100">
              <Typography variant="tiny" className="text-slate-400 font-black mb-3 uppercase text-[8px] tracking-widest block text-center">Цифрова Пам'ять</Typography>
              <div className="flex justify-center gap-1">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className={`h-8 w-1.5 rounded-full ${i <= (Math.min(5, Math.ceil(diary.length / 5))) ? 'bg-indigo-400' : 'bg-slate-200'}`} />
                ))}
              </div>
            </div>
          </aside>
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