import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useApp } from '../contexts/AppContext';
import { DiaryEntry, AiSuggestion } from '../types';
import Typography from '../components/ui/Typography';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import DiaryEditor from '../components/DiaryEditor';
import DailyReportAiWizard from '../components/DailyReportAiWizard';
import { useResizer } from '../hooks/useResizer';

const DiaryView: React.FC = () => {
  const {
    diary = [], tasks, deleteDiaryEntry, character, aiEnabled,
    setActiveTab, setIsReportWizardOpen, saveDiaryEntry
  } = useApp();

  const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [isCalendarExpanded, setIsCalendarExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const [showAiWizard, setShowAiWizard] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<AiSuggestion[] | null>(null);

  const { isResizing, startResizing, detailsWidth } = useResizer(400, 800);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);

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
    const query = searchQuery.toLowerCase().trim();
    if (!query) return sortedDiary;
    return sortedDiary.filter(e => {
      try {
        const blocks = JSON.parse(e.content);
        return blocks.some((b: any) => b.content?.toLowerCase().includes(query));
      } catch {
        return e.content.toLowerCase().includes(query);
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

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (!taskId) return;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const targetDate = selectedDate || new Date().toLocaleDateString('en-CA');
    const existingEntry = diary.find(ent => ent.date === targetDate);
    let content: string;
    const taskBullet = `[ ] ${task.title}${task.description ? ': ' + task.description : ''}`;
    if (existingEntry) {
      try {
        const blocks = JSON.parse(existingEntry.content);
        blocks.push({ id: Math.random().toString(36).substr(2, 9), type: 'bullet', content: taskBullet });
        content = JSON.stringify(blocks);
      } catch {
        content = existingEntry.content + `\n- ${taskBullet}`;
      }
    } else {
      content = JSON.stringify([
        { id: 'b1', type: 'h1', content: `Запис від ${new Date(targetDate).toLocaleDateString('uk-UA')}` },
        { id: 'b2', type: 'bullet', content: taskBullet }
      ]);
    }
    const savedId = saveDiaryEntry(targetDate, content, existingEntry?.id);
    if (savedId) { setEditingEntryId(savedId); setSelectedDate(targetDate); }
  };

  const getEntryTitle = (entry: DiaryEntry) => {
    try {
      const blocks = JSON.parse(entry.content);
      return blocks.find((b: any) => b.content && b.content.trim() !== '' && b.content !== '<br>')?.content?.replace(/<[^>]*>?/gm, '') || 'Без заголовка';
    } catch { return entry.content.split('\n')[0].trim() || 'Без заголовка'; }
  };

  const renderCalendar = () => (
    <div className={`bg-[var(--bg-card)] border-b border-[var(--border-color)] overflow-hidden ${isCalendarExpanded ? 'pb-4' : ''}`}>
      <div className="px-4 md:px-8 py-3">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
              className="w-8 h-8 rounded-xl hover:bg-[var(--bg-main)] text-[var(--text-muted)] flex items-center justify-center transition-all active:scale-90"
            >
              <i className="fa-solid fa-chevron-left text-[10px]"></i>
            </button>
            <span className="text-[11px] font-black uppercase tracking-widest text-[var(--primary)]">
              {currentMonth.toLocaleString('uk-UA', { month: 'long', year: 'numeric' })}
            </span>
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
              className="w-8 h-8 rounded-xl hover:bg-[var(--bg-main)] text-[var(--text-muted)] flex items-center justify-center transition-all active:scale-90"
            >
              <i className="fa-solid fa-chevron-right text-[10px]"></i>
            </button>
          </div>
          <button
            onClick={() => setIsCalendarExpanded(!isCalendarExpanded)}
            className="px-3 py-1.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] text-[8px] font-black uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--primary)] transition-all flex items-center gap-1.5"
          >
            <i className={`fa-solid ${isCalendarExpanded ? 'fa-compress' : 'fa-expand'} text-[9px]`}></i>
            {isCalendarExpanded ? 'ТИЖДЕНЬ' : 'МІСЯЦЬ'}
          </button>
        </div>

        {/* Weekday labels */}
        <div className="grid grid-cols-7 mb-1.5">
          {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'].map(w => (
            <div key={w} className="text-[7px] font-black text-[var(--text-muted)] opacity-40 text-center uppercase">{w}</div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-0.5 md:gap-1">
          {calendarDays.map((date, i) => {
            if (!date) return <div key={`e-${i}`} className="h-9 md:h-11" />;
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
                  else { const entry = diary.find(e => e.date === ds); if (entry) setEditingEntryId(entry.id); }
                }}
                className={`h-9 md:h-11 rounded-xl flex flex-col items-center justify-center relative transition-all active:scale-90 ${
                  isSelected
                    ? 'bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary)]/30 scale-105 z-10'
                    : isToday
                      ? 'bg-[var(--primary)]/10 border border-[var(--primary)]/30'
                      : hasEntry
                        ? 'bg-[var(--bg-main)] border border-[var(--border-color)]'
                        : 'hover:bg-[var(--bg-main)]'
                }`}
              >
                <span className={`text-[10px] md:text-[12px] font-black leading-none ${
                  isSelected ? 'text-white' : isToday ? 'text-[var(--primary)]' : 'text-[var(--text-main)]'
                }`}>{date.getDate()}</span>
                {hasEntry && (
                  <div className={`w-1 h-1 rounded-full mt-0.5 ${isSelected ? 'bg-white/80' : 'bg-[var(--primary)]'}`} />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-screen flex bg-[var(--bg-main)] overflow-hidden relative text-[var(--text-main)]">
      <div className="flex-1 flex flex-col min-w-0 h-full relative">

        {/* ===== HEADER ===== */}
        <header className="bg-[var(--bg-card)] border-b border-[var(--border-color)] z-30 shrink-0">
          <div className="flex items-center justify-between px-4 md:px-8 h-14 md:h-16 gap-3">

            {/* Left: icon + title */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 md:w-11 md:h-11 rounded-2xl bg-[var(--primary)] text-white flex items-center justify-center shadow-lg shadow-[var(--primary)]/20 shrink-0">
                <i className="fa-solid fa-feather-pointed text-sm md:text-base"></i>
              </div>
              <div className="min-w-0">
                <div className="text-[13px] md:text-xl font-black uppercase tracking-tight leading-none text-[var(--text-main)] truncate">
                  Паттерни <span className="text-[var(--primary)]">Пам'яті</span>
                </div>
                <div className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest opacity-50 mt-0.5">
                  {diary.length} спогадів
                </div>
              </div>
            </div>

            {/* Desktop search */}
            <div className="flex-1 max-w-md mx-6 hidden md:block">
              <div className="relative group">
                <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-[10px] opacity-40 group-focus-within:text-[var(--primary)] group-focus-within:opacity-100 transition-all"></i>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="ПОШУК ПО СПОГАДАХ..."
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-2xl py-2.5 pl-10 pr-4 text-[9px] font-black tracking-widest uppercase focus:ring-4 focus:ring-[var(--primary)]/10 outline-none transition-all placeholder:opacity-50"
                />
              </div>
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
              {/* Mobile: search toggle */}
              <button
                onClick={() => setShowSearch(!showSearch)}
                className={`md:hidden w-10 h-10 rounded-2xl flex items-center justify-center transition-all active:scale-90 ${showSearch ? 'bg-[var(--primary)] text-white' : 'bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-muted)]'}`}
              >
                <i className="fa-solid fa-magnifying-glass text-sm"></i>
              </button>

              {/* Desktop: report button */}
              <button
                onClick={() => setIsReportWizardOpen(true)}
                className="hidden md:flex px-5 h-10 bg-indigo-600 text-white rounded-2xl items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest shadow-lg hover:scale-[1.02] active:scale-95 transition-all"
              >
                <i className="fa-solid fa-scroll text-[10px]"></i>
                Звіт дня
              </button>

              {/* New entry */}
              <button
                onClick={() => setEditingEntryId('new')}
                className="h-10 px-3 md:px-5 bg-[var(--primary)] text-white rounded-2xl flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest shadow-lg shadow-[var(--primary)]/20 hover:scale-[1.02] active:scale-95 transition-all"
              >
                <i className="fa-solid fa-plus text-sm"></i>
                <span className="hidden md:inline">НОВИЙ</span>
              </button>
            </div>
          </div>

          {/* Mobile search bar (collapsible) */}
          {showSearch && (
            <div className="px-4 pb-3 md:hidden">
              <div className="relative">
                <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-[var(--primary)] text-[11px]"></i>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Пошук по записах..."
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-2xl py-3 pl-11 pr-10 text-[12px] font-semibold outline-none focus:border-[var(--primary)] transition-colors placeholder:text-[var(--text-muted)]/50"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[var(--text-muted)]/20 flex items-center justify-center"
                  >
                    <i className="fa-solid fa-xmark text-[9px]"></i>
                  </button>
                )}
              </div>
            </div>
          )}
        </header>

        {/* ===== CALENDAR ===== */}
        {renderCalendar()}

        {/* ===== MAIN CONTENT ===== */}
        <div className="flex-1 flex overflow-hidden">
          {/* Desktop sidebar */}
          <aside className="w-64 md:w-72 p-6 hidden lg:flex flex-col gap-5 border-r border-[var(--border-color)] bg-[var(--bg-sidebar)] shrink-0 overflow-y-auto no-print">
            <div className="p-5 bg-[var(--primary)]/5 rounded-3xl border border-[var(--primary)]/10">
              <div className="text-[8px] font-black text-[var(--primary)] uppercase tracking-[0.2em] opacity-60 mb-2">Статистика</div>
              <div className="text-3xl font-black text-[var(--text-main)]">{diary.length}</div>
              <div className="text-[9px] font-bold uppercase text-[var(--text-muted)] opacity-50 tracking-wider">Всього спогадів</div>
            </div>
            <button
              onClick={() => {
                const today = new Date().toLocaleDateString('en-CA');
                setSelectedDate(today);
                const ent = diary.find(e => e.date === today);
                if (ent) setEditingEntryId(ent.id); else setEditingEntryId('new');
              }}
              className="w-full flex items-center gap-4 p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[var(--primary)]/30 transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center transition-transform group-hover:scale-110">
                <i className="fa-solid fa-calendar-today"></i>
              </div>
              <div className="text-left">
                <div className="text-[10px] font-black uppercase tracking-tight text-[var(--text-main)]">Сьогодні</div>
                <div className="text-[8px] font-bold text-[var(--text-muted)] uppercase opacity-50">Швидкий перехід</div>
              </div>
            </button>
            <div className="mt-auto opacity-20">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-px bg-[var(--border-color)]"></div>
                <span className="text-[7px] font-black uppercase tracking-widest text-[var(--text-muted)]">12TR Engine v4.0</span>
                <div className="w-6 h-px bg-[var(--border-color)]"></div>
              </div>
            </div>
          </aside>

          {/* Entries list */}
          <main
            onDragOver={e => e.preventDefault()}
            onDrop={handleDrop}
            className="flex-1 overflow-y-auto no-scrollbar p-3 md:p-10 relative"
          >
            {/* Vertical timeline line (desktop only) */}
            <div className="absolute left-[6.2rem] top-0 bottom-0 w-0.5 bg-gradient-to-b from-transparent via-[var(--border-color)] to-transparent opacity-20 hidden md:block pointer-events-none"></div>

            <div className="max-w-3xl mx-auto space-y-8 pb-32 md:pb-20">
              {Object.entries(groupedByMonth).length > 0 ? (
                (Object.entries(groupedByMonth) as [string, DiaryEntry[]][]).map(([month, monthEntries]) => (
                  <div key={month} className="space-y-3">
                    {/* Month label */}
                    <div className="sticky top-0 z-20 py-2">
                      <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)]/90 backdrop-blur-md shadow-sm w-fit">
                        <div className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] animate-pulse"></div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-main)]">{month}</span>
                        <span className="text-[8px] font-bold text-[var(--text-muted)] opacity-60">{monthEntries.length} зап.</span>
                      </div>
                    </div>

                    {/* Entries */}
                    <div className="space-y-2 md:space-y-4">
                      {monthEntries.map(entry => {
                        const dateParts = entry.date.split('-').map(Number);
                        const d = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
                        const title = getEntryTitle(entry);
                        const isSelected = selectedDate === entry.date && editingEntryId === entry.id;
                        const habitsDone = dailyHabits.filter(h => h.habitHistory?.[entry.date]?.status === 'completed').length;
                        const isToday = entry.date === new Date().toLocaleDateString('en-CA');

                        return (
                          <div key={entry.id} className="relative md:pl-20 group">
                            {/* Timeline dot (desktop) */}
                            <div className={`absolute left-[5.55rem] top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-[3px] border-[var(--bg-main)] shadow-sm hidden md:block z-10 transition-all ${
                              isSelected ? 'bg-[var(--primary)] scale-125' : 'bg-slate-300 group-hover:bg-[var(--primary)]/50'
                            }`}></div>

                            {/* Card */}
                            <div
                              onClick={() => { setEditingEntryId(entry.id); setSelectedDate(entry.date); }}
                              className={`flex items-stretch gap-0 rounded-2xl md:rounded-3xl cursor-pointer overflow-hidden transition-all border shadow-sm ${
                                isSelected
                                  ? 'ring-2 ring-[var(--primary)] border-transparent shadow-xl bg-[var(--bg-card)]'
                                  : 'border-[var(--border-color)] bg-[var(--bg-card)] hover:shadow-md hover:border-[var(--primary)]/20 active:scale-[0.99]'
                              }`}
                            >
                              {/* Date column (mobile-optimized) */}
                              <div className={`flex flex-col items-center justify-center px-3 md:px-5 py-3 shrink-0 border-r border-[var(--border-color)]/50 min-w-[52px] md:min-w-[60px] ${
                                isToday ? 'bg-[var(--primary)]/5' : ''
                              }`}>
                                <span className="text-[8px] md:text-[9px] font-black text-[var(--text-muted)] opacity-50 uppercase leading-none mb-1">
                                  {d.toLocaleString('uk-UA', { weekday: 'short' })}
                                </span>
                                <span className={`text-xl md:text-3xl font-black leading-none ${
                                  isSelected ? 'text-[var(--primary)]' : isToday ? 'text-[var(--primary)]' : 'text-[var(--text-main)]'
                                }`}>{d.getDate()}</span>
                                {isToday && <div className="w-1 h-1 rounded-full bg-[var(--primary)] mt-1"></div>}
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0 py-3 px-3 md:px-5 flex flex-col justify-center gap-1.5">
                                <div className={`text-[12px] md:text-[15px] font-bold truncate leading-tight ${
                                  isSelected ? 'text-[var(--primary)]' : 'text-[var(--text-main)]'
                                }`}>
                                  {title}
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <div className="flex items-center gap-1 text-[8px] font-bold text-[var(--text-muted)] bg-[var(--bg-main)] px-2 py-0.5 rounded-lg">
                                    <i className="fa-regular fa-clock text-[var(--primary)] text-[8px]"></i>
                                    {new Date(entry.updatedAt).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}
                                  </div>
                                  {dailyHabits.length > 0 && (
                                    <div className={`flex items-center gap-1 text-[8px] font-bold px-2 py-0.5 rounded-lg ${
                                      habitsDone === dailyHabits.length
                                        ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/10'
                                        : 'bg-[var(--bg-main)] text-[var(--text-muted)]'
                                    }`}>
                                      <i className="fa-solid fa-repeat text-[8px]"></i>
                                      {habitsDone}/{dailyHabits.length}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Actions (swipe-style on mobile: always visible but small) */}
                              <div className="flex flex-col items-center justify-center gap-1 px-2 shrink-0">
                                <button
                                  onClick={e => { e.stopPropagation(); setEditingEntryId(entry.id); }}
                                  className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white transition-all flex items-center justify-center active:scale-90"
                                >
                                  <i className="fa-solid fa-pen-nib text-[10px]"></i>
                                </button>
                                <button
                                  onClick={e => handleDeleteEntry(e, entry.id)}
                                  className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center active:scale-90"
                                >
                                  <i className="fa-solid fa-trash-can text-[10px]"></i>
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-24 text-center flex flex-col items-center select-none pointer-events-none">
                  <div className="w-24 h-24 md:w-32 md:h-32 rounded-[2.5rem] bg-[var(--primary)]/10 flex items-center justify-center mb-6 opacity-20 rotate-12">
                    <i className="fa-solid fa-feather-pointed text-5xl md:text-6xl text-[var(--primary)]"></i>
                  </div>
                  <div className="text-xl md:text-3xl font-black uppercase tracking-[0.2em] text-[var(--text-main)] opacity-10">
                    {searchQuery ? 'Нічого не знайдено' : 'Історія порожня'}
                  </div>
                  {!searchQuery && (
                    <p className="text-[9px] md:text-sm font-bold uppercase tracking-widest mt-3 text-[var(--text-muted)] opacity-30">
                      Час написати перший розділ вашої легенди...
                    </p>
                  )}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* ===== EDITOR PANEL ===== */}
      <div className={`fixed inset-0 lg:relative lg:inset-auto h-full border-l border-[var(--border-color)] bg-[var(--bg-sidebar)] z-[2100] transition-all duration-300 ${
        editingEntryId ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
      } flex ${isMobile && !editingEntryId ? 'pointer-events-none' : ''}`}>
        <div style={{ width: isMobile ? '100vw' : detailsWidth }} className="h-full bg-[var(--bg-card)] shadow-2xl overflow-hidden flex flex-col">
          {!isMobile && (
            <div
              onMouseDown={startResizing}
              className={`absolute left-0 top-0 bottom-0 w-1 cursor-col-resize z-50 ${isResizing ? 'bg-[var(--primary)]' : 'hover:bg-[var(--primary)]/30'}`}
            />
          )}

          {editingEntryId && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Editor header */}
              <header className="px-4 md:px-5 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-card)] shrink-0 h-14">
                <div className="flex items-center gap-3">
                  {/* Mobile: back chevron */}
                  <button
                    onClick={() => setEditingEntryId(null)}
                    className="lg:hidden w-9 h-9 rounded-xl bg-[var(--bg-main)] flex items-center justify-center text-[var(--text-muted)] active:scale-90 transition-all"
                  >
                    <i className="fa-solid fa-chevron-left text-sm"></i>
                  </button>
                  <div className="w-8 h-8 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center text-xs shadow-sm">
                    <i className="fa-solid fa-pen-nib"></i>
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-[var(--text-main)] leading-none">
                      {editingEntryId === 'new' ? 'Новий Спогад' : 'Редактор'}
                    </div>
                    <div className="text-[8px] font-bold text-[var(--text-muted)] opacity-50 mt-0.5">
                      {selectedDate ? new Date(selectedDate + 'T12:00').toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {editingEntryId !== 'new' && (
                    <button
                      onClick={e => handleDeleteEntry(e, editingEntryId)}
                      className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white flex items-center justify-center transition-all active:scale-90"
                    >
                      <i className="fa-solid fa-trash-can text-xs"></i>
                    </button>
                  )}
                  <button
                    onClick={() => setEditingEntryId(null)}
                    className="hidden lg:flex w-10 h-10 rounded-xl bg-[var(--bg-main)] items-center justify-center text-[var(--text-muted)] hover:text-rose-500 transition-all active:scale-90"
                  >
                    <i className="fa-solid fa-xmark text-base"></i>
                  </button>
                </div>
              </header>

              {/* Editor content */}
              <div className="flex-1 overflow-hidden">
                <DiaryEditor
                  id={editingEntryId === 'new' ? undefined : editingEntryId}
                  date={selectedDate}
                  onClose={() => setEditingEntryId(null)}
                />
              </div>

              {/* Mobile save footer */}
              <footer className="px-4 py-3 border-t border-[var(--border-color)] bg-[var(--bg-card)] shrink-0 lg:hidden safe-pb">
                <button
                  onClick={() => setEditingEntryId(null)}
                  className="w-full py-4 bg-[var(--primary)] text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-[var(--primary)]/20 active:scale-[0.98] transition-all"
                >
                  <i className="fa-solid fa-floppy-disk mr-2"></i>
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
