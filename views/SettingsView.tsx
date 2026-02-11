import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { ThemeType, Character } from '../types';
import Typography from '../components/ui/Typography';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { useResizer } from '../hooks/useResizer';
import ReportDesigner from '../components/settings/ReportDesigner';

const CleanupModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { clearSelectedData } = useApp();
  const [selected, setSelected] = useState<string[]>([]);
  const [confirmText, setConfirmText] = useState('');

  const categories = [
    { id: 'tasks', label: 'Квести та вхідні', icon: 'fa-bolt' },
    { id: 'projects', label: 'Цілі та проєкти', icon: 'fa-flag-checkered' },
    { id: 'people', label: 'Мережа союзників', icon: 'fa-user-ninja' },
    { id: 'diary', label: 'Щоденник та записи', icon: 'fa-book-open' },
    { id: 'shopping', label: 'Списки покупок', icon: 'fa-cart-shopping' },
    { id: 'routine', label: 'Розпорядок та пресети', icon: 'fa-clock' },
    { id: 'character', label: 'Профіль героя та Акваріум', icon: 'fa-user-astronaut' },
  ];

  const toggle = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleCleanup = () => {
    if (confirmText.toLowerCase() !== 'видалити') return alert('Введіть слово ВИДАЛИТИ для підтвердження');
    clearSelectedData(selected);
    onClose();
    alert('Обрані дані успішно очищено.');
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 tiktok-blur">
      <div className="absolute inset-0 bg-black/60" onClick={onClose}></div>
      <Card className="w-full max-w-md relative z-10 shadow-2xl p-6 md:p-8 rounded-[2.5rem] bg-white border-theme animate-in zoom-in-95 duration-200 overflow-hidden">
        <Typography variant="h2" className="text-xl mb-2 text-rose-600 font-black uppercase">Очищення Сховища</Typography>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-6">Оберіть категорії для повного видалення</p>
        
        <div className="space-y-2 mb-8">
           {categories.map(cat => (
             <label key={cat.id} className="flex items-center gap-4 p-3 rounded-2xl bg-slate-50 border border-slate-100 cursor-pointer hover:bg-slate-100 transition-all">
                <input type="checkbox" checked={selected.includes(cat.id)} onChange={() => toggle(cat.id)} className="w-5 h-5 rounded-lg accent-rose-500" />
                <div className="flex items-center gap-3 flex-1">
                   <i className={`fa-solid ${cat.icon} text-slate-400 w-4 text-center`}></i>
                   <span className="text-xs font-bold text-slate-700">{cat.label}</span>
                </div>
             </label>
           ))}
        </div>

        <div className="space-y-4">
           <div>
              <label className="text-[8px] font-black uppercase text-slate-400 ml-1 block mb-2">Напишіть "видалити" для підтвердження</label>
              <input value={confirmText} onChange={e => setConfirmText(e.target.value)} placeholder="Напишіть видалити..." className="w-full h-10 bg-slate-50 border-2 border-rose-100 rounded-xl px-4 text-sm font-bold outline-none focus:border-rose-500 text-rose-600" />
           </div>
           <div className="flex gap-3">
              <Button variant="white" className="flex-1" onClick={onClose}>СКАСУВАТИ</Button>
              <Button 
                disabled={selected.length === 0 || confirmText.toLowerCase() !== 'видалити'} 
                variant="primary" 
                className="flex-[2] bg-rose-600 hover:bg-rose-700 shadow-rose-200" 
                onClick={handleCleanup}
              >
                ОЧИСТИТИ ОБРАНЕ ({selected.length})
              </Button>
           </div>
        </div>
      </Card>
    </div>
  );
};

