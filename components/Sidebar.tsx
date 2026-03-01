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
    isSidebarCollapsed, setSidebarCollapsed, character,
    diary = [], saveDiaryEntry, tasks, deleteTask
  } = useApp();
  const { user, login, isGuest } = useAuth();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const sections = [
    {
      title: "Оперативка",
      items: [
        { id: 'today', icon: 'fa-star', label: 'Сьогодні', color: 'text-amber-500' },
        { id: 'lists', icon: 'fa-layer-group', label: 'Списки', color: 'text-indigo-500' },
        { id: 'calendar', icon: 'fa-calendar-days', label: 'Календар', color: 'text-rose-500' },
      ]
    },
    {
      title: "База",
      items: [
        { id: 'projects', icon: 'fa-flag-checkered', label: 'Цілі', color: 'text-emerald-500' },
        { id: 'habits', icon: 'fa-repeat', label: 'Звички', color: 'text-cyan-500' },
        { id: 'diary', icon: 'fa-book-open', label: 'Щоденник', color: 'text-violet-500' },
      ]
    },
    {
      title: "RPG Світ",
      items: [
        { id: 'focus', icon: 'fa-bullseye', label: 'Фокус', color: 'text-rose-600' },
        { id: 'people', icon: 'fa-user-ninja', label: 'Люди', color: 'text-slate-500' },
        { id: 'shopping', icon: 'fa-cart-shopping', label: 'Покупки', color: 'text-amber-700' },
      ]
    }
  ];

  const handleDiaryDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverId(null);
    const taskId = e.dataTransfer.getData('taskId');
    if (!taskId) return;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const dateStr = new Date().toLocaleDateString('en-CA');
    const existingEntry = diary.find(d => d.date === dateStr);
    const block = { id: Math.random().toString(36).substr(2, 9), type: 'bullet', content: task.title };

    let newContent = '';
    if (existingEntry) {
      try {
        const blocks = JSON.parse(existingEntry.content);
        newContent = JSON.stringify([...blocks, block]);
      } catch (e) {
        newContent = JSON.stringify([{ id: 'b1', type: 'text', content: existingEntry.content }, block]);
      }
      saveDiaryEntry(dateStr, newContent, existingEntry.id);
    } else {
      newContent = JSON.stringify([block]);
      saveDiaryEntry(dateStr, newContent);
    }
    deleteTask(taskId, true);
  };

  const renderItem = (item: any) => {
    const isActive = activeTab === item.id;
    const isDragTarget = dragOverId === item.id;

    return (
      <div
        key={item.id}
        className="w-full flex items-center gap-2 group px-2"
        onDragOver={(e) => {
          if (item.id === 'diary') {
            e.preventDefault();
            setDragOverId(item.id);
          }
        }}
        onDragLeave={() => setDragOverId(null)}
        onDrop={(e) => {
          if (item.id === 'diary') handleDiaryDrop(e);
        }}
      >
        <button
          onClick={() => setActiveTab(item.id)}
          className={`flex-1 flex items-center gap-3 h-10 rounded-xl relative ${isActive
            ? 'bg-[var(--primary)] text-white shadow-md'
            : isDragTarget ? 'bg-[var(--primary)]/20 shadow-inner' : 'text-white/40 hover:bg-white/5 hover:text-white'
            } ${isSidebarCollapsed ? 'justify-center px-0' : 'px-3'}`}
          title={isSidebarCollapsed ? item.label : ''}
        >
          <div className={`w-5 flex justify-center text-[16px] shrink-0 ${isActive || isDragTarget ? 'text-white' : item.color}`}>
            <i className={`fa-solid ${item.icon}`}></i>
          </div>
          {!isSidebarCollapsed && <span className="flex-1 text-left text-[11px] font-bold tracking-normal truncate uppercase pt-0.5">{item.label}</span>}
          {!isSidebarCollapsed && counts[item.id] > 0 && (
            <span className={`h-4 min-w-[16px] flex items-center justify-center rounded-full text-[8px] font-bold px-1 ${isActive ? 'bg-white/20 text-white' : 'bg-black/10 text-white/40'}`}>
              {counts[item.id]}
            </span>
          )}
        </button>
      </div>
    );
  };

  return (
    <>
      <aside className={`${isSidebarCollapsed ? 'w-12' : 'w-60'} hidden md:flex flex-col h-screen sticky top-0 bg-[var(--bg-sidebar)] border-r border-[var(--border-color)] shrink-0 z-40 transition-all duration-300`}>
        <div className="p-2 flex items-center h-16 shrink-0">
          {!isSidebarCollapsed && (
            <div className="flex items-center gap-2 pl-2">
              <div className="w-7 h-7 rounded-lg bg-[var(--primary)] flex items-center justify-center text-white shadow-lg"><i className="fa-solid fa-bolt-lightning text-xs"></i></div>
              <Typography variant="h2" className="text-sm text-[var(--text-sidebar)] uppercase font-bold pt-0.5">12TR Engine</Typography>
            </div>
          )}
          <button onClick={() => setSidebarCollapsed(!isSidebarCollapsed)} className={`w-8 h-8 rounded-lg hover:bg-black/10 flex items-center justify-center transition-all ${isSidebarCollapsed ? 'mx-auto' : 'ml-auto mr-1'}`} style={{ color: 'var(--text-sidebar)' }}>
            <i className={`fa-solid ${isSidebarCollapsed ? 'fa-indent' : 'fa-outdent'} text-lg`}></i>
          </button>
        </div>

        <div className="px-2 mb-4">
          {isGuest ? (
            <button
              onClick={login}
              className={`w-full flex items-center gap-3 p-2 rounded-2xl bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-lg overflow-hidden ${isSidebarCollapsed ? 'justify-center' : 'px-4'}`}
            >
              <i className="fa-brands fa-google text-sm"></i>
              {!isSidebarCollapsed && <span className="text-[10px] font-bold uppercase tracking-widest">Увійти</span>}
            </button>
          ) : (
            <div onClick={() => setActiveTab('character')} className={`flex items-center gap-2 p-1 rounded-2xl cursor-pointer ${activeTab === 'character' ? 'ring-1 ring-[var(--primary)] bg-[var(--primary)]/10' : 'hover:bg-white/5'} ${isSidebarCollapsed ? 'justify-center' : 'px-1.5'}`}>
              <div className="w-8 h-8 rounded-xl overflow-hidden shadow-md bg-card shrink-0 border border-white/10">
                <img src={user?.photoURL || character.avatarUrl} className="w-full h-full object-cover" alt="Hero" />
              </div>
              {!isSidebarCollapsed && <div className="min-w-0 flex-1"><div className="text-[10px] font-bold uppercase truncate leading-none mb-0.5" style={{ color: 'var(--text-sidebar)' }}>{character.name}</div><div className="text-[7px] font-bold text-[var(--primary)] uppercase tracking-wider">LVL {character.level}</div></div>}
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto no-scrollbar space-y-5 pt-2">
          {sections.map((section, idx) => (
            <div key={idx} className="space-y-1">
              {!isSidebarCollapsed && <div className="px-5 mb-1"><span className="text-[7px] font-bold uppercase tracking-[0.3em] opacity-40" style={{ color: 'var(--text-sidebar)' }}>{section.title}</span></div>}
              <div className="space-y-0.5">{section.items.map(renderItem)}</div>
            </div>
          ))}
        </nav>

        <div className="p-2 border-t border-white/5 bg-black/[0.05]">
          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 h-10 rounded-xl ${activeTab === 'settings' ? 'bg-slate-800 text-white shadow-md' : 'text-white/40 hover:bg-white/5 hover:text-white'} ${isSidebarCollapsed ? 'justify-center' : 'px-3'}`}
          >
            <i className="fa-solid fa-gear text-[16px]"></i>
            {!isSidebarCollapsed && <span className="text-[10px] font-bold uppercase tracking-tight">Опції</span>}
          </button>
        </div>
      </aside>

      {/* Мобільний навбар */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[var(--bg-card)] border-t border-[var(--border-color)] z-[1090] flex items-center justify-around px-4 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        {[
          { id: 'today', icon: 'fa-star', label: 'Сьогодні' },
          { id: 'lists', icon: 'fa-layer-group', label: 'Списки' },
          { id: 'calendar', icon: 'fa-calendar-days', label: 'Календар' },
          { id: 'habits', icon: 'fa-repeat', label: 'Звички' },
        ].map(item => (
          <button
            key={item.id}
            onClick={() => { setActiveTab(item.id); setShowMobileMenu(false); }}
            className={`flex flex-col items-center justify-center w-12 h-12 rounded-2xl ${activeTab === item.id ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'}`}
          >
            <i className={`fa-solid ${item.icon} text-lg`}></i>
            <span className="text-[6px] font-bold uppercase tracking-tighter mt-0.5">{item.label}</span>
          </button>
        ))}
        {/* Бургер меню праворуч */}
        <button
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          className={`flex flex-col items-center justify-center w-12 h-12 rounded-2xl ${showMobileMenu ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'}`}
        >
          <i className={`fa-solid ${showMobileMenu ? 'fa-xmark' : 'fa-bars'} text-lg`}></i>
          <span className="text-[6px] font-bold uppercase tracking-tighter mt-0.5">Меню</span>
        </button>
      </div>

      {showMobileMenu && (
        <div className="fixed inset-0 z-[1000] bg-[var(--bg-main)] flex flex-col no-print">
          <header className="p-6 border-b border-[var(--border-color)] flex justify-between items-center shrink-0 bg-[var(--bg-card)]">
            <div className="flex items-center gap-3">
              {isGuest ? (
                <button onClick={login} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-bold uppercase">Увійти з Google</button>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-[4px] overflow-hidden border border-[var(--border-color)] shadow-sm">
                    <img src={user?.photoURL || character.avatarUrl} className="w-full h-full object-cover" alt="User" />
                  </div>
                  <Typography variant="h2" className="text-xl font-bold uppercase tracking-tighter text-main">Система</Typography>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { setActiveTab('settings'); setShowMobileMenu(false); }}
                className="w-10 h-10 rounded-2xl bg-black/5 flex items-center justify-center text-muted active:scale-90 transition-all"
                title="Опції"
              >
                <i className="fa-solid fa-gear text-lg"></i>
              </button>
              <button onClick={() => setShowMobileMenu(false)} className="w-10 h-10 rounded-2xl bg-black/5 flex items-center justify-center text-muted active:scale-90 transition-all">
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>
          </header>

          <div className="overflow-y-auto p-4 grid grid-cols-3 gap-3 pb-32 no-scrollbar">
            {sections.flatMap(s => s.items).filter(item => !['today', 'lists', 'calendar', 'habits'].includes(item.id)).map(item => (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id!); setShowMobileMenu(false); }}
                className={`flex flex-col items-center justify-center h-20 rounded-[4px] border ${activeTab === item.id ? 'bg-[var(--primary)] text-white shadow-xl border-[var(--primary)]' : 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-muted)] hover:bg-black/5'}`}
              >
                <i className={`fa-solid ${item.icon} text-xl mb-1.5 ${activeTab === item.id ? 'text-white' : item.color}`}></i>
                <span className="text-[7px] font-bold uppercase text-center leading-tight tracking-widest px-1">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;