import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { DiaryEntry, TaskStatus, AiSuggestion } from '../types';
import Typography from '../components/ui/Typography';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import DiaryEditor from '../components/DiaryEditor';
import DailyReportAiWizard from '../components/DailyReportAiWizard';
import { useResizer } from '../hooks/useResizer';
import { analyzeDailyReport } from '../services/geminiService';

const DiaryView: React.FC = () => {
  const { diary = [], tasks, deleteDiaryEntry, character, aiEnabled, setActiveTab, setIsReportWizardOpen } = useApp();
  const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [isCalendarExpanded, setIsCalendarExpanded] = useState(false);
  const [mobileTab, setMobileTab] = useState<'list' | 'stats'>('list');
  
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<AiSuggestion[] | null>(null);
  const [showAiWizard, setShowAiWizard] = useState(false);

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

  const activeEntry = useMemo(() => diary.find(e => e.id === editingEntryId), [diary, editingEntryId]);

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

  const handleDelete = (id: string) => {
    if (confirm('Видалити назавжди?')) {
      if (editingEntryId === id) setEditingEntryId(null);
      deleteDiaryEntry(id);
    }
  };

  const handleStartAiAnalysis = async () => {
    if (!activeEntry || !aiEnabled) return;
    setIsAiAnalyzing(true);
    try {
      let analysisText = activeEntry.content;
      try {
        const blocks = JSON.parse(activeEntry.content);
        analysisText = Array.isArray(blocks) ? blocks.map(b => b.content).join('\n') : activeEntry.content;
      } catch(e) {}
      const suggestions = await analyzeDailyReport(analysisText, character);
      setAiSuggestions(suggestions);
      setShowAiWizard(true);
    } catch (e) {
      alert("Помилка ШІ.");
    } finally { setIsAiAnalyzing(false); }
  };

  const renderCalendar = (isMobileCalendar = false) => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = (new Date(year, month, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (Date | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
    while (days.length % 7 !== 0) days.push(null);

    return (
      <div className={`bg-card p-4 rounded-[2rem] border border-theme shadow-sm ${isMobileCalendar ? 'mb-6 mx-2' : ''}`}>
        <div className="flex items-center justify-between mb-4">
          <Typography variant="tiny" className="text-main font-black capitalize text-[10px]">{currentMonth.toLocaleString('uk-UA', { month: 'long', year: 'numeric' })}</Typography>
          <div className="flex gap-2">
            <button onClick={() => setCurrentMonth(new Date(year, month - 1, 1))} className="w-7 h-7 rounded-xl hover:bg-black/5 text-muted"><i className="fa-solid fa-chevron-left text-[9px]"></i></button>
            <button onClick={() => setCurrentMonth(new Date(year, month + 1, 1))} className="w-7 h-7 rounded-xl hover:bg-black/5 text-muted"><i className="fa-solid fa-chevron-right text-[9px]"></i></button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {['П', 'В', 'С', 'Ч', 'П', 'С', 'Н'].map(w => <div key={w} className="text-[7px] font-black text-muted/30 text-center uppercase">{w}</div>)}
          {days.map((date, i) => {
            if (!date) return <div key={i} className="h-8" />;
            const ds = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            const hasEntry = diary.some(e => e.date === ds);
            return (
              <button key={i} onClick={() => setSelectedDate(ds)} className={`h-8 rounded-xl flex items-center justify-center text-[10px] font-bold relative ${selectedDate === ds ? 'bg-primary text-white' : 'text-main hover:bg-black/5'}`}>
                {date.getDate()}
                {hasEntry && <div className={`absolute bottom-1 w-1 h-1 rounded-full ${selectedDate === ds ? 'bg-white' : 'bg-primary'}`}></div>}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen flex bg-main overflow-hidden relative">
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        <header className="px-4 md:px-8 py-3 bg-card border-b border-theme z-10 flex flex-col gap-3 shrink-0">
          <div className="flex justify-between items-center h-12">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 md:w-11 md:h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shadow-sm"><i className="fa-solid fa-book-open text-xs"></i></div>
              <Typography variant="h1" className="text-lg md:text-2xl font-black text-main uppercase tracking-tighter">Щоденник</Typography>
            </div>
            <div className="flex items-center gap-2">
               <button onClick={() => setIsReportWizardOpen(true)} className="px-4 py-2 bg-primary text-white rounded-xl text-[9px] font-black uppercase shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95">Підсумки дня</button>
            </div>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          <aside className="w-72 p-6 hidden lg:flex flex-col gap-6 border-r border-theme bg-sidebar shrink-0 overflow-y-auto">
            {renderCalendar()}
            <Button variant="primary" className="w-full rounded-2xl shadow-xl font-black uppercase text-[10px]" onClick={() => { setEditingEntryId('new'); setSelectedDate(new Date().toLocaleDateString('en-CA')); }}>НОВИЙ ЗАПИС</Button>
          </aside>
          <main className="flex-1 overflow-y-auto custom-scrollbar p-3 md:p-8 bg-main/30">
            <div className="max-w-3xl mx-auto space-y-4 pb-40">
              {Object.entries(groupedByMonth).map(([month, entries]) => (
                <div key={month} className="space-y-3">
                  <span className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] text-muted border-b border-theme pb-1">{month}</span>
                  {entries.map(entry => {
                    const dateParts = entry.date.split('-').map(Number);
                    const d = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
                    let title = 'Запис';
                    try {
                      const blocks = JSON.parse(entry.content);
                      title = blocks.find((b: any) => b.content.trim() !== '' && b.content !== '<br>')?.content?.replace(/<[^>]*>?/gm, '') || 'Без заголовка';
                    } catch(e) { title = entry.content.split('\n')[0].trim(); }

                    return (
                      <Card key={entry.id} padding="none" hover onClick={() => { setEditingEntryId(entry.id); setSelectedDate(entry.date); }}
                        className={`bg-card border-theme rounded-[1.8rem] cursor-pointer overflow-hidden transition-all ${editingEntryId === entry.id ? 'ring-2 ring-primary border-primary shadow-lg' : 'shadow-sm'}`}>
                        <div className="flex items-center gap-6 p-4 md:p-6">
                          <div className="w-10 md:w-14 flex flex-col items-center shrink-0 border-r border-theme pr-4">
                             <span className="text-[7px] md:text-[9px] font-black text-muted uppercase mb-1.5">{d.toLocaleString('uk-UA', { weekday: 'short' })}</span>
                             <span className="text-base md:text-2xl font-black text-main">{d.getDate()}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-[13px] md:text-base font-black text-main truncate block uppercase">{title}</span>
                            <span className="text-[8px] font-black text-primary uppercase mt-1.5 block">{entry.date}</span>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              ))}
            </div>
          </main>
        </div>
      </div>

      <div className={`fixed inset-0 lg:relative lg:inset-auto h-full border-l border-theme bg-sidebar z-[2000] transition-all duration-300 ${editingEntryId ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'} flex ${isMobile && !editingEntryId ? 'pointer-events-none' : ''}`}>
         <div style={{ width: isMobile ? '100vw' : detailsWidth }} className="h-full bg-card shadow-2xl overflow-hidden flex flex-col">
            {editingEntryId && (
              <div className="flex-1 flex flex-col">
                <header className="p-4 border-b border-theme flex justify-between items-center bg-card shrink-0">
                  <div className="flex items-center gap-3">
                    <Typography variant="h3" className="text-xs font-black uppercase text-primary">Редагування</Typography>
                  </div>
                  <button onClick={() => setEditingEntryId(null)} className="w-9 h-9 rounded-xl bg-main flex items-center justify-center text-muted"><i className="fa-solid fa-xmark"></i></button>
                </header>
                <div className="flex-1 overflow-hidden">
                  <DiaryEditor id={editingEntryId === 'new' ? undefined : editingEntryId} date={selectedDate} onClose={() => setEditingEntryId(null)} />
                </div>
              </div>
            )}
         </div>
      </div>
      {showAiWizard && aiSuggestions && <DailyReportAiWizard suggestions={aiSuggestions} onClose={() => setShowAiWizard(false)} />}
    </div>
  );
};

export default DiaryView;