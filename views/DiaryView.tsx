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
  const { diary = [], tasks, deleteDiaryEntry, character, aiEnabled, setActiveTab, setIsReportWizardOpen, saveDiaryEntry } = useApp();
  const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [isCalendarExpanded, setIsCalendarExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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

  const filteredDiary = useMemo(() => {
    if (!searchQuery.trim()) return sortedDiary;
    return sortedDiary.filter(e => {
      try {
        const blocks = JSON.parse(e.content);
        return blocks.some((b: any) => b.content?.toLowerCase().includes(searchQuery.toLowerCase()));
      } catch {
        return e.content.toLowerCase().includes(searchQuery.toLowerCase());
      }
    });
  }, [sortedDiary, searchQuery]);

  const groupedByMonth = useMemo(() => {
    const groups: Record<string, DiaryEntry[]> = {};
    filteredDiary.forEach(entry => {
      const dateParts = entry.date.split('-').map(Number);
      const dateObj = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
      if (isNaN(dateObj.getTime())) return;
      const monthStr = dateObj.toLocaleDateString('uk-UA', { month: 'long', year: 'numeric' });
      if (!groups[monthStr]) groups[monthStr] = [];
      groups[monthStr].push(entry);
    });
    return groups;
  }, [filteredDiary]);

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

  const renderTopCalendar = () => {
    return (
      <div className={`transition-all duration-500 ease-in-out bg-[var(--bg-card)] border-b border-[var(--border-color)] overflow-hidden ${isCalendarExpanded ? 'max-h-[500px] py-6' : 'max-h-24 py-3'}`}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Typography variant="h3" className="text-sm font-black uppercase tracking-[0.2em] text-[var(--primary)]">
                {currentMonth.toLocaleString('uk-UA', { month: 'long', year: 'numeric' })}
              </Typography>
              <div className="flex items-center gap-1">
                <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))} className="w-8 h-8 rounded-xl hover:bg-black/5 text-[var(--text-muted)] flex items-center justify-center transition-all"><i className="fa-solid fa-chevron-left text-[10px]"></i></button>
                <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))} className="w-8 h-8 rounded-xl hover:bg-black/5 text-[var(--text-muted)] flex items-center justify-center transition-all"><i className="fa-solid fa-chevron-right text-[10px]"></i></button>
              </div>
            </div>
            <button
              onClick={() => setIsCalendarExpanded(!isCalendarExpanded)}
              className="px-4 py-2 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] text-[8px] font-black uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--primary)] transition-all flex items-center gap-2"
            >
              <i className={`fa-solid ${isCalendarExpanded ? 'fa-compress' : 'fa-expand'} text-[10px]`}></i>
              {isCalendarExpanded ? 'ЗГОРНУТИ' : 'ВЕСЬ МІСЯЦЬ'}
            </button>
          </div>

          <div className={`grid grid-cols-7 gap-1 md:gap-2 transition-opacity duration-300`}>
            {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'].map(w => (
              <div key={w} className="text-[7px] md:text-[8px] font-black text-[var(--text-muted)] opacity-40 text-center uppercase">{w}</div>
            ))}
            {calendarDays.map((date, i) => {
              if (!date) return <div key={`empty-${i}`} className="h-8 md:h-12" />;
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
                  className={`h-8 md:h-12 rounded-xl md:rounded-2xl flex flex-col items-center justify-center relative transition-all group border ${isSelected ? 'bg-[var(--primary)] border-[var(--primary)] text-white shadow-xl scale-105 z-10' : isToday ? 'border-[var(--primary)]/30 bg-[var(--primary)]/5' : 'border-transparent hover:border-[var(--border-color)] hover:bg-[var(--bg-main)]'}`}
                >
                  <span className={`text-[9px] md:text-[13px] font-bold ${isSelected ? 'text-white' : isToday ? 'text-[var(--primary)]' : 'text-[var(--text-main)]'}`}>{date.getDate()}</span>
                  {hasEntry && (
                    <div className={`w-0.5 md:w-1 h-0.5 md:h-1 rounded-full mt-0.5 md:mt-1 ${isSelected ? 'bg-white' : 'bg-[var(--primary)] shadow-[0_0_8px_var(--primary)]'}`}></div>
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
        <header className="px-4 md:px-8 py-3 bg-[var(--bg-card)] border-b border-[var(--border-color)] z-30 flex flex-col shrink-0">
          <div className="flex justify-between items-center h-12">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-[var(--primary)] text-white flex items-center justify-center shadow-xl shadow-[var(--primary)]/20 rotate-3 transition-transform hover:rotate-0"><i className="fa-solid fa-feather-pointed text-xs md:text-lg"></i></div>
              <Typography variant="h1" className="text-xl md:text-3xl font-black uppercase tracking-tighter">Паттерни <span className="text-[var(--primary)]">Пам'яті</span></Typography>
            </div>

            <div className="flex-1 max-w-md mx-8 hidden md:block">
              <div className="relative group">
                <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-[10px] opacity-40 group-focus-within:text-[var(--primary)] group-focus-within:opacity-100 transition-all"></i>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ПОШУК ПО СПОГАДАХ..."
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck="false"
                  className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-2xl py-2.5 pl-10 pr-4 text-[9px] font-black tracking-widest uppercase focus:ring-4 focus:ring-[var(--primary)]/10 outline-none transition-all placeholder:opacity-50"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setEditingEntryId('new')}
                className="w-10 h-10 md:w-auto md:px-6 bg-[var(--primary)] text-white rounded-2xl md:h-12 flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest shadow-xl shadow-[var(--primary)]/20 hover:scale-[1.02] active:scale-95 transition-all"
              >
                <i className="fa-solid fa-plus text-xs"></i>
                <span className="hidden md:inline">НОВИЙ СПОГАД</span>
              </button>
            </div>
          </div>
        </header>

        {renderTopCalendar()}

        <div className="flex-1 flex overflow-hidden">
          <main className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-12 bg-[var(--bg-main)]/30 relative no-scrollbar">
            <div className="absolute left-[3.5rem] md:left-[6.2rem] top-0 bottom-0 w-0.5 bg-gradient-to-b from-transparent via-[var(--border-color)] to-transparent opacity-30 hidden md:block"></div>

            <div className="max-w-3xl mx-auto space-y-12 pb-40">
              {Object.entries(groupedByMonth).length > 0 ? (Object.entries(groupedByMonth) as [string, DiaryEntry[]][]).map(([month, monthEntries]) => (
                <div key={month} className="space-y-6">
                  <div className="sticky top-0 z-20 pt-4 pb-2 bg-gradient-to-b from-[var(--bg-main)] via-[var(--bg-main)] to-transparent">
                    <div className="flex items-center justify-between gap-4 py-3 px-6 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)]/80 backdrop-blur-md shadow-lg shadow-black/5">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-[var(--primary)] animate-pulse"></div>
                        <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--text-main)]">{month}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{monthEntries.length} записів</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
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
                          <div className={`absolute left-[5.55rem] top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-[3px] border-[var(--bg-main)] shadow-sm hidden md:block z-10 transition-all duration-300 ${isSelected ? 'bg-[var(--primary)] scale-125' : 'bg-slate-300 group-hover:bg-[var(--primary)]/50'}`}></div>

                          <Card padding="none" onClick={() => { setEditingEntryId(entry.id); setSelectedDate(entry.date); }}
                            className={`bg-[var(--bg-card)] border-[var(--border-color)] rounded-3xl cursor-pointer overflow-hidden transition-all group/card ${isSelected ? 'ring-2 ring-[var(--primary)] border-transparent shadow-2xl scale-[1.01]' : 'shadow-sm hover:shadow-xl hover:border-[var(--primary)]/20'}`}>
                            <div className="flex items-center gap-6 p-4 md:p-6 relative">
                              <div className="w-12 md:w-16 flex flex-col items-center shrink-0 border-r border-[var(--border-color)] pr-6">
                                <span className="text-[8px] md:text-[10px] font-black text-[var(--text-muted)] opacity-50 uppercase mb-1">{d.toLocaleString('uk-UA', { weekday: 'short' })}</span>
                                <span className={`text-xl md:text-3xl font-black transition-colors ${isSelected ? 'text-[var(--primary)]' : 'text-[var(--text-main)]'}`}>{d.getDate()}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className={`text-base md:text-lg font-bold truncate block transition-all mb-2 ${isSelected ? 'text-[var(--primary)]' : 'text-[var(--text-main)]'}`}>{title}</span>
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center gap-1.5 text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest bg-[var(--bg-main)] px-2 py-1 rounded-lg">
                                    <i className="fa-regular fa-clock text-[var(--primary)]"></i>
                                    {new Date(entry.updatedAt).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}
                                  </div>
                                  {dailyHabits.length > 0 && (
                                    <div className="flex items-center gap-1.5 text-[8px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/5 px-2 py-1 rounded-lg border border-emerald-500/10">
                                      <i className="fa-solid fa-repeat"></i>
                                      {dailyHabits.filter(h => h.habitHistory?.[entry.date]?.status === 'completed').length} / {dailyHabits.length}
                                    </div>
                                  )}
                                  <div className="text-[8px] font-black text-[var(--text-muted)] opacity-30 uppercase tracking-widest">
                                    {entry.date.replaceAll('-', '.')}
                                  </div>
                                </div>
                              </div>
                              <div className="opacity-0 group-hover/card:opacity-100 transition-all flex gap-2">
                                <button
                                  onClick={(e) => { e.stopPropagation(); setEditingEntryId(entry.id); }}
                                  className="w-10 h-10 rounded-2xl bg-[var(--primary)]/10 text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white transition-all flex items-center justify-center shadow-sm"
                                >
                                  <i className="fa-solid fa-pen-nib text-xs"></i>
                                </button>
                                <button
                                  onClick={(e) => handleDeleteEntry(e, entry.id)}
                                  className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center shadow-sm"
                                >
                                  <i className="fa-solid fa-trash-can text-xs"></i>
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
                  <div className="w-32 h-32 rounded-[3.5rem] bg-[var(--primary)]/10 flex items-center justify-center mb-8 rotate-12">
                    <i className="fa-solid fa-feather-pointed text-6xl text-[var(--primary)]"></i>
                  </div>
                  <Typography variant="h2" className="text-3xl font-black uppercase tracking-[0.3em] text-[var(--text-main)]">Історія порожня</Typography>
                  <p className="text-sm font-bold uppercase tracking-widest mt-4 text-[var(--text-muted)]">Час написати перший розділ вашої легенди...</p>
                </div>
              )}
            </div>
          </main>
        </div>

        {isMobile && !editingEntryId && (
          <button
            onClick={() => { setEditingEntryId('new'); }}
            className="fixed bottom-24 right-6 w-16 h-16 rounded-[2rem] bg-[var(--primary)] text-white shadow-2xl flex items-center justify-center z-[50] hover:scale-110 active:scale-95 transition-all border-4 border-[var(--bg-card)]"
          >
            <i className="fa-solid fa-plus text-2xl"></i>
          </button>
        )}
      </div>

      <div className={`fixed inset-0 lg:relative lg:inset-auto h-full border-l border-[var(--border-color)] bg-[var(--bg-sidebar)] z-[2100] transition-all duration-300 ${editingEntryId ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'} flex ${isMobile && !editingEntryId ? 'pointer-events-none' : ''}`}>
        <div style={{ width: isMobile ? '100vw' : detailsWidth }} className="h-full bg-[var(--bg-card)] shadow-2xl overflow-hidden flex flex-col">
          {editingEntryId && (
            <div className="flex-1 flex flex-col">
              <header className="p-5 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-card)] shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center text-sm shadow-sm"><i className="fa-solid fa-pen-nib"></i></div>
                  <Typography variant="h3" className="text-sm font-black uppercase tracking-widest">Редактор спогадів</Typography>
                </div>
                <div className="flex items-center gap-2">
                  {editingEntryId !== 'new' && (
                    <button onClick={(e) => handleDeleteEntry(e, editingEntryId)} className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white flex items-center justify-center transition-all"><i className="fa-solid fa-trash-can"></i></button>
                  )}
                  <button onClick={() => setEditingEntryId(null)} className="w-12 h-12 rounded-2xl bg-[var(--bg-main)] flex items-center justify-center text-[var(--text-muted)] hover:text-rose-500 transition-all"><i className="fa-solid fa-xmark text-lg"></i></button>
                </div>
              </header>
              <div className="flex-1 overflow-hidden">
                <DiaryEditor id={editingEntryId === 'new' ? undefined : editingEntryId} date={selectedDate} onClose={() => setEditingEntryId(null)} />
              </div>
              <footer className="p-8 border-t border-[var(--border-color)] bg-[var(--bg-main)]/50 shrink-0 pb-safe">
                <button
                  onClick={() => setEditingEntryId(null)}
                  className="w-full py-5 bg-[var(--primary)] text-white rounded-3xl font-black text-sm uppercase tracking-widest shadow-2xl shadow-[var(--primary)]/30 active:scale-95 transition-all"
                >
                  Зберегти в паттернах
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