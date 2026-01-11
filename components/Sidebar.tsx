
import React, { useState, useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { TaskStatus, ThemeType } from '../types';
import Typography from './ui/Typography';
import Button from './ui/Button';
import MiniCalendar from './sidebar/MiniCalendar';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  counts: Record<string, number>;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, counts }) => {
  const { 
    tasks, updateTask, scheduleTask, toggleTaskStatus, 
    isSidebarCollapsed, setSidebarCollapsed, sidebarSettings,
    theme, setTheme
  } = useApp();
  
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const primaryItems = [
    { id: 'today', icon: 'fa-star', label: 'Сьогодні', acceptDrop: true },
    { id: 'dashboard', icon: 'fa-house', label: 'Головна' },
    { id: 'inbox', icon: 'fa-inbox', label: 'Вхідні', acceptDrop: true },
    { id: 'next_actions', icon: 'fa-bolt', label: 'Наступні', acceptDrop: true },
    { id: 'projects', icon: 'fa-folder-tree', label: 'Проєкти' },
    { id: 'calendar', icon: 'fa-calendar-days', label: 'Календар' },
    { id: 'notes', icon: 'fa-note-sticky', label: 'Нотатки', acceptDrop: true },
  ];

  const widgetItems = [
    { id: 'diary', icon: 'fa-book-open', label: 'Щоденник' },
    { id: 'habits', icon: 'fa-repeat', label: 'Звички' },
    { id: 'people', icon: 'fa-user-ninja', label: 'Люди' },
    { id: 'focus', icon: 'fa-bullseye', label: 'Фокус' },
    { id: 'character', icon: 'fa-user-shield', label: 'Герой' },
    { id: 'shopping', icon: 'fa-cart-shopping', label: 'Покупки' },
  ];

  const bottomItems = [
    { id: 'hashtags', icon: 'fa-hashtag', label: 'Теги' },
    { id: 'hobbies', icon: 'fa-masks-theater', label: 'Хобі' },
    { id: 'completed', icon: 'fa-circle-check', label: 'Готово', acceptDrop: true },
    { id: 'trash', icon: 'fa-trash-can', label: 'Корзина', acceptDrop: true },
  ];

  const allNavItems = useMemo(() => [...primaryItems, ...widgetItems, ...bottomItems], []);

  const handleGlobalDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (!taskId) return;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    switch (targetId) {
      case 'today': scheduleTask(taskId, new Date().setHours(0,0,0,0)); break;
      case 'inbox': updateTask({ ...task, status: TaskStatus.INBOX, scheduledDate: undefined, projectId: undefined, category: 'unsorted', isDeleted: false }); break;
      case 'next_actions': updateTask({ ...task, status: TaskStatus.NEXT_ACTION, isDeleted: false }); break;
      case 'notes': updateTask({ ...task, category: 'note', status: TaskStatus.INBOX, isDeleted: false }); break;
      case 'completed': if (task.status !== TaskStatus.DONE) toggleTaskStatus(task); break;
      case 'trash': updateTask({ ...task, isDeleted: true }); break;
    }
  };

  const renderMenuItem = (item: any) => {
    if (sidebarSettings[item.id] === false) return null;
    const isActive = activeTab === item.id;
    
    return (
      <div key={item.id} onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleGlobalDrop(e, item.id)} className="relative group px-1">
        <button 
          onClick={() => { setActiveTab(item.id); if (showMobileMenu) setShowMobileMenu(false); }} 
          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-xl transition-all ${isActive ? 'bg-[var(--primary)] text-white shadow-sm' : 'text-[var(--text-muted)] hover:bg-black/5'}`}
        >
          <span className={`w-4 flex justify-center text-xs ${isActive ? 'text-white' : ''}`}><i className={`fa-solid ${item.icon}`}></i></span>
          {!isSidebarCollapsed && (
            <><span className="flex-1 text-left font-black text-[9px] tracking-widest truncate uppercase leading-none">{item.label}</span>
              {counts[item.id] > 0 && (
                <span className={`h-3.5 min-w-[14px] flex items-center justify-center rounded-full text-[7px] font-black px-1 ${isActive ? 'bg-white/20 text-white' : 'bg-[var(--border-color)] text-[var(--text-muted)]'}`}>
                  {counts[item.id]}
                </span>
              )}</>
          )}
        </button>
      </div>
    );
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <div className={`${isSidebarCollapsed ? 'w-14' : 'w-48'} hidden md:flex bg-sidebar border-r border-theme flex-col h-screen sticky top-0 z-40 transition-all duration-300 ease-in-out shrink-0`}>
        <div className="p-4 flex items-center justify-between">
          {!isSidebarCollapsed && <div className="text-xl font-black font-heading text-primary flex items-center gap-2 tracking-tighter leading-none"><span>12TR</span></div>}
          <button onClick={() => setSidebarCollapsed(!isSidebarCollapsed)} className="w-8 h-8 rounded-xl hover:bg-black/5 flex items-center justify-center text-muted hover:text-primary"><i className={`fa-solid ${isSidebarCollapsed ? 'fa-bars' : 'fa-chevron-left'}`}></i></button>
        </div>
        
        {!isSidebarCollapsed && (
          <div className="px-1 mb-2 animate-in fade-in zoom-in-95 duration-500">
            <MiniCalendar />
          </div>
        )}

        <nav className="flex-1 space-y-0.5 py-2 overflow-y-auto custom-scrollbar no-scrollbar pl-0.5">
          {primaryItems.map(renderMenuItem)}
          <div className="my-3 mx-4 border-t border-theme"></div>
          {!isSidebarCollapsed && <div className="px-4 mb-1"><span className="text-[7px] uppercase font-black tracking-widest text-muted opacity-50">Toolbox</span></div>}
          {widgetItems.map(renderMenuItem)}
        </nav>
        <div className="px-1 py-4 border-t border-theme space-y-0.5">
          {bottomItems.map(renderMenuItem)}
          <button 
            onClick={() => { setActiveTab('settings'); if (showMobileMenu) setShowMobileMenu(false); }} 
            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl transition-all ${activeTab === 'settings' ? 'bg-primary text-white shadow-sm' : 'text-muted hover:bg-black/5'}`}
          >
            <span className="w-4 flex justify-center text-[10px]"><i className="fa-solid fa-gear"></i></span>
            {!isSidebarCollapsed && <span className="font-black text-[9px] tracking-widest uppercase">Опції</span>}
          </button>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-sidebar/90 backdrop-blur-xl border-t border-theme z-50 flex items-center justify-around px-4 pb-safe">
         {[
           { id: 'today', icon: 'fa-star', label: 'Сьогодні' },
           { id: 'inbox', icon: 'fa-inbox', label: 'Вхідні' },
           { id: 'next_actions', icon: 'fa-bolt', label: 'Наступні' },
           { id: 'calendar', icon: 'fa-calendar-days', label: 'Календар' },
           { id: 'menu', icon: 'fa-grid-2', label: 'Модулі', isMenuTrigger: true }
         ].map(item => {
           const isActive = activeTab === item.id && !item.isMenuTrigger;
           return (
             <button 
              key={item.id} 
              onClick={() => item.isMenuTrigger ? setShowMobileMenu(true) : setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all ${isActive ? 'text-primary' : 'text-muted'}`}
             >
               <i className={`fa-solid ${item.isMenuTrigger ? 'fa-table-cells-large' : item.icon} text-lg mb-0.5`}></i>
               <span className="text-[6px] font-black uppercase tracking-tighter">{item.label}</span>
               {isActive && <div className="w-1 h-1 bg-primary rounded-full mt-0.5"></div>}
             </button>
           );
         })}
      </div>

      {/* Mobile Full Screen Menu */}
      {showMobileMenu && (
        <div className="fixed inset-0 z-[200] bg-sidebar md:hidden animate-in fade-in slide-in-from-bottom duration-300 flex flex-col">
           <header className="p-6 border-b border-theme flex justify-between items-center">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg"><i className="fa-solid fa-table-cells-large"></i></div>
                 <Typography variant="h2" className="text-xl">Системні Модулі</Typography>
              </div>
              <button onClick={() => setShowMobileMenu(false)} className="w-10 h-10 rounded-2xl bg-black/5 flex items-center justify-center text-muted"><i className="fa-solid fa-xmark"></i></button>
           </header>
           
           <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-3 gap-4 pb-20">
                 {allNavItems.map(item => {
                   if (sidebarSettings[item.id] === false) return null;
                   const isActive = activeTab === item.id;
                   
                   return (
                     <button 
                      key={item.id} 
                      onClick={() => { setActiveTab(item.id); setShowMobileMenu(false); }}
                      className={`flex flex-col items-center justify-center p-4 rounded-3xl border transition-all ${isActive ? 'bg-primary border-primary text-white shadow-xl' : 'bg-card border-theme text-muted shadow-sm'}`}
                     >
                       <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-2 ${isActive ? 'bg-white/10' : 'bg-black/5'}`}>
                          <i className={`fa-solid ${item.icon} text-lg`}></i>
                       </div>
                       <span className="text-[8px] font-black uppercase text-center leading-tight">{item.label}</span>
                       {counts[item.id] > 0 && <span className={`mt-1 text-[7px] font-black ${isActive ? 'text-white/60' : 'opacity-50'}`}>({counts[item.id]})</span>}
                     </button>
                   );
                 })}
                 
                 <button 
                  onClick={() => { setActiveTab('settings'); setShowMobileMenu(false); }}
                  className={`flex flex-col items-center justify-center p-4 rounded-3xl border transition-all ${activeTab === 'settings' ? 'bg-primary border-primary text-white shadow-xl' : 'bg-card border-theme text-muted shadow-sm'}`}
                 >
                   <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-2 ${activeTab === 'settings' ? 'bg-white/10' : 'bg-black/5'}`}>
                      <i className="fa-solid fa-gear text-lg"></i>
                   </div>
                   <span className="text-[8px] font-black uppercase text-center leading-tight">Опції</span>
                 </button>
              </div>
           </div>
           
           <footer className="p-6 border-t border-theme bg-black/5 text-center">
              <Typography variant="tiny" className="text-muted uppercase tracking-[0.2em] text-[8px]">12TR Life Engine Control Hub</Typography>
           </footer>
        </div>
      )}
    </>
  );
};

export default Sidebar;