const SettingsView: React.FC = () => {
  const { 
    theme, setTheme, aiEnabled, setAiEnabled, sidebarSettings, 
    updateSidebarSetting, character, updateCharacter,
    isSyncing, syncData, lastSyncTime,
    diaryNotificationEnabled, setDiaryNotificationEnabled,
    diaryNotificationTime, setDiaryNotificationTime,
    setActiveTab
  } = useApp();
  const { user, login, logout, isGuest } = useAuth();
  
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>('account');
  const [showCleanup, setShowCleanup] = useState(false);
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

  const sections = [
    { id: 'account', icon: 'fa-user-circle', label: 'Мій Акаунт', color: 'text-blue-500', desc: 'Google Sync & Профіль' },
    { id: 'appearance', icon: 'fa-palette', label: 'Теми & Стиль', color: 'text-indigo-500', desc: 'Візуальний двигун' },
    { id: 'profile', icon: 'fa-user-astronaut', label: 'Герой RPG', color: 'text-orange-500', desc: 'Ідентичність у грі' },
    { id: 'report', icon: 'fa-chart-line', label: 'Звіт Дня', color: 'text-rose-500', desc: 'Конструктор ретроспекції' },
    { id: 'ai', icon: 'fa-wand-magic-sparkles', label: 'Gemini AI', color: 'text-emerald-500', desc: 'Інтелект системи' },
    { id: 'notifications', icon: 'fa-bell', label: 'Сповіщення', color: 'text-rose-500', desc: 'Push & Ритми' },
    { id: 'data', icon: 'fa-database', label: 'Дані та Сховище', color: 'text-rose-600', desc: 'Хмара та Очищення' },
    { id: 'feedback', icon: 'fa-comment-dots', label: 'Фідбек', color: 'text-violet-500', desc: 'Ідеї та пропозиції' },
  ];

  const themesData: {id: ThemeType, label: string, main: string, accent: string}[] = [
    { id: 'classic', label: 'Classic', main: '#ffffff', accent: '#f97316' },
    { id: 'midnight', label: 'Midnight', main: '#020617', accent: '#10b981' },
    { id: 'obsidian', label: 'Obsidian', main: '#000000', accent: '#8b5cf6' },
    { id: 'cyberpunk', label: 'Cyberpunk', main: '#09090b', accent: '#fef08a' },
    { id: 'dracula', label: 'Dracula', main: '#282a36', accent: '#ff79c6' },
    { id: 'sakura', label: 'Sakura', main: '#fff1f2', accent: '#ec4899' },
    { id: 'ocean', label: 'Ocean', main: '#f0f9ff', accent: '#0ea5e9' },
    { id: 'forest', label: 'Forest', main: '#f0fdf4', accent: '#166534' },
    { id: 'sepia', label: 'Sepia', main: '#f4ecd8', accent: '#704214' }
  ];

  const renderContent = () => {
    switch (selectedSectionId) {
      case 'account':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
             {isGuest ? (
               <Card padding="lg" className="bg-gradient-to-br from-indigo-600 to-blue-700 text-white border-none shadow-xl relative overflow-hidden">
                  <div className="relative z-10 flex flex-col items-center text-center">
                     <div className="w-16 h-16 rounded-3xl bg-white/20 flex items-center justify-center text-3xl mb-6 shadow-inner"><i className="fa-solid fa-cloud-arrow-up"></i></div>
                     <Typography variant="h2" className="text-white text-xl mb-2">Хмарна синхронізація</Typography>
                     <p className="text-xs text-white/70 mb-8 max-w-[240px]">Увійдіть через Google, щоб ваші квести та союзники були доступні на всіх пристроях.</p>
                     <button onClick={login} className="w-full bg-white text-indigo-600 py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-4 hover:scale-[1.02] active:scale-95 transition-all shadow-xl">
                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" />
                        Увійти з Google
                     </button>
                  </div>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl -mr-10 -mt-10"></div>
               </Card>
             ) : (
               <div className="space-y-4">
                  <Card className="p-6 border-theme bg-white">
                     <div className="flex items-center gap-4 mb-6">
                        <img src={user?.photoURL || ''} className="w-12 h-12 rounded-2xl border-2 border-slate-100 shadow-sm" />
                        <div className="min-w-0">
                           <div className="text-sm font-black text-slate-800 truncate">{user?.displayName}</div>
                           <div className="text-[10px] font-bold text-slate-400 truncate uppercase tracking-tight">{user?.email}</div>
                        </div>
                        <Badge variant="emerald" className="ml-auto text-[7px]">ACTIVE</Badge>
                     </div>
                     <div className="h-px bg-slate-50 mb-6"></div>
                     <button onClick={logout} className="w-full py-3 bg-rose-50 text-rose-500 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all">Вийти з акаунта</button>
                  </Card>
               </div>
             )}
          </div>
        );
      case 'report':
        return <ReportDesigner />;
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
                   <input value={character.name} onChange={e => updateCharacter({name: e.target.value})} className="w-full h-8 bg-[var(--bg-card)] border border-[var(--border-color)] rounded px-3 text-xs font-bold outline-none text-main" />
                </div>
                <div className="space-y-1">
                   <label className="text-[9px] font-black uppercase text-[var(--text-muted)] ml-1">Біографія Героя</label>
                   <textarea value={character.bio} onChange={e => updateCharacter({bio: e.target.value})} className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded p-3 text-xs font-medium outline-none min-h-[100px] resize-none leading-relaxed text-main" placeholder="Хто ви у цьому світі?.." />
                </div>
                <div className="space-y-1">
                   <label className="text-[9px] font-black uppercase text-[var(--text-muted)] ml-1">Глобальна Візія</label>
                   <textarea value={character.vision} onChange={e => updateCharacter({vision: e.target.value})} className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded p-3 text-xs font-medium italic outline-none min-h-[80px] resize-none leading-relaxed text-main" placeholder="Яка ваша фінальна мета?.." />
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
                      <input type="time" value={diaryNotificationTime} onChange={e => setDiaryNotificationTime(e.target.value)} className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-black text-slate-800 outline-none" />
                   </div>
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
                      <button onClick={() => setAiEnabled(!aiEnabled)} className={`w-10 h-5 rounded-full relative transition-all duration-300 ${aiEnabled ? 'bg-emerald-400' : 'bg-white/20'}`}><div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all duration-300 ${aiEnabled ? 'right-0.5' : 'left-0.5'}`}></div></button>
                   </div>
                </div>
             </Card>
          </div>
        );
      case 'data':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
             {user && (
                <Card padding="sm" className="bg-indigo-50/50 border-indigo-100">
                   <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                         <div className={`w-10 h-10 rounded bg-white border flex items-center justify-center text-lg ${isSyncing ? 'text-indigo-600 animate-spin border-indigo-100' : 'text-emerald-500 border-emerald-100'}`}><i className={`fa-solid ${isSyncing ? 'fa-rotate' : 'fa-cloud-check'}`}></i></div>
                         <div>
                            <div className="text-[10px] font-black text-slate-800 uppercase leading-none mb-1">Синхронізація</div>
                            <div className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">{lastSyncTime ? `Оновлено: ${new Date(lastSyncTime).toLocaleString('uk-UA')}` : 'Ніколи'}</div>
                         </div>
                      </div>
                      <button onClick={syncData} disabled={isSyncing} className="px-4 py-1.5 bg-indigo-600 text-white rounded text-[8px] font-black uppercase tracking-widest shadow-lg active:scale-95 disabled:opacity-50 transition-all">ОНОВИТИ ЗАРАЗ</button>
                   </div>
                </Card>
             )}
             <Card padding="md" className="border-rose-100 bg-rose-50/20">
                <Typography variant="h3" className="text-rose-600 mb-2 text-sm font-black uppercase">Управління даними</Typography>
                <p className="text-[10px] text-slate-500 font-bold uppercase mb-4 leading-relaxed tracking-tight">Повне або вибіркове очищення вашого простору в локальному сховищі та хмарі.</p>
                <button 
                  onClick={() => setShowCleanup(true)} 
                  className="w-full py-4 rounded-2xl bg-white text-rose-500 border-2 border-rose-100 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                >
                   Хірургічне очищення...
                </button>
             </Card>
          </div>
        );
      case 'feedback':
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Typography variant="tiny" className="text-violet-500 font-black mb-2 uppercase">Ваш відгук</Typography>
            <form onSubmit={handleSendFeedback} className="space-y-4">
              <textarea value={feedback} onChange={e => setFeedback(e.target.value)} placeholder="Ваша ідея..." className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded p-4 text-xs font-medium outline-none min-h-[120px] resize-none leading-relaxed text-main" />
              <button type="submit" disabled={!feedback.trim() || feedbackSent} className={`w-full py-3 rounded font-black uppercase tracking-widest text-[9px] transition-all shadow-lg ${feedbackSent ? 'bg-emerald-500 text-white' : 'bg-indigo-600 text-white hover:scale-[1.01] active:scale-95'}`}>{feedbackSent ? 'ВІДПРАВЛЕНО!' : 'ВІДПРАВИТИ'}</button>
            </form>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="h-screen flex flex-col lg:flex-row overflow-hidden relative bg-[var(--bg-main)]">
      <div className={`flex-1 flex flex-col min-w-0 h-full relative transition-all duration-300 ${isMobile && selectedSectionId ? '-translate-x-full absolute' : 'translate-x-0 relative'}`}>
        <header className="px-6 py-6 bg-[var(--bg-card)] border-b border-[var(--border-color)] sticky top-0 z-20 shrink-0 flex justify-between items-start">
          <div>
            <Typography variant="h1" className="text-xl md:text-2xl font-black tracking-tight uppercase">Налаштування</Typography>
            <Typography variant="tiny" className="text-[var(--text-muted)] mt-1 uppercase tracking-[0.2em] text-[8px]">Система 12TR Engine</Typography>
          </div>
          {isMobile && (
            <button 
              onClick={() => setActiveTab('today')}
              className="w-10 h-10 rounded-2xl bg-black/5 flex items-center justify-center text-slate-400 active:scale-90 transition-all"
            >
              <i className="fa-solid fa-xmark text-lg"></i>
            </button>
          )}
        </header>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 space-y-1.5">
           {sections.map(section => (
             <Card key={section.id} padding="none" onClick={() => setSelectedSectionId(section.id)} className={`p-3 flex items-center justify-between group transition-all cursor-pointer border rounded ${selectedSectionId === section.id ? 'bg-[var(--bg-card)] border-[var(--primary)] shadow-md' : 'bg-[var(--bg-card)] border-[var(--border-color)] hover:border-[var(--primary)]/30 shadow-sm'}`}>
               <div className="flex items-center gap-3 flex-1 min-w-0 text-left">
                  <div className={`w-8 h-8 rounded bg-[var(--bg-main)] flex items-center justify-center shrink-0 shadow-inner ${section.color}`}><i className={`fa-solid ${section.icon} text-sm`}></i></div>
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
          <div onMouseDown={startResizing} className={`absolute left-0 top-0 bottom-0 w-[1px] h-full cursor-col-resize hover:bg-primary z-[120] transition-colors ${isResizing ? 'bg-primary' : 'bg-[var(--border-color)]'}`}></div>
        )}
        <div style={{ width: isMobile ? '100vw' : detailsWidth }} className="h-full bg-[var(--bg-card)] relative overflow-hidden flex flex-col shadow-2xl">
           {selectedSectionId ? (
             <div className="h-full flex flex-col">
                <header className="p-4 md:p-6 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-card)] shrink-0">
                   <div className="flex items-center gap-3">
                      {isMobile && (
                        <button onClick={() => setSelectedSectionId(null)} className="w-10 h-10 rounded-2xl bg-[var(--bg-main)] flex items-center justify-center text-slate-400 hover:text-rose-500 transition-all">
                          <i className="fa-solid fa-xmark"></i>
                        </button>
                      )}
                      <div className={`w-8 h-8 rounded flex items-center justify-center text-white shadow-md bg-[var(--primary)]`}><i className={`fa-solid ${sections.find(s => s.id === selectedSectionId)?.icon} text-xs`}></i></div>
                      <Typography variant="h2" className="text-sm font-black uppercase tracking-tight">{sections.find(s => s.id === selectedSectionId)?.label}</Typography>
                   </div>
                </header>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10 bg-[var(--bg-main)]/30">
                   <div className="max-w-2xl mx-auto">{renderContent()}</div>
                </div>
                <footer className="p-4 md:p-6 border-t border-[var(--border-color)] bg-[var(--bg-card)] shrink-0 pb-safe">
                   <Button onClick={() => setSelectedSectionId(null)} className="w-full h-10 rounded font-black uppercase tracking-widest text-[9px]">ГОТОВО</Button>
                </footer>
             </div>
           ) : (!isMobile && <div className="h-full flex flex-col items-center justify-center p-12 text-center opacity-5 grayscale pointer-events-none select-none"><i className="fa-solid fa-gear text-9xl mb-8"></i><Typography variant="h2" className="text-2xl font-black uppercase tracking-widest">Параметри Двигуна</Typography></div>)}
        </div>
      </div>

      {showCleanup && <CleanupModal onClose={() => setShowCleanup(false)} />}
    </div>
  );
};

export default SettingsView;