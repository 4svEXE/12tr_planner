
import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import Typography from './ui/Typography';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  counts: Record<string, number>;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, counts }) => {
  const { 
    isSidebarCollapsed, setSidebarCollapsed, 
    sidebarSettings = {}, character
  } = useApp();
  const { user } = useAuth();
  
  const [isConfigMode, setIsConfigMode] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Повний список для десктопа
  const allNavItems = [
    { id: 'today', icon: 'fa-star', label: 'Сьогодні', color: 'text-amber-500' },
    { id: 'lists', icon: 'fa-box-archive', label: 'База знань', color: 'text-indigo-500' },
    { id: 'calendar', icon: 'fa-calendar-days', label: 'Календар', color: 'text-rose-500' },
    { id: 'projects', icon: 'fa-flag-checkered', label: 'Цілі', color: 'text-emerald-500' },
    { id: 'diary', icon: 'fa-book-open', label: 'Щоденник', color: 'text-violet-500' },
    { id: 'habits', icon: 'fa-repeat', label: 'Звички', color: 'text-cyan-500' },
    { id: 'people', icon: 'fa-user-ninja', label: 'Люди', color: 'text-slate-600' },
    { id: 'focus', icon: 'fa-bullseye', label: 'Фокус', color: 'text-rose-600' },
    { id: 'shopping', icon: 'fa-cart-shopping', label: 'Покупки', color: 'text-amber-700' },
  ];

  // Пункти для мобільного таббару (База на 2-й позиції)
  const mobileBottomItems = [
    { id: 'today', icon: 'fa-star', label: 'Сьогодні' },
    { id: 'lists', icon: 'fa-box-archive', label: 'База' },
    { id: 'projects', icon: 'fa-flag-checkered', label: 'Цілі' },
    { id: 'calendar', icon: 'fa-calendar-days', label: 'Календар' },
  ];

  // Пункти, які ЗАБОРОНЕНО показувати в бургері (вже є в навбарі або приховані за запитом)
  const excludedFromBurger = ['today', 'lists', 'projects', 'calendar', 'inbox', 'next_actions', 'map'];

  const renderItem = (item: any) => {
    const isVisible = sidebarSettings[item.id] !== false;
    if (!isVisible && !isConfigMode) return null;
    const isActive = activeTab === item.id;
    
    return (
      <div key={item.id} className={`w-full flex items-center gap-2 group ${isSidebarCollapsed ? 'px-0 justify-center' : 'px-2'}`}>
        <button 
          onClick={() => !isConfigMode && setActiveTab(item.id)}
          className={`flex items-center transition-all duration-200 relative ${
            isSidebarCollapsed 
              ? 'w-10 h-10 justify-center rounded-xl' 
              : 'flex-1 h-10 px-3 rounded-xl gap-3'
          } ${
            isActive 
              ? 'bg-[var(--primary)] text-white shadow-lg' 
              : 'text-[var(--text-muted)] hover:bg-black/5 hover:text-[var(--text-main)]'
          }`}
          title={isSidebarCollapsed ? item.label : ''}
        >
          <div className={`w-5 flex justify-center text-[14px] shrink-0 ${isActive ? 'text-white' : item.color}`}>
            <i className={`fa-solid ${item.icon}`}></i>
          </div>
          
          {!isSidebarCollapsed && (
            <span className="flex-1 text-left text-[11px] font-black tracking-tight truncate uppercase pt-0.5">
              {item.label}
            </span>
          )}

          {!isSidebarCollapsed && counts[item.id] > 0 && (
            <span className={`h-4 min-w-[16px] flex items-center justify-center rounded-full text-[8px] font-black px-1 ${
              isActive ? 'bg-white/20 text-white' : 'bg-black/5 text-[var(--text-muted)]'
            }`}>
              {counts[item.id]}
            </span>
          )}
        </button>
      </div>
    );
  };

  return (
    <>
      {/* ДЕСТКОПНИЙ САЙДБАР */}
      <aside 
        className={`hidden md:flex flex-col h-screen sticky top-0 bg-[var(--bg-sidebar)] border-r border-[var(--border-color)] transition-all duration-300 ease-in-out shrink-0 z-40 ${
          isSidebarCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        <div className="h-16 flex items-center px-4 shrink-0 overflow-hidden">
          {!isSidebarCollapsed && (
            <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
              <div className="w-8 h-8 rounded-lg bg-[var(--primary)] flex items-center justify-center text-white shadow-lg">
                <i className="fa-solid fa-bolt-lightning text-xs"></i>
              </div>
              <Typography variant="h2" className="text-sm font-black tracking-tighter uppercase pt-0.5 whitespace-nowrap">12TR Engine</Typography>
            </div>
          )}
          <button 
            onClick={() => setSidebarCollapsed(!isSidebarCollapsed)}
            className={`w-8 h-8 rounded-lg hover:bg-black/5 flex items-center justify-center text-[var(--text-muted)] transition-colors ${isSidebarCollapsed ? 'mx-auto' : 'ml-auto'}`}
          >
            <i className={`fa-solid ${isSidebarCollapsed ? 'fa-indent' : 'fa-outdent'}`}></i>
          </button>
        </div>

        <div className="px-2 mb-4">
          <div 
            onClick={() => setActiveTab('character')}
            className={`flex items-center gap-3 p-1.5 rounded-2xl cursor-pointer transition-all ${
              activeTab === 'character' ? 'ring-2 ring-[var(--primary)] bg-[var(--primary)]/5' : 'hover:bg-black/5'
            } ${isSidebarCollapsed ? 'justify-center px-0' : 'px-2'}`}
          >
            <div className="w-9 h-9 rounded-xl overflow-hidden shadow-sm bg-white shrink-0 border border-[var(--border-color)]">
              <img src={user?.photoURL || character.avatarUrl} className="w-full h-full object-cover" alt="Hero" />
            </div>
            {!isSidebarCollapsed && (
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-black uppercase truncate leading-none mb-0.5">{character.name}</div>
                <div className="text-[7px] font-bold text-[var(--primary)] uppercase tracking-widest">LVL {character.level}</div>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto no-scrollbar space-y-0.5 pt-2 pb-4">
          {allNavItems.map(renderItem)}
        </nav>
      </aside>

      {/* МОБІЛЬНИЙ НАВБАР (BOTTOM BAR) - ЗАВЖДИ ЗВЕРХУ */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/90 backdrop-blur-xl border-t border-[var(--border-color)] z-[1000] flex items-center justify-around px-2 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        {mobileBottomItems.map(item => (
          <button 
            key={item.id} 
            onClick={() => { setActiveTab(item.id); setShowMobileMenu(false); }} 
            className={`flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all ${activeTab === item.id && !showMobileMenu ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'}`}
          >
            <i className={`fa-solid ${item.icon} text-lg`}></i>
            <span className="text-[6px] font-black uppercase tracking-tighter mt-1 truncate w-full text-center px-1">{item.label}</span>
          </button>
        ))}
        <button 
          onClick={() => setShowMobileMenu(!showMobileMenu)} 
          className={`flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all ${showMobileMenu ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'}`}
        >
          <i className="fa-solid fa-table-cells-large text-lg"></i>
          <span className="text-[6px] font-black uppercase tracking-tighter mt-1">Меню</span>
        </button>
      </div>

      {/* МОБІЛЬНЕ МЕНЮ (OVERLAY) */}
      {showMobileMenu && (
        <div className="fixed inset-0 z-[900] bg-white/95 backdrop-blur-2xl animate-in fade-in slide-in-from-bottom duration-300 flex flex-col no-print">
          <header className="p-6 border-b border-[var(--border-color)] flex justify-between items-center bg-transparent shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl overflow-hidden border border-[var(--border-color)] shadow-sm">
                <img src={user?.photoURL || character.avatarUrl} className="w-full h-full object-cover" alt="User" />
              </div>
              <div>
                <Typography variant="h2" className="text-xl leading-none mb-0.5">Система</Typography>
                <span className="text-[7px] font-black uppercase text-primary tracking-widest">LVL {character.level} • {character.name}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* НАЛАШТУВАННЯ ТЕПЕР У ХЕДЕРІ */}
              <button 
                onClick={() => { setActiveTab('settings'); setShowMobileMenu(false); }}
                className="w-10 h-10 rounded-2xl bg-black/5 flex items-center justify-center text-slate-500 hover:text-primary transition-all"
              >
                <i className="fa-solid fa-gear"></i>
              </button>
              <button 
                onClick={() => setShowMobileMenu(false)} 
                className="w-10 h-10 rounded-2xl bg-black/5 flex items-center justify-center text-slate-400"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
          </header>

          <div className="flex-1- overflow-y-auto p-4 grid grid-cols-4 gap-2 pb-32 no-scrollbar">
            {allNavItems
              .filter(item => !excludedFromBurger.includes(item.id)) // Прибираємо пункти, що вже є в навбарі або приховані
              .map(item => (
                <button 
                  key={item.id} 
                  onClick={() => { setActiveTab(item.id); setShowMobileMenu(false); }} 
                  className={`flex flex-col items-center justify-center h-20 rounded-2xl border transition-all ${
                    activeTab === item.id 
                      ? 'bg-[var(--primary)] text-white shadow-xl border-[var(--primary)]' 
                      : 'bg-white border-[var(--border-color)] text-[var(--text-muted)] shadow-sm'
                  }`}
                >
                  <i className={`fa-solid ${item.icon} text-base mb-1.5 ${activeTab === item.id ? 'text-white' : item.color}`}></i>
                  <span className="text-[7px] font-black uppercase text-center leading-tight tracking-tighter px-0.5">{item.label}</span>
                </button>
              ))}
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
