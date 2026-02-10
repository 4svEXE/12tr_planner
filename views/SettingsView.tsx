
import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { ThemeType, Character } from '../types';
import Typography from '../components/ui/Typography';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { useResizer } from '../hooks/useResizer';

const SettingsView: React.FC = () => {
  const { 
    theme, setTheme, aiEnabled, setAiEnabled, sidebarSettings, 
    updateSidebarSetting, character, updateCharacter,
    isSyncing, syncData, lastSyncTime,
    diaryNotificationEnabled, setDiaryNotificationEnabled,
    diaryNotificationTime, setDiaryNotificationTime
  } = useApp();
  const { user } = useAuth();
  
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);
  const { detailsWidth, startResizing, isResizing } = useResizer(400, 700);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    const savedKey = localStorage.getItem('GEMINI_API_KEY') || '';
    setApiKey(savedKey);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSaveApiKey = () => {
    localStorage.setItem('GEMINI_API_KEY', apiKey.trim());
    alert('API Ключ збережено. Тепер ви можете активувати ШІ.');
  };

  const handleSendFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim()) return;
    setFeedbackSent(true);
    setFeedback('');
    setTimeout(() => setFeedbackSent(false), 3000);
  };

  const handleFullReset = () => {
    if (confirm('Видалити ВСІ дані? Ця дія незворотна.')) {
      localStorage.clear();
      localStorage.setItem('12tr_guest_mode', 'true');
      window.location.reload();
    }
  };

  const sections = [
    { id: 'appearance', icon: 'fa-palette', label: 'Теми & Стиль', color: 'text-indigo-500', desc: 'Візуальний двигун' },
    { id: 'profile', icon: 'fa-user-astronaut', label: 'Профіль Героя', color: 'text-orange-500', desc: 'Ідентичність у грі' },
    { id: 'ai', icon: 'fa-wand-magic-sparkles', label: 'Gemini AI', color: 'text-emerald-500', desc: 'Інтелект системи' },
    { id: 'notifications', icon: 'fa-bell', label: 'Сповіщення', color: 'text-rose-500', desc: 'Push & Ритми' },
    { id: 'sidebar', icon: 'fa-bars-staggered', label: 'Навігація', color: 'text-amber-500', desc: 'Бокова панель' },
    { id: 'data', icon: 'fa-database', label: 'Хмара & Сховище', color: 'text-rose-500', desc: 'Синхронізація даних' },
    { id: 'feedback', icon: 'fa-comment-dots', label: 'Фідбек', color: 'text-violet-500', desc: 'Ідеї та пропозиції' },
  ];

  const themesData: {id: ThemeType, label: string, main: string, accent: string}[] = [
    { id: 'classic', label: 'Classic', main: '#ffffff', accent: '#f97316' },
    { id: 'midnight', label: 'Midnight', main: '#020617', accent: '#10b981' },
    { id: 'obsidian', label: 'Obsidian', main: '#000000', accent: '#8b5cf6' },
    { id: 'cyberpunk', label: 'Cyberpunk', main: '#09090b', accent: '#fef08a' },
    { id: 'dracula', label: 'Dracula', main: '#282a36', accent: '#ff79c6' },
    { id: 'nordic-dark', label: 'Nordic', main: '#2e3440', accent: '#88c0d0' },
    { id: 'sakura', label: 'Sakura', main: '#fff1f2', accent: '#ec4899' },
    { id: 'ocean', label: 'Ocean', main: '#f0f9ff', accent: '#0ea5e9' },
    { id: 'forest', label: 'Forest', main: '#f0fdf4', accent: '#166534' },
    { id: 'lavender', label: 'Lavender', main: '#faf5ff', accent: '#8b5cf6' },
    { id: 'desert', label: 'Desert', main: '#fffbeb', accent: '#d97706' },
    { id: 'mars', label: 'Mars', main: '#450a0a', accent: '#ef4444' },
    { id: 'slate', label: 'Slate', main: '#f8fafc', accent: '#475569' },
    { id: 'coffee', label: 'Coffee', main: '#fffaf0', accent: '#92400e' },
    { id: 'gold', label: 'Luxury', main: '#1e1b4b', accent: '#fbbf24' },
    { id: 'matrix', label: 'Matrix', main: '#000000', accent: '#00ff41' },
    { id: 'glass', label: 'Glass', main: '#6366f1', accent: '#ffffff' },
    { id: 'toxic', label: 'Toxic', main: '#1a1a1a', accent: '#ccff00' },
    { id: 'sepia', label: 'Sepia', main: '#f4ecd8', accent: '#704214' },
    { id: 'paper', label: 'Paper', main: '#f5f5f5', accent: '#3b82f6' },
    { id: 'blueprint', label: 'Blueprint', main: '#1e3a8a', accent: '#ffffff' },
    { id: 'gameboy', label: 'Gameboy', main: '#9bbc0f', accent: '#306230' },
    { id: 'spotify', label: 'Spotify', main: '#121212', accent: '#1db954' },
    { id: 'slack', label: 'Slack', main: '#ffffff', accent: '#4a154b' },
    { id: 'uber', label: 'Uber', main: '#000000', accent: '#ffffff' },
    { id: 'apple', label: 'Apple', main: '#f5f5f7', accent: '#007aff' },
    { id: 'stripe', label: 'Stripe', main: '#f6f9fc', accent: '#635bff' },
    { id: 'github', label: 'Github', main: '#0d1117', accent: '#2ea44f' },
    { id: 'clay', label: 'Clay', main: '#fdf2e9', accent: '#e67e22' },
    { id: 'olive', label: 'Olive', main: '#f5f5dc', accent: '#808000' }
  ];

  const renderContent = () => {
    switch (selectedSectionId) {
      case 'profile':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
             <div className="flex flex-col items-center gap-4 mb-4">
                <div className="w-20 h-20 rounded-[1.5rem] bg-[var(--bg-card)] p-1 ring-2 ring-[var(--primary)]/10 relative group shadow-lg">
                   <img src={character.avatarUrl} className="w-full h-full object-cover rounded-[1.2rem]" />
                   <button onClick={() => {const url = prompt('Avatar URL:', character.avatarUrl); if(url) updateCharacter({avatarUrl: url})}} className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-[1.2rem] text-white text-[8px] font-black uppercase">Змінити</button>
                </div>
                <Typography variant="tiny" className="text-[var(--text-muted)] text-[8px]">ID: {character.name.toUpperCase().replace(/\s+/g, '_')}</Typography>
             </div>
             <div className="space-y-4">
                <div className="space-y-1">
                   <label className="text-[9px] font-black uppercase text-[var(--text-muted)] ml-1">Псевдонім</label>
                   <input value={character.name} onChange={e => updateCharacter({name: e.target.value})} className="w-full h-6 bg-[var(--bg-card)] border border-[var(--border-color)] rounded px-3 text-xs font-bold outline-none text-main" />
                </div>
                <div className="p-3 bg-slate-900 rounded text-white">
                   <Typography variant="tiny" className="text-orange-500 mb-1 font-black">Статус Гравця</Typography>
                   <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold uppercase tracking-widest">Рівень {character.level}</span>
                      <span className="text-[9px] opacity-50">{character.xp} XP</span>
                   </div>
                </div>
             </div>
          </div>
        );
      case 'appearance':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 pb-20">
             <Typography variant="tiny" className="text-slate-400 font-black uppercase tracking-widest ml-1">Доступні візуальні схеми</Typography>
             <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {themesData.map(t => (
                  <button 
                    key={t.id} 
                    onClick={() => setTheme(t.id)} 
                    className={`p-2 rounded border-2 text-left transition-all ${theme === t.id ? 'border-[var(--primary)] bg-[var(--bg-main)] shadow-md' : 'border-[var(--border-color)] bg-[var(--bg-card)] hover:border-[var(--primary)]/30'}`}
                  >
                     <div className="flex justify-between items-center mb-1">
                        <span className="text-[6px] font-black uppercase tracking-widest truncate">{t.label}</span>
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: t.accent }}></div>
                     </div>
                     <div className="h-4 w-full rounded border border-[var(--border-color)]" style={{ backgroundColor: t.main }}></div>
                  </button>
                ))}
             </div>
          </div>
        );
      case 'notifications':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
             <Card className="border-[var(--border-color)] p-6 shadow-sm bg-white">
                <div className="flex items-center justify-between mb-6">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded bg-rose-500/10 flex items-center justify-center text-rose-500 text-lg shadow-sm">
                        <i className="fa-solid fa-book-open"></i>
                      </div>
                      <div>
                        <Typography variant="h3" className="text-[14px] font-black uppercase leading-tight">Підсумки дня</Typography>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Push-сповіщення щоденника</p>
                      </div>
                   </div>
                   <button 
                      onClick={() => setDiaryNotificationEnabled(!diaryNotificationEnabled)}
                      className={`w-10 h-5 rounded-full relative transition-all duration-300 ${diaryNotificationEnabled ? 'bg-rose-500' : 'bg-slate-200'}`}
                    >
                      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all duration-300 ${diaryNotificationEnabled ? 'right-0.5' : 'left-0.5'}`}></div>
                    </button>
                </div>

                <div className={`space-y-4 transition-all ${diaryNotificationEnabled ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                   <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Час сповіщення</label>
                      <input 
                        type="time" 
                        value={diaryNotificationTime}
                        onChange={e => setDiaryNotificationTime(e.target.value)}
                        className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-black text-slate-800 outline-none focus:ring-2 focus:ring-rose-500/20"
                      />
                   </div>
                   <p className="text-[9px] font-medium text-slate-500 italic px-1">
                      Система нагадає вам заповнити щоденник, щоб не втратитиXP та серію продуктивності.
                   </p>
                </div>
             </Card>
          </div>
        );
      case 'ai':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
             <Card className="border-[var(--border-color)] p-6 relative overflow-hidden shadow-xl">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--primary)]/10 blur-[60px]"></div>
                <div className="flex items-center justify-between mb-6">
                   <div className="w-10 h-10 rounded bg-[var(--primary)] flex items-center justify-center shadow-lg"><i className="fa-solid fa-wand-magic-sparkles text-lg text-white"></i></div>
                   <Badge variant="emerald" className="font-black text-[8px]">Active Assistant Ready</Badge>
                </div>
                <Typography variant="h2" className="mb-2 text-xl">Двигун Інтелекту</Typography>
                
                <div className="space-y-4">
                   <div className="bg-[var(--bg-main)] p-4 rounded border border-[var(--border-color)]">
                      <label className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] block mb-2 ml-1">Gemini Cloud API Key</label>
                      <div className="flex gap-2 items-center">
                        <div className="relative flex-1">
                          <input type={showKey ? "text" : "password"} value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="AIza..." className="w-full h-6 bg-[var(--bg-card)] border border-[var(--border-color)] rounded px-2 text-[10px] font-mono outline-none focus:border-[var(--primary)] text-main" />
                          <button onClick={() => setShowKey(!showKey)} className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--primary)]"><i className={`fa-solid ${showKey ? 'fa-eye-slash' : 'fa-eye'} text-[9px]`}></i></button>
                        </div>
                        <button onClick={handleSaveApiKey} className="h-6 bg-slate-900 text-white px-3 rounded text-[8px] font-black uppercase transition-all shadow-md shrink-0">ЗБЕРЕГТИ</button>
                      </div>
                   </div>

                   <div className="bg-indigo-600 p-4 rounded text-white shadow-lg flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded bg-white/20 flex items-center justify-center text-xs"><i className="fa-solid fa-power-off"></i></div>
                         <div className="text-[9px] font-black uppercase tracking-widest">ШІ Статус: {aiEnabled ? 'УВІМК' : 'ВИМК'}</div>
                      </div>
                      <button 
                        onClick={() => setAiEnabled(!aiEnabled)} 
                        className={`w-10 h-5 rounded-full relative transition-all duration-300 ${aiEnabled ? 'bg-emerald-400' : 'bg-white/20'}`}
                      >
                         <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all duration-300 ${aiEnabled ? 'right-0.5' : 'left-0.5'}`}></div>
                      </button>
                   </div>
                </div>
             </Card>
          </div>
        );
      case 'sidebar':
        const navItems = [
          { id: 'inbox', icon: 'fa-inbox', label: 'Вхідні' },
          { id: 'next_actions', icon: 'fa-bolt', label: 'Наступні' },
          { id: 'planner', icon: 'fa-calendar-check', label: 'Планувальник' },
          { id: 'projects', icon: 'fa-folder-tree', label: 'Проєкти' },
          { id: 'calendar', icon: 'fa-calendar-days', label: 'Календар' },
          { id: 'notes', icon: 'fa-note-sticky', label: 'Нотатки' },
        ];
        return (
          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
             <Typography variant="tiny" className="text-[var(--text-muted)] font-black uppercase tracking-widest ml-2 mb-1">Видимість модулів</Typography>
             <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded overflow-hidden shadow-sm divide-y divide-[var(--border-color)]">
                {navItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 hover:bg-[var(--bg-main)] transition-colors">
                     <div className="flex items-center gap-3">
                        <i className={`fa-solid ${item.icon} text-xs text-[var(--text-muted)] w-4 text-center`}></i>
                        <span className="text-[10px] font-bold uppercase tracking-tight text-main">{item.label}</span>
                     </div>
                     <button 
                        onClick={() => updateSidebarSetting(item.id, sidebarSettings[item.id] === false)}
                        className={`w-9 h-5 rounded-full transition-all relative ${sidebarSettings[item.id] !== false ? 'bg-[var(--primary)]' : 'bg-[var(--text-muted)]/20'}`}
                      >
                         <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${sidebarSettings[item.id] !== false ? 'right-0.5' : 'left-0.5'}`}></div>
                      </button>
                  </div>
                ))}
             </div>
          </div>
        );
      case 'data':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
             {user && (
                <Card padding="sm" className="bg-indigo-50/50 border-indigo-100">
                   <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                         <div className={`w-10 h-10 rounded bg-white border flex items-center justify-center text-lg ${isSyncing ? 'text-indigo-600 animate-spin border-indigo-100' : 'text-emerald-500 border-emerald-100'}`}>
                            <i className={`fa-solid ${isSyncing ? 'fa-rotate' : 'fa-cloud-check'}`}></i>
                         </div>
                         <div>
                            <div className="text-[10px] font-black text-slate-800 uppercase leading-none mb-1">Синхронізація</div>
                            <div className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">
                               {lastSyncTime ? `Оновлено: ${new Date(lastSyncTime).toLocaleString('uk-UA')}` : 'Ніколи'}
                            </div>
                         </div>
                      </div>
                      <button 
                        onClick={syncData}
                        disabled={isSyncing}
                        className="px-4 py-1.5 bg-indigo-600 text-white rounded text-[8px] font-black uppercase tracking-widest shadow-lg active:scale-95 disabled:opacity-50 transition-all"
                      >
                        ОНОВИТИ ЗАРАЗ
                      </button>
                   </div>
                </Card>
             )}

             <Card padding="md" className="border-rose-100 bg-rose-50/20">
                <Typography variant="h2" className="text-rose-600 mb-2 text-sm">Очищення</Typography>
                <button onClick={handleFullReset} className="w-full py-3 rounded bg-white text-rose-500 border border-rose-100 text-[9px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all shadow-sm">ОЧИСТИТИ ЛОКАЛЬНЕ СХОВИЩЕ</button>
             </Card>
          </div>
        );
      case 'feedback':
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Typography variant="tiny" className="text-violet-500 font-black mb-2 uppercase">Ваш відгук</Typography>
            <form onSubmit={handleSendFeedback} className="space-y-4">
              <textarea 
                value={feedback} 
                onChange={e => setFeedback(e.target.value)}
                placeholder="Ваша ідея..." 
                className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded p-4 text-xs font-medium outline-none min-h-[120px] resize-none leading-relaxed text-main"
              />
              <button 
                type="submit" 
                disabled={!feedback.trim() || feedbackSent}
                className={`w-full py-3 rounded font-black uppercase tracking-widest text-[9px] transition-all shadow-lg ${feedbackSent ? 'bg-emerald-500 text-white' : 'bg-indigo-600 text-white hover:scale-[1.01] active:scale-95'}`}
              >
                {feedbackSent ? 'ВІДПРАВЛЕНО!' : 'ВІДПРАВИТИ'}
              </button>
            </form>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="h-screen flex flex-col lg:flex-row overflow-hidden relative bg-[var(--bg-main)]">
      <div className={`flex-1 flex flex-col min-w-0 h-full relative transition-all duration-300 ${isMobile && selectedSectionId ? '-translate-x-full absolute' : 'translate-x-0 relative'}`}>
        <header className="px-6 py-6 bg-[var(--bg-card)] border-b border-[var(--border-color)] sticky top-0 z-20 shrink-0">
          <Typography variant="h1" className="text-xl md:text-2xl font-black tracking-tight uppercase">Налаштування</Typography>
          <Typography variant="tiny" className="text-[var(--text-muted)] mt-1 uppercase tracking-[0.2em] text-[8px]">Система 12TR Engine</Typography>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 space-y-1.5">
           {sections.map(section => (
             <Card 
               key={section.id} 
               padding="none" 
               onClick={() => setSelectedSectionId(section.id)}
               className={`p-3 flex items-center justify-between group transition-all cursor-pointer border rounded ${selectedSectionId === section.id ? 'bg-[var(--bg-card)] border-[var(--primary)] shadow-md' : 'bg-[var(--bg-card)] border-[var(--border-color)] hover:border-[var(--primary)]/30 shadow-sm'}`}
             >
               <div className="flex items-center gap-3 flex-1 min-w-0 text-left">
                  <div className={`w-8 h-8 rounded bg-[var(--bg-main)] flex items-center justify-center shrink-0 shadow-inner ${section.color}`}>
                     <i className={`fa-solid ${section.icon} text-sm`}></i>
                  </div>
                  <div className="flex-1 min-w-0">
                     <Typography variant="h3" className="text-[11px] font-black uppercase truncate group-hover:text-[var(--primary)] transition-colors">{section.label}</Typography>
                     <p className="text-[8px] font-bold text-[var(--text-muted)] uppercase truncate">{section.desc}</p>
                  </div>
               </div>
               <i className="fa-solid fa-chevron-right text-[8px] text-[var(--text-muted)] group-hover:text-[var(--primary)] group-hover:translate-x-0.5 transition-all"></i>
             </Card>
           ))}
        </div>
      </div>

      <div className={`flex h-full border-l border-[var(--border-color)] z-[110] bg-[var(--bg-card)] shrink-0 transition-all duration-300 ${isMobile ? (selectedSectionId ? 'fixed inset-0 w-full translate-x-0' : 'fixed inset-0 w-full translate-x-full') : ''}`}>
        {!isMobile && (
          <div onMouseDown={startResizing} className={`w-[1px] h-full cursor-col-resize hover:bg(--primary) z-[120] transition-colors ${isResizing ? 'bg-[var(--primary)]' : 'bg-[var(--border-color)]'}`}></div>
        )}
        <div style={{ width: isMobile ? '100vw' : detailsWidth }} className="h-full bg-[var(--bg-card)] relative overflow-hidden flex flex-col shadow-2xl">
           {selectedSectionId ? (
             <div className="h-full flex flex-col">
                <header className="p-4 md:p-6 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-card)] shrink-0">
                   <div className="flex items-center gap-3">
                      {isMobile && (
                        <button onClick={() => setSelectedSectionId(null)} className="w-8 h-8 rounded bg-[var(--bg-main)] flex items-center justify-center text-[var(--text-muted)]">
                           <i className="fa-solid fa-chevron-left text-xs"></i>
                        </button>
                      )}
                      <div className={`w-8 h-8 rounded flex items-center justify-center text-white shadow-md bg-[var(--primary)]`}>
                        <i className={`fa-solid ${sections.find(s => s.id === selectedSectionId)?.icon} text-xs`}></i>
                      </div>
                      <Typography variant="h2" className="text-sm font-black uppercase tracking-tight">{sections.find(s => s.id === selectedSectionId)?.label}</Typography>
                   </div>
                </header>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10 bg-[var(--bg-main)]/30">
                   <div className="max-w-xl mx-auto">
                     {renderContent()}
                   </div>
                </div>
                <footer className="p-4 md:p-6 border-t border-[var(--border-color)] bg-[var(--bg-card)] shrink-0 pb-safe">
                   <Button onClick={() => setSelectedSectionId(null)} className="w-full h-10 rounded font-black uppercase tracking-widest text-[9px]">ГОТОВО</Button>
                </footer>
             </div>
           ) : (
             !isMobile && (
               <div className="h-full flex flex-col items-center justify-center p-12 text-center opacity-5 grayscale pointer-events-none select-none">
                  <i className="fa-solid fa-gear text-9xl mb-8"></i>
                  <Typography variant="h2" className="text-2xl font-black uppercase tracking-widest">Параметри Двигуна</Typography>
               </div>
             )
           )}
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
