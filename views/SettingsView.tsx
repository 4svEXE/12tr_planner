
import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { ThemeType, Character } from '../types';
import Typography from '../components/ui/Typography';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { useResizer } from '../hooks/useResizer';

const SettingsView: React.FC = () => {
  const { 
    theme, setTheme, aiEnabled, setAiEnabled, sidebarSettings, 
    updateSidebarSetting, character, updateCharacter 
  } = useApp();
  
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(window.innerWidth < 1024 ? null : 'profile');
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);
  const { isResizing, startResizing, detailsWidth } = useResizer(400, 700);

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
    alert('API Ключ збережено.');
  };

  const handleSendFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim()) return;
    setFeedbackSent(true);
    setFeedback('');
    setTimeout(() => setFeedbackSent(false), 3000);
  };

  const sections = [
    { id: 'profile', icon: 'fa-user-astronaut', label: 'Профіль Героя', color: 'text-orange-500', desc: 'Ідентичність у грі' },
    { id: 'appearance', icon: 'fa-palette', label: 'Теми & Стиль', color: 'text-indigo-500', desc: 'Візуальний двигун' },
    { id: 'ai', icon: 'fa-wand-magic-sparkles', label: 'Gemini AI', color: 'text-emerald-500', desc: 'Інтелект системи' },
    { id: 'ai-roadmap', icon: 'fa-brain-circuit', label: 'ШІ Стратегія', color: 'text-pink-500', desc: 'Пропозиції розвитку' },
    { id: 'sidebar', icon: 'fa-bars-staggered', label: 'Навігація', color: 'text-amber-500', desc: 'Бокова панель' },
    { id: 'data', icon: 'fa-database', label: 'Сховище', color: 'text-rose-500', desc: 'Резервні копії' },
    { id: 'feedback', icon: 'fa-comment-dots', label: 'Фідбек', color: 'text-violet-500', desc: 'Ідеї та пропозиції' },
  ];

  const themesData: {id: ThemeType, label: string, main: string, accent: string}[] = [
    { id: 'classic', label: 'Classic', main: '#ffffff', accent: '#f97316' },
    { id: 'midnight', label: 'Midnight', main: '#020617', accent: '#10b981' },
    { id: 'obsidian', label: 'Obsidian', main: '#000000', accent: '#8b5cf6' },
    { id: 'cyberpunk', label: 'Cyberpunk', main: '#09090b', accent: '#fef08a' },
    { id: 'nordic-dark', label: 'Nordic', main: '#2e3440', accent: '#88c0d0' },
    { id: 'diablo', label: 'Diablo', main: '#0a0000', accent: '#991b1b' },
    { id: 'witcher', label: 'Witcher', main: '#1c1917', accent: '#4ade80' },
    { id: 'minecraft', label: 'Minecraft', main: '#313131', accent: '#15803d' },
    { id: 'fallout', label: 'Fallout', main: '#052e16', accent: '#4ade80' },
    { id: 'skyrim', label: 'Skyrim', main: '#0f172a', accent: '#94a3b8' },
    { id: 'sakura', label: 'Sakura', main: '#fff1f2', accent: '#ec4899' },
    { id: 'ocean', label: 'Ocean', main: '#f0f9ff', accent: '#0ea5e9' },
    { id: 'forest', label: 'Forest', main: '#f0fdf4', accent: '#166534' },
    { id: 'lavender', label: 'Lavender', main: '#faf5ff', accent: '#8b5cf6' },
    { id: 'desert', label: 'Desert', main: '#fffbeb', accent: '#b45309' },
    { id: 'toxic', label: 'Toxic', main: '#020617', accent: '#bef264' },
    { id: 'synthwave', label: 'Synthwave', main: '#2e1065', accent: '#f472b6' },
    { id: 'mars', label: 'Mars', main: '#450a0a', accent: '#ef4444' },
    { id: 'gold', label: 'Golden', main: '#1e1b4b', accent: '#fbbf24' },
    { id: 'matrix', label: 'Matrix', main: '#000000', accent: '#22c55e' },
    { id: 'slate', label: 'Slate', main: '#f8fafc', accent: '#475569' },
    { id: 'glass', label: 'Glass', main: '#0f172a', accent: '#ffffff' },
    { id: 'coffee', label: 'Coffee', main: '#fafaf9', accent: '#92400e' },
    { id: 'linear', label: 'Linear', main: '#08090a', accent: '#5e6ad2' },
    { id: 'apple', label: 'Apple', main: '#f5f5f7', accent: '#007aff' },
    { id: 'uber', label: 'Uber', main: '#000000', accent: '#22c55e' },
    { id: 'slack', label: 'Slack', main: '#ffffff', accent: '#4a154b' },
    { id: 'spotify', label: 'Spotify', main: '#121212', accent: '#1db954' },
    { id: 'stripe', label: 'Stripe', main: '#f6f9fc', accent: '#635bff' },
    { id: 'github', label: 'Github', main: '#ffffff', accent: '#2ea44f' },
    { id: 'clay', label: 'Clay', main: '#fff7ed', accent: '#c2410c' },
    { id: 'olive', label: 'Olive', main: '#f7fee7', accent: '#65a30d' },
    { id: 'steel', label: 'Steel', main: '#f1f5f9', accent: '#334155' },
    { id: 'wine', label: 'Wine', main: '#fdf2f2', accent: '#991b1b' },
    { id: 'midnight-blue', label: 'Deep Blue', main: '#0f172a', accent: '#3b82f6' },
    { id: 'gameboy', label: 'Gameboy', main: '#9bbc0f', accent: '#306230' },
    { id: 'commodore', label: 'Commodore', main: '#4040ff', accent: '#7070ff' },
    { id: 'sepia', label: 'Sepia', main: '#fef3c7', accent: '#78350f' },
    { id: 'paper', label: 'Paper', main: '#fcfcfc', accent: '#1e293b' },
    { id: 'blueprint', label: 'Blueprint', main: '#1e40af', accent: '#ffffff' },
  ];

  const navItems = [
    { id: 'today', icon: 'fa-star', label: 'Сьогодні' },
    { id: 'dashboard', icon: 'fa-house', label: 'Головна' },
    { id: 'inbox', icon: 'fa-inbox', label: 'Вхідні' },
    { id: 'next_actions', icon: 'fa-bolt', label: 'Наступні' },
    { id: 'projects', icon: 'fa-folder-tree', label: 'Проєкти' },
    { id: 'calendar', icon: 'fa-calendar-days', label: 'Календар' },
    { id: 'notes', icon: 'fa-note-sticky', label: 'Нотатки' },
    { id: 'map', icon: 'fa-map-location-dot', label: 'Карта' },
    { id: 'diary', icon: 'fa-book-open', label: 'Щоденник' },
    { id: 'habits', icon: 'fa-repeat', label: 'Звички' },
    { id: 'people', icon: 'fa-user-ninja', label: 'Люди' },
    { id: 'hashtags', icon: 'fa-hashtag', label: 'Теги' },
    { id: 'hobbies', icon: 'fa-masks-theater', label: 'Хобі' },
    { id: 'focus', icon: 'fa-bullseye', label: 'Фокус' },
    { id: 'character', icon: 'fa-user-shield', label: 'Герой' },
    { id: 'shopping', icon: 'fa-cart-shopping', label: 'Покупки' },
    { id: 'completed', icon: 'fa-circle-check', label: 'Готово' },
    { id: 'trash', icon: 'fa-trash-can', label: 'Корзина' },
  ];

  const renderContent = () => {
    switch (selectedSectionId) {
      case 'profile':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
             <div className="flex flex-col items-center gap-4 mb-4">
                <div className="w-24 h-24 rounded-[2.5rem] bg-[var(--bg-card)] p-1 ring-4 ring-[var(--primary)]/10 relative group shadow-2xl">
                   <img src={character.avatarUrl} className="w-full h-full object-cover rounded-[2.2rem]" />
                   <button onClick={() => {const url = prompt('Avatar URL:', character.avatarUrl); if(url) updateCharacter({avatarUrl: url})}} className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-[2.2rem] text-white text-[10px] font-black uppercase">Змінити</button>
                </div>
                <Typography variant="tiny" className="text-[var(--text-muted)]">ID: {character.name.toUpperCase().replace(/\s+/g, '_')}</Typography>
             </div>
             <div className="space-y-5">
                <div className="space-y-1.5">
                   <label className="text-[10px] font-black uppercase text-[var(--text-muted)] ml-1">Псевдонім</label>
                   <input value={character.name} onChange={e => updateCharacter({name: e.target.value})} className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl py-4 px-5 text-sm font-bold focus:ring-4 focus:ring-[var(--primary)]/10 outline-none transition-all shadow-sm" />
                </div>
             </div>
          </div>
        );
      case 'appearance':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 pb-20">
             <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {themesData.map(t => (
                  <button 
                    key={t.id} 
                    onClick={() => setTheme(t.id)} 
                    className={`p-3 rounded-[1.2rem] border-2 text-left transition-all ${theme === t.id ? 'border-[var(--primary)] bg-[var(--bg-main)] shadow-lg scale-[1.05]' : 'border-[var(--border-color)] bg-[var(--bg-card)] hover:border-[var(--primary)]/30'}`}
                  >
                     <div className="flex justify-between items-center mb-2">
                        <span className="text-[7px] font-black uppercase tracking-widest truncate">{t.label}</span>
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: t.accent }}></div>
                     </div>
                     <div className="h-6 w-full rounded-md border border-[var(--border-color)]" style={{ backgroundColor: t.main }}></div>
                  </button>
                ))}
             </div>
          </div>
        );
      case 'ai':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
             <Card className="border-[var(--border-color)] p-8 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-48 h-48 bg-[var(--primary)]/10 blur-[80px]"></div>
                <div className="flex items-center justify-between mb-6">
                   <div className="w-12 h-12 rounded-2xl bg-[var(--primary)] flex items-center justify-center shadow-lg"><i className="fa-solid fa-wand-magic-sparkles text-xl text-white"></i></div>
                   <button onClick={() => setAiEnabled(!aiEnabled)} className={`w-14 h-7 rounded-full relative transition-all ${aiEnabled ? 'bg-emerald-500' : 'bg-[var(--text-muted)]/20'}`}><div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${aiEnabled ? 'right-1.5' : 'left-1.5'}`}></div></button>
                </div>
                <Typography variant="h2" className="mb-2 text-2xl">Двигун Інтелекту</Typography>
                <div className="space-y-3 bg-[var(--bg-main)] p-6 rounded-[1.8rem] border border-[var(--border-color)] mt-6">
                   <label className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] block">Gemini Cloud API Key</label>
                   <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input type={showKey ? "text" : "password"} value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="Введіть ключ..." className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl py-3 px-4 text-[11px] font-mono outline-none focus:border-[var(--primary)] text-[var(--text-main)]" />
                        <button onClick={() => setShowKey(!showKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors"><i className={`fa-solid ${showKey ? 'fa-eye-slash' : 'fa-eye'}`}></i></button>
                      </div>
                      <button onClick={handleSaveApiKey} className="bg-[var(--primary)] text-white px-6 rounded-xl text-[10px] font-black uppercase transition-colors hover:brightness-110">OK</button>
                   </div>
                </div>
             </Card>
          </div>
        );
      case 'ai-roadmap':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 pb-20">
             <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden mb-8">
                <div className="absolute bottom-0 right-0 w-32 h-32 bg-orange-600/20 blur-3xl"></div>
                <Typography variant="tiny" className="text-orange-500 font-black mb-2 tracking-[0.3em]">PROPOSALS v3.0</Typography>
                <Typography variant="h1" className="text-3xl mb-4">Вектор розвитку ШІ</Typography>
                <p className="text-slate-400 text-sm leading-relaxed">Нижче наведено концепції модулів, які можуть кардинально змінити обробку ваших даних за допомогою Gemini.</p>
             </div>

             <section className="space-y-4">
                <div className="flex items-center gap-3 px-2">
                   <i className="fa-solid fa-folder-tree text-indigo-500"></i>
                   <Typography variant="h3" className="text-base uppercase font-black">1. Автоматична Декомпозиція</Typography>
                </div>
                <Card className="bg-white border-slate-100 p-6 space-y-3">
                   <p className="text-xs font-medium text-slate-600 leading-relaxed">
                     ШІ міг би аналізувати назву нового проєкту (напр. "Запустити YouTube канал") і автоматично пропонувати дерево підпроєктів ("Обладнання", "Контент-план", "Монтаж") та перші 10 квестів за GTD.
                   </p>
                   <Badge variant="indigo" className="text-[7px]">GTD OPTIMIZATION</Badge>
                </Card>

                <div className="flex items-center gap-3 px-2 mt-8">
                   <i className="fa-solid fa-heart-pulse text-rose-500"></i>
                   <Typography variant="h3" className="text-base uppercase font-black">2. ШІ-Психолог (Аналіз Щоденника)</Typography>
                </div>
                <Card className="bg-white border-slate-100 p-6 space-y-3">
                   <p className="text-xs font-medium text-slate-600 leading-relaxed">
                     Аналіз блоків тексту в Щоденнику на наявність патернів вигорання, когнітивних викривлень або повторюваних негативних емоцій. ШІ міг би пропонувати "квести на відновлення", якщо тон записів стає тривожним.
                   </p>
                   <Badge variant="rose" className="text-[7px]">MENTAL HEALTH</Badge>
                </Card>

                <div className="flex items-center gap-3 px-2 mt-8">
                   <i className="fa-solid fa-users-viewfinder text-orange-500"></i>
                   <Typography variant="h3" className="text-base uppercase font-black">3. Соціальний Стратег</Typography>
                </div>
                <Card className="bg-white border-slate-100 p-6 space-y-3">
                   <p className="text-xs font-medium text-slate-600 leading-relaxed">
                     ШІ аналізує ваші нотатки про людей і перед кожною запланованою зустріччю (з Календаря) видає стислий "брифінг": про що ви говорили минулого разу, які хобі у людини, та які 3 питання варто поставити для зміцнення зв'язку.
                   </p>
                   <Badge variant="orange" className="text-[7px]">NETWORKING PRO</Badge>
                </Card>

                <div className="flex items-center gap-3 px-2 mt-8">
                   <i className="fa-solid fa-ranking-star text-amber-500"></i>
                   <Typography variant="h3" className="text-base uppercase font-black">4. Динамічне Балансування Складності</Typography>
                </div>
                <Card className="bg-white border-slate-100 p-6 space-y-3">
                   <p className="text-xs font-medium text-slate-600 leading-relaxed">
                     ШІ моніторіть швидкість закриття квестів. Якщо ви "застрягли", він пропонує розбити квест на дрібніші частини. Якщо все занадто легко — пропонує "Бос-Квест" для отримання легендарної ачівки.
                   </p>
                   <Badge variant="yellow" className="text-[7px]">GAMIFICATION AI</Badge>
                </Card>
             </section>
          </div>
        );
      case 'sidebar':
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
             <Typography variant="tiny" className="text-[var(--text-muted)] font-black uppercase tracking-widest ml-2 mb-2">Видимість модулів навігації</Typography>
             <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[2rem] overflow-hidden shadow-sm divide-y divide-[var(--border-color)]">
                {navItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 hover:bg-[var(--bg-main)] transition-colors">
                     <div className="flex items-center gap-4">
                        <div className="w-9 h-9 rounded-xl bg-[var(--bg-main)] flex items-center justify-center text-[var(--text-muted)] shadow-inner">
                           <i className={`fa-solid ${item.icon}`}></i>
                        </div>
                        <span className="text-[11px] font-black uppercase tracking-tight text-[var(--text-main)]">{item.label}</span>
                     </div>
                     <button 
                        onClick={() => updateSidebarSetting(item.id, sidebarSettings[item.id] === false)}
                        className={`w-11 h-6 rounded-full transition-all relative ${sidebarSettings[item.id] !== false ? 'bg-[var(--primary)]' : 'bg-[var(--text-muted)]/20'}`}
                      >
                         <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${sidebarSettings[item.id] !== false ? 'right-1' : 'left-1'}`}></div>
                      </button>
                  </div>
                ))}
             </div>
          </div>
        );
      case 'data':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
             <Card padding="lg" className="border-rose-100 bg-rose-50/20">
                <Typography variant="h2" className="text-rose-600 mb-2">Небезпечна зона</Typography>
                <p className="text-[11px] text-slate-500 mb-6 leading-relaxed">Ця дія безповоротно видалить всі дані системи. Ви зможете почати гру з чистого листа.</p>
                <button onClick={() => {if(confirm('Видалити ВСІ дані без можливості відновлення?')) {localStorage.clear(); window.location.reload();}}} className="w-full py-5 rounded-[1.8rem] bg-white text-rose-500 border-2 border-rose-100 text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all shadow-sm">ОЧИСТИТИ ВСЮ ЛОКАЛЬНУ ПАМ'ЯТЬ</button>
             </Card>
          </div>
        );
      case 'feedback':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-[var(--primary)]/5 p-6 rounded-[2rem] border border-[var(--primary)]/10">
              <Typography variant="tiny" className="text-[var(--primary)] font-black mb-2 uppercase">Ваш голос має значення</Typography>
              <p className="text-[11px] text-[var(--text-muted)] leading-relaxed font-medium">Маєте ідею для нового модуля? Знайшли баг у мапі світу? Напишіть нам.</p>
            </div>
            <form onSubmit={handleSendFeedback} className="space-y-4">
              <textarea 
                value={feedback} 
                onChange={e => setFeedback(e.target.value)}
                placeholder="Опишіть вашу ідею..." 
                className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[1.5rem] p-5 text-sm font-medium focus:ring-4 focus:ring-[var(--primary)]/10 outline-none transition-all shadow-sm min-h-[160px] resize-none leading-relaxed text-[var(--text-main)]"
              />
              <button 
                type="submit" 
                disabled={!feedback.trim() || feedbackSent}
                className={`w-full py-5 rounded-[1.8rem] font-black uppercase tracking-widest text-[10px] transition-all shadow-lg flex items-center justify-center gap-3 ${feedbackSent ? 'bg-emerald-500 text-white shadow-emerald-100' : 'bg-[var(--primary)] text-white shadow-[var(--primary)]/20 hover:scale-[1.02] active:scale-95'}`}
              >
                {feedbackSent ? 'ВІДПРАВЛЕНО!' : 'ВІДПРАВИТИ ЗВІТ'}
              </button>
            </form>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="h-screen flex flex-col lg:flex-row overflow-hidden relative bg-[var(--bg-main)]">
      {/* ЛІВА ПАНЕЛЬ: СПИСОК СЕКЦІЙ */}
      <div className={`flex-1 flex flex-col min-w-0 h-full relative transition-all duration-300 ${isMobile && selectedSectionId ? '-translate-x-full absolute' : 'translate-x-0 relative'}`}>
        <header className="px-6 py-8 md:px-10 md:py-10 bg-[var(--bg-card)] border-b border-[var(--border-color)] sticky top-0 z-20 shrink-0">
          <Typography variant="h1" className="text-2xl md:text-3xl font-black tracking-tight">Налаштування</Typography>
          <Typography variant="tiny" className="text-[var(--text-muted)] mt-1 uppercase tracking-[0.2em] text-[8px] md:text-[9px]">Ядро Системи 12TR</Typography>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 space-y-2">
           {sections.map(section => (
             <Card 
               key={section.id} 
               padding="none" 
               onClick={() => setSelectedSectionId(section.id)}
               className={`p-4 md:p-5 flex items-center justify-between group transition-all cursor-pointer border ${selectedSectionId === section.id ? 'bg-[var(--bg-card)] border-[var(--primary)] shadow-xl' : 'bg-[var(--bg-card)] border-[var(--border-color)] hover:border-[var(--primary)]/30 shadow-sm'}`}
             >
               <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className={`w-10 md:w-12 h-10 md:h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner bg-[var(--bg-main)] transition-all ${section.color}`}>
                     <i className={`fa-solid ${section.icon} text-lg`}></i>
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                     <Typography variant="h3" className="text-[12px] md:text-[13px] font-black uppercase tracking-tight truncate group-hover:text-[var(--primary)] transition-colors">{section.label}</Typography>
                     <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase truncate mt-0.5">{section.desc}</p>
                  </div>
               </div>
               <i className="fa-solid fa-chevron-right text-[10px] text-[var(--text-muted)] group-hover:text-[var(--primary)] group-hover:translate-x-1 transition-all"></i>
             </Card>
           ))}
        </div>
        
        <footer className="p-8 border-t border-[var(--border-color)] bg-[var(--bg-card)] text-center">
           <Typography variant="tiny" className="text-[var(--text-muted)] opacity-30">12TR ENGINE v.2.9.8 PRO PREVIEW</Typography>
        </footer>
      </div>

      {/* ПРАВА ПАНЕЛЬ: ДЕТАЛІ */}
      <div className={`flex h-full border-l border-[var(--border-color)] z-[110] bg-[var(--bg-card)] shrink-0 transition-all duration-300 ${isMobile ? (selectedSectionId ? 'fixed inset-0 w-full translate-x-0' : 'fixed inset-0 w-full translate-x-full') : ''}`}>
        {!isMobile && (
          <div onMouseDown={startResizing} className={`w-[1px] h-full cursor-col-resize hover:bg-[var(--primary)] z-[120] transition-colors ${isResizing ? 'bg-[var(--primary)]' : 'bg-[var(--border-color)]'}`}></div>
        )}
        <div style={{ width: isMobile ? '100vw' : detailsWidth }} className="h-full bg-[var(--bg-card)] relative overflow-hidden flex flex-col shadow-2xl">
           {selectedSectionId ? (
             <div className="h-full flex flex-col">
                <header className="p-6 md:p-8 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-card)] shrink-0">
                   <div className="flex items-center gap-4">
                      {isMobile && (
                        <button onClick={() => setSelectedSectionId(null)} className="w-10 h-10 rounded-2xl bg-[var(--bg-main)] flex items-center justify-center text-[var(--text-muted)]">
                           <i className="fa-solid fa-chevron-left text-xs"></i>
                        </button>
                      )}
                      <div className={`w-10 md:w-11 h-10 md:h-11 rounded-2xl flex items-center justify-center text-white shadow-lg bg-[var(--primary)]`}>
                        <i className={`fa-solid ${sections.find(s => s.id === selectedSectionId)?.icon}`}></i>
                      </div>
                      <Typography variant="h2" className="text-base md:text-lg font-black uppercase tracking-tight">{sections.find(s => s.id === selectedSectionId)?.label}</Typography>
                   </div>
                   {!isMobile && (
                     <button onClick={() => setSelectedSectionId(null)} className="w-10 h-10 rounded-2xl bg-[var(--bg-main)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all">
                        <i className="fa-solid fa-xmark text-sm"></i>
                     </button>
                   )}
                </header>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-12 bg-[var(--bg-main)]/30">
                   <div className="max-w-xl mx-auto">
                     {renderContent()}
                   </div>
                </div>
                <footer className="p-6 md:p-8 border-t border-[var(--border-color)] bg-[var(--bg-card)] shrink-0 pb-safe">
                   <Button onClick={() => setSelectedSectionId(null)} className="w-full rounded-2xl py-4 font-black uppercase tracking-widest text-[10px] shadow-sm">ГОТОВО</Button>
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
