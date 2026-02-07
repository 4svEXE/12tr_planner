
import React, { useState, useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { TaskStatus } from '../types';
import Typography from './ui/Typography';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  counts: Record<string, number>;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, counts }) => {
  const { 
    tasks, updateTask, scheduleTask, toggleTaskStatus, 
    sidebarSettings = {}, updateSidebarSetting, character
  } = useApp();
  const { user } = useAuth();
  
  const [isConfigMode, setIsConfigMode] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Оновлений список навігації згідно з запитом користувача
  const allNavItems = [
    // ОСНОВНИЙ СТЕК
    { id: 'today', icon: 'fa-star', label: 'Сьогодні', acceptDrop: true },
    { id: 'lists', icon: 'fa-folder-tree', label: 'Списки', acceptDrop: true },
    { id: 'notes', icon: 'fa-note-sticky', label: 'Нотатки', acceptDrop: true },
    { id: 'calendar', icon: 'fa-calendar-days', label: 'Календар' },
    { id: 'projects', icon: 'fa-flag-checkered', label: 'Цілі' },
    
    { id: 'divider1', type: 'divider' },
    
    // ІНСТРУМЕНТИ (Все інше як було)
    { id: 'planner', icon: 'fa-calendar-check', label: 'План' },
    { id: 'diary', icon: 'fa-book-open', label: 'Щоденник' },
    { id: 'habits', icon: 'fa-repeat', label: 'Звички' },
    { id: 'people', icon: 'fa-user-ninja', label: 'Люди' },
    { id: 'focus', icon: 'fa-bullseye', label: 'Фокус' },
    { id: 'shopping', icon: 'fa-cart-shopping', label: 'Покупки' },

    { id: 'divider2', type: 'divider' },

    // НИЖНЯ ЧАСТИНА (Мета-дані та системні)
    { id: 'hashtags', icon: 'fa-hashtag', label: 'Теги' },
    { id: 'hobbies', icon: 'fa-masks-theater', label: 'Хобі' },
    { id: 'completed', icon: 'fa-circle-check', label: 'Готово', acceptDrop: true },
    { id: 'trash', icon: 'fa-trash-can', label: 'Корзина', acceptDrop: true },
    { id: 'settings', icon: 'fa-gear', label: 'Опції' },
  ];

  const handleGlobalDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (!taskId) return;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    switch (targetId) {
      case 'today': scheduleTask(taskId, new Date().setHours(0,0,0,0)); break;
      case 'notes': updateTask({ ...task, category: 'note', status: TaskStatus.INBOX, isDeleted: false }); break;
      case 'completed': if (task.status !== TaskStatus.DONE) toggleTaskStatus(task); break;
      case 'trash': updateTask({ ...task, isDeleted: true }); break;
      case 'lists': setActiveTab('lists'); break;
    }
  };

  return (
    <>
      {/* ACTIVITY BAR */}
      <div 
        className={`hidden md:flex flex-col bg-[var(--bg-main)] border-r border-[var(--border-color)] h-screen sticky top-0 z-[45] transition-all duration-300 ease-in-out shrink-0 ${isConfigMode ? 'w-48' : 'w-14'}`}
      >
        {/* AVATAR AT TOP - Клік відкриває профіль Героя */}
        <div 
          className="p-2 mb-2 flex justify-center cursor-pointer group" 
          onClick={() => setActiveTab('character')}
          title="Ваш статус (Герой)"
        >
          <div className={`w-10 h-10 rounded-xl overflow-hidden border-2 transition-all duration-300 ${activeTab === 'character' ? 'border-[var(--primary)] scale-105 shadow-lg' : 'border-transparent group-hover:border-[var(--primary)]/50'}`}>
             <img 
               src={user?.photoURL || character.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.uid || 'Guest'}`} 
               className="w-full h-full object-cover bg-black/5" 
               alt="Hero"
             />
          </div>
        </div>

        <nav className="flex-1 flex flex-col items-center py-2 space-y-1.5 overflow-y-auto no-scrollbar">
          {allNavItems.map(item => {
            if (item.type === 'divider') {
              return <div key={item.id} className="w-8 h-px bg-[var(--border-color)] my-2 opacity-50 shrink-0" />;
            }

            const isVisible = sidebarSettings[item.id] !== false;
            if (!isVisible && !isConfigMode) return null;
            const isActive = activeTab === item.id;

            return (
              <div key={item.id} className="w-full px-2 flex items-center gap-2">
                <button 
                  onClick={() => !isConfigMode && setActiveTab(item.id!)}
                  onDrop={(e) => (item as any).acceptDrop && handleGlobalDrop(e, item.id!)}
                  onDragOver={(e) => (item as any).acceptDrop && e.preventDefault()}
                  className={`flex-1 h-9 rounded-xl flex items-center justify-center transition-all ${isActive ? 'bg-[var(--primary)] text-white shadow-md' : 'text-[var(--text-muted)] hover:bg-black/5'} ${isConfigMode ? 'px-3 justify-start gap-3' : ''}`}
                  title={item.label}
                >
                  <div className="relative">
                    <i className={`fa-solid ${item.icon} text-sm`}></i>
                    {!isConfigMode && counts[item.id!] > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 h-3 min-w-[12px] bg-rose-500 text-white text-[6px] font-black flex items-center justify-center rounded-full px-0.5 border border-[var(--bg-main)]">
                        {counts[item.id!]}
                      </span>
                    )}
                  </div>
                  {isConfigMode && <span className="text-[9px] font-black uppercase tracking-widest truncate">{item.label}</span>}
                </button>
                {isConfigMode && (
                  <button 
                    onClick={() => updateSidebarSetting(item.id!, !isVisible)}
                    className={`w-8 h-4 rounded-full relative transition-all ${isVisible ? 'bg-emerald-500' : 'bg-slate-300'}`}
                  >
                    <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${isVisible ? 'right-0.5' : 'left-0.5'}`}></div>
                  </button>
                )}
              </div>
            );
          })}
        </nav>

        <div className="p-2 border-t border-[var(--border-color)] space-y-2">
          <button 
            onClick={() => setIsConfigMode(!isConfigMode)}
            className={`w-full h-10 rounded-xl flex items-center justify-center transition-all ${isConfigMode ? 'bg-[var(--text-main)] text-white gap-3 px-3 justify-start' : 'text-[var(--text-muted)] hover:bg-black/5'}`}
          >
            <i className={`fa-solid ${isConfigMode ? 'fa-check' : 'fa-sliders'} text-sm`}></i>
            {isConfigMode && <span className="text-[9px] font-black uppercase tracking-widest">Готово</span>}
          </button>
        </div>
      </div>

      {/* MOBILE BOTTOM NAV */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[var(--bg-card)]/90 backdrop-blur-xl border-t border-[var(--border-color)] z-[210] flex items-center justify-around px-4 pb-safe">
         {[
           { id: 'today', icon: 'fa-star', label: 'Сьогодні' },
           { id: 'lists', icon: 'fa-folder-tree', label: 'Списки' },
           { id: 'notes', icon: 'fa-note-sticky', label: 'Нотатки' },
           { id: 'diary', icon: 'fa-book-open', label: 'Щоденник' },
           { id: 'menu', icon: 'fa-table-cells-large', label: 'Меню', isTrigger: true },
         ].map(item => (
           <button 
             key={item.id} 
             onClick={() => item.isTrigger ? setShowMobileMenu(true) : setActiveTab(item.id)}
             className={`flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all ${!item.isTrigger && activeTab === item.id ? 'text-[var(--primary)] bg-black/5' : 'text-[var(--text-muted)]'}`}
           >
             <i className={`fa-solid ${item.icon} text-lg mb-0.5`}></i>
             <span className="text-[6px] font-black uppercase tracking-tighter">{item.label}</span>
           </button>
         ))}
      </div>

      {showMobileMenu && (
        <div className="fixed inset-0 z-[300] bg-[var(--bg-main)] animate-in fade-in slide-in-from-bottom duration-300 flex flex-col">
           <header className="p-6 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-card)]">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-2xl overflow-hidden border border-[var(--border-color)] shadow-sm">
                    <img src={user?.photoURL || character.avatarUrl} className="w-full h-full object-cover" alt="User" />
                 </div>
                 <Typography variant="h2" className="text-xl">Всі Модулі</Typography>
              </div>
              <button onClick={() => setShowMobileMenu(false)} className="w-10 h-10 rounded-2xl bg-black/5 flex items-center justify-center text-slate-400"><i className="fa-solid fa-xmark"></i></button>
           </header>
           <div className="flex-1 overflow-y-auto p-6 grid grid-cols-3 gap-4 pb-20">
              {allNavItems.filter(i => !i.type).map(item => (
                <button 
                  key={item.id} 
                  onClick={() => { setActiveTab(item.id!); setShowMobileMenu(false); }}
                  className={`flex flex-col items-center justify-center p-4 rounded-3xl border ${activeTab === item.id ? 'bg-[var(--primary)] text-white shadow-xl' : 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-muted)]'}`}
                >
                   <i className={`fa-solid ${item.icon} text-lg mb-2`}></i>
                   <span className="text-[8px] font-black uppercase text-center">{item.label}</span>
                </button>
              ))}
           </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
