
import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { ThemeType, Character } from '../types';
import Typography from '../components/ui/Typography';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
// Fix: Added Card to imports to resolve multiple "Cannot find name 'Card'" errors
import Card from '../components/ui/Card';

const SettingsView: React.FC = () => {
  const { 
    theme, setTheme, aiEnabled, setAiEnabled, sidebarSettings, 
    updateSidebarSetting, character, updateCharacter 
  } = useApp();
  
  const [activeSection, setActiveSection] = useState('profile');
  const [feedback, setFeedback] = useState('');

  const configMenu = [
    { id: 'profile', icon: 'fa-user-astronaut', label: 'Профіль Героя', color: 'text-orange-500' },
    { id: 'appearance', icon: 'fa-palette', label: 'Інтерфейс', color: 'text-indigo-500' },
    { id: 'ai', icon: 'fa-wand-magic-sparkles', label: 'ШІ Стратег', color: 'text-emerald-500' },
    { id: 'modules', icon: 'fa-cubes', label: 'Модулі системи', color: 'text-blue-500' },
    { id: 'data', icon: 'fa-database', label: 'Дані та Безпека', color: 'text-rose-500' },
    { id: 'about', icon: 'fa-circle-info', label: 'Про нас', color: 'text-slate-500' },
    { id: 'feedback', icon: 'fa-comment-dots', label: 'Фідбек', color: 'text-amber-500' },
  ];

  const themes: {id: ThemeType, label: string, color: string}[] = [
    { id: 'classic', label: 'Classic', color: '#f97316' },
    { id: 'midnight', label: 'Midnight', color: '#10b981' },
    { id: 'nordic', label: 'Nordic', color: '#6366f1' },
    { id: 'sakura', label: 'Sakura', color: '#ec4899' },
    { id: 'forest', label: 'Forest', color: '#059669' },
    { id: 'amethyst', label: 'Amethyst', color: '#a855f7' },
    { id: 'volcano', label: 'Volcano', color: '#ef4444' },
    { id: 'slate', label: 'Slate', color: '#94a3b8' },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'profile':
        return (
          <div className="space-y-8 animate-in fade-in duration-300">
             <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-[2.5rem] bg-[var(--bg-main)] p-1 ring-4 ring-orange-500/10 overflow-hidden relative group">
                   <img src={character.avatarUrl} className="w-full h-full object-cover rounded-[2.2rem]" />
                   <button onClick={() => {const url = prompt('URL аватара:', character.avatarUrl); if(url) updateCharacter({avatarUrl: url})}} className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><i className="fa-solid fa-camera text-white"></i></button>
                </div>
                <div className="flex-1">
                   <label className="text-[9px] font-black uppercase text-[var(--text-muted)] mb-1 block">Ім'я Героя</label>
                   <input value={character.name} onChange={e => updateCharacter({name: e.target.value})} className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl py-3 px-4 text-sm font-bold text-[var(--text-main)] focus:ring-2 focus:ring-orange-500/20 outline-none" />
                </div>
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] font-black uppercase text-[var(--text-muted)] mb-1 block">Раса</label>
                  <select value={character.race} onChange={e => updateCharacter({race: e.target.value as any})} className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl py-3 px-4 text-xs font-bold text-[var(--text-main)] outline-none">
                     <option>Human</option><option>Elf</option><option>Dwarf</option><option>Gnome</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase text-[var(--text-muted)] mb-1 block">Архетип</label>
                  <select value={character.archetype} onChange={e => updateCharacter({archetype: e.target.value as any})} className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl py-3 px-4 text-xs font-bold text-[var(--text-main)] outline-none">
                     <option>Strategist</option><option>Builder</option><option>Monk</option><option>Explorer</option>
                  </select>
                </div>
             </div>
          </div>
        );
      case 'appearance':
        return (
          <div className="space-y-6 animate-in fade-in duration-300">
             <Typography variant="tiny" className="text-[var(--text-muted)] uppercase font-black px-1">Тема всесвіту</Typography>
             <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {themes.map(t => (
                  <button key={t.id} onClick={() => setTheme(t.id)} className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${theme === t.id ? 'border-orange-500 bg-orange-500/5 shadow-md scale-105' : 'border-[var(--border-color)] bg-[var(--bg-card)] hover:border-orange-500/30'}`}>
                     <div className="w-8 h-8 rounded-full shadow-inner" style={{ backgroundColor: t.color }}></div>
                     <span className="text-[9px] font-black uppercase text-[var(--text-main)]">{t.label}</span>
                  </button>
                ))}
             </div>
          </div>
        );
      case 'ai':
        return (
          <div className="space-y-6 animate-in fade-in duration-300">
             <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-600/20 blur-3xl rounded-full"></div>
                <div className="flex items-center justify-between mb-6">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-orange-600 flex items-center justify-center shadow-lg"><i className="fa-solid fa-wand-magic-sparkles"></i></div>
                      <Typography variant="h2" className="text-white text-xl">Gemini Стратег</Typography>
                   </div>
                   <button onClick={() => setAiEnabled(!aiEnabled)} className={`w-14 h-7 rounded-full relative transition-all ${aiEnabled ? 'bg-emerald-500' : 'bg-white/10'}`}><div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-lg transition-all ${aiEnabled ? 'right-1' : 'left-1'}`}></div></button>
                </div>
                <p className="text-sm text-slate-400 leading-relaxed mb-8">Штучний інтелект аналізує ваші звіти, вхідні квести та соціальні зв'язки, допомагаючи автоматизувати GTD розбори та планування 12-тижневого року.</p>
                <div className="space-y-4">
                   <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500"><span>Глибина аналізу</span><span>Strategic Deep</span></div>
                   <div className="h-1.5 bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-orange-500 w-3/4 shadow-[0_0_15px_rgba(249,115,22,0.5)]"></div></div>
                </div>
             </div>
          </div>
        );
      case 'about':
        return (
          <div className="space-y-8 animate-in fade-in duration-300">
             <div className="bg-gradient-to-tr from-orange-500 to-pink-600 rounded-[3rem] p-12 text-white text-center shadow-xl relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                <i className="fa-solid fa-bolt-lightning text-5xl mb-6"></i>
                <Typography variant="h1" className="text-4xl mb-2">12TR Life Engine</Typography>
                <p className="text-orange-100 text-xs font-black uppercase tracking-[0.4em]">Strategy of Greatness</p>
             </div>
             <div className="grid grid-cols-1 gap-4">
                <Card className="bg-[var(--bg-card)] border-[var(--border-color)] p-6 rounded-[2rem] flex gap-5 items-start">
                   <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0 text-xl"><i className="fa-solid fa-brain"></i></div>
                   <div>
                      <Typography variant="h3" className="text-[var(--text-main)] mb-1 uppercase text-sm">GTD Integration</Typography>
                      <p className="text-xs text-[var(--text-muted)] leading-relaxed">Методологія Getting Things Done для повного розвантаження мозку та фокусу на фізичних діях.</p>
                   </div>
                </Card>
                <Card className="bg-[var(--bg-card)] border-[var(--border-color)] p-6 rounded-[2rem] flex gap-5 items-start">
                   <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0 text-xl"><i className="fa-solid fa-calendar-check"></i></div>
                   <div>
                      <Typography variant="h3" className="text-[var(--text-main)] mb-1 uppercase text-sm">12 Week Year</Typography>
                      <p className="text-xs text-[var(--text-muted)] leading-relaxed">Система стиснення року до 12 тижнів для експоненціального зростання результатів.</p>
                   </div>
                </Card>
             </div>
          </div>
        );
      case 'feedback':
        return (
          <div className="space-y-6 animate-in fade-in duration-300">
             <div className="text-center py-6">
                <i className="fa-solid fa-paper-plane text-orange-500 text-4xl mb-4"></i>
                <Typography variant="h2" className="text-2xl text-[var(--text-main)]">Твоя думка важлива</Typography>
                <p className="text-sm text-[var(--text-muted)]">Ми постійно розвиваємо 12TR. Розкажи нам про свої ідеї!</p>
             </div>
             <textarea 
               value={feedback} 
               onChange={e => setFeedback(e.target.value)} 
               placeholder="Опишіть ідею або баг..." 
               className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-[2rem] p-8 text-sm text-[var(--text-main)] font-medium focus:ring-4 focus:ring-orange-500/20 outline-none min-h-[250px] resize-none shadow-inner" 
             />
             <Button onClick={() => {alert('Дякуємо!'); setFeedback('');}} disabled={!feedback.trim()} className="w-full py-5 rounded-2xl shadow-xl font-black uppercase tracking-widest text-xs">ВІДПРАВИТИ СТРАТЕГАМ</Button>
          </div>
        );
      case 'data':
        return (
          <div className="space-y-6 animate-in fade-in duration-300">
             <Card className="bg-emerald-500/5 border-emerald-500/20 p-8 rounded-[2.5rem] text-center">
                <i className="fa-solid fa-shield-halved text-emerald-500 text-4xl mb-4"></i>
                <Typography variant="h3" className="text-[var(--text-main)] mb-2 uppercase">Локальна приватність</Typography>
                <p className="text-xs text-[var(--text-muted)]">Всі ваші дані зберігаються виключно у вашому браузері (LocalStorage). Ми не маємо доступу до ваших планів.</p>
             </Card>
             <div className="grid grid-cols-2 gap-4">
                <button className="py-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[10px] font-black uppercase text-[var(--text-main)] hover:bg-orange-500/5 transition-all flex flex-col items-center gap-3"><i className="fa-solid fa-download text-lg"></i> Експорт бази</button>
                <button className="py-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[10px] font-black uppercase text-[var(--text-main)] hover:bg-orange-500/5 transition-all flex flex-col items-center gap-3"><i className="fa-solid fa-upload text-lg"></i> Імпорт бази</button>
             </div>
             <button onClick={() => { if(confirm('Це видалить ВСЕ без вороття! Ви впевнені?')) { localStorage.clear(); window.location.reload(); } }} className="w-full py-4 rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20 text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all">ПОВНЕ СКИНУТТЯ СИСТЕМИ</button>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="h-screen flex bg-[var(--bg-main)] overflow-hidden">
      {/* Бокова панель налаштувань (як у вхідних) */}
      <aside className="w-64 border-r border-[var(--border-color)] bg-[var(--bg-card)] flex flex-col shrink-0">
         <header className="p-8 border-b border-[var(--border-color)]">
            <Typography variant="h2" className="text-xl text-[var(--text-main)]">Налаштування</Typography>
            <Typography variant="tiny" className="text-[var(--text-muted)]">Strategic OS</Typography>
         </header>
         <nav className="flex-1 p-4 space-y-1 overflow-y-auto no-scrollbar">
            {configMenu.map(item => (
              <button 
                key={item.id} 
                onClick={() => setActiveSection(item.id)} 
                className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${activeSection === item.id ? 'bg-orange-500/10 text-orange-500 ring-1 ring-orange-500/20 shadow-sm font-black' : 'text-[var(--text-muted)] hover:bg-[var(--bg-main)]'}`}
              >
                 <i className={`fa-solid ${item.icon} text-xs w-4 text-center ${activeSection === item.id ? 'animate-pulse' : ''}`}></i>
                 <span className="text-[10px] uppercase tracking-widest">{item.label}</span>
              </button>
            ))}
         </nav>
         <footer className="p-6 border-t border-[var(--border-color)] text-center">
            <Typography variant="tiny" className="text-[var(--text-muted)] opacity-30">v.2.9.0 PREVIEW</Typography>
         </footer>
      </aside>

      {/* Основний контент */}
      <main className="flex-1 flex flex-col bg-[var(--bg-main)]">
         <header className="px-10 py-8 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-card)]">
            <Typography variant="h2" className="text-2xl font-black uppercase tracking-tight text-[var(--text-main)] flex items-center gap-3">
              <i className={`fa-solid ${configMenu.find(m => m.id === activeSection)?.icon} opacity-20 text-lg`}></i>
              {configMenu.find(m => m.id === activeSection)?.label}
            </Typography>
         </header>
         <div className="flex-1 overflow-y-auto custom-scrollbar p-10">
            <div className="max-w-2xl mx-auto w-full">
               {renderContent()}
            </div>
         </div>
      </main>
    </div>
  );
};

export default SettingsView;
