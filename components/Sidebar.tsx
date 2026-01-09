
import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
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
    isSidebarCollapsed, setSidebarCollapsed, sidebarSettings
  } = useApp();
  
  const [showMobileTools, setShowMobileTools] = useState(false);

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
    { id: 'map', icon: 'fa-map-location-dot', label: 'Карта' },
    { id: 'diary', icon: 'fa-book-open', label: 'Щоденник' },
    { id: 'habits', icon: 'fa-repeat', label: 'Звички' },
    { id: 'people', icon: 'fa-users-between-lines', label: 'Люди' },
    { id: 'hashtags', icon: 'fa-hashtag', label: 'Теги' },
    { id: 'hobbies', icon: 'fa-masks-theater', label: 'Хобі' },
    { id: 'focus', icon: 'fa-bullseye', label: 'Фокус' },
    { id: 'character', icon: 'fa-user-shield', label: 'Герой' },
    { id: 'shopping', icon: 'fa-cart-shopping', label: 'Покупки' },
  ];

  const bottomItems = [
    { id: 'completed', icon: 'fa-circle-check', label: 'Готово', acceptDrop: true },
    { id: 'trash', icon: 'fa-trash-can', label: 'Корзина', acceptDrop: true },
  ];

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
          onClick={() => { setActiveTab(item.id); setShowMobileTools(false); }} 
          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-xl transition-all ${
            isActive 
              ? 'bg-[var(--primary)] text-white shadow-md' 
              : 'text-[var(--text-muted)] hover:bg-[var(--bg-main)] hover:text-[var(--text-main)]'
          }`}
        >
          <span className={`w-4 flex justify-center text-xs ${isActive ? 'text-white' : ''}`}>
            <i className={`fa-solid ${item.icon}`}></i>
          </span>
          {!isSidebarCollapsed && (
            <><span className="flex-1 text-left font-black text-[9px] tracking-widest truncate uppercase leading-none">{item.label}</span>
              {counts[item.id] > 0 && (
                <span className={`h-3.5 min-w-[14px] flex items-center justify-center rounded-full text-[7px] font-black px-1 ${
                  isActive ? 'bg-white/20 text-white' : 'bg-[var(--border-color)] text-[var(--text-muted)]'
                }`}>
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
      <div className={`${isSidebarCollapsed ? 'w-14' : 'w-48'} hidden md:flex bg-[var(--bg-sidebar)] border-r border-[var(--border-color)] flex-col h-screen sticky top-0 z-40 transition-all duration-300 ease-in-out shrink-0`}>
        <div className="p-4 flex items-center justify-between">
          {!isSidebarCollapsed && <div className="text-xl font-black text-[var(--primary)] flex items-center gap-2 tracking-tighter leading-none"><span>12TR</span></div>}
          <button onClick={() => setSidebarCollapsed(!isSidebarCollapsed)} className="w-8 h-8 rounded-xl hover:bg-[var(--bg-main)] flex items-center justify-center text-[var(--text-muted)]"><i className={`fa-solid ${isSidebarCollapsed ? 'fa-bars' : 'fa-chevron-left'}`}></i></button>
        </div>
        <nav className="flex-1 space-y-0.5 py-2 overflow-y-auto custom-scrollbar pl-0.5">
          {primaryItems.map(renderMenuItem)}
          <div className="my-3 mx-4 border-t border-[var(--border-color)] opacity-50"></div>
          {!isSidebarCollapsed && <div className="px-4 mb-1"><span className="text-[7px] uppercase font-black tracking-widest text-[var(--text-muted)]">Toolbox</span></div>}
          {widgetItems.map(renderMenuItem)}
        </nav>
        <div className="px-1 py-4 border-t border-[var(--border-color)] space-y-0.5">
          {bottomItems.map(renderMenuItem)}
          <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl transition-all ${activeTab === 'settings' ? 'bg-[var(--primary)] text-white shadow-md' : 'text-[var(--text-muted)] hover:bg-[var(--bg-main)]'}`}>
            <span className="w-4 flex justify-center text-[10px]"><i className="fa-solid fa-gear"></i></span>
            {!isSidebarCollapsed && <span className="font-black text-[9px] tracking-widest uppercase">Налаштування</span>}
          </button>
        </div>
      </div>

      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[var(--bg-sidebar)]/95 backdrop-blur-xl border-t border-[var(--border-color)] z-[100] flex items-center justify-around px-2 pb-safe">
         {[primaryItems[0], primaryItems[2], primaryItems[5], primaryItems[4]].map(item => (
           <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex flex-col items-center justify-center w-12 h-12 transition-all ${activeTab === item.id ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'}`}>
             <i className={`fa-solid ${item.icon} text-lg mb-1`}></i>
             <span className="text-[6px] font-black uppercase tracking-tighter">{item.label}</span>
           </button>
         ))}
         <button onClick={() => setShowMobileTools(true)} className={`flex flex-col items-center justify-center w-12 h-12 transition-all ${showMobileTools ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'}`}>
           <i className="fa-solid fa-shapes text-lg mb-1"></i>
           <span className="text-[6px] font-black uppercase tracking-tighter">Меню</span>
         </button>
      </div>

      {showMobileTools && (
        <div className="md:hidden fixed inset-0 z-[200] tiktok-blur animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-[var(--bg-main)]/60" onClick={() => setShowMobileTools(false)}></div>
          <div className="absolute inset-x-4 bottom-24 top-12 bg-[var(--bg-card)] rounded-[var(--radius)] shadow-2xl border border-[var(--border-color)] flex flex-col overflow-hidden animate-in slide-in-from-bottom-10">
             <header className="p-6 border-b border-[var(--border-color)] flex justify-between items-center">
                <Typography variant="h2" className="text-lg">Арсенал</Typography>
                <button onClick={() => setShowMobileTools(false)} className="w-10 h-10 rounded-2xl bg-[var(--bg-main)] shadow-sm flex items-center justify-center text-[var(--text-muted)]"><i className="fa-solid fa-xmark"></i></button>
             </header>
             <div className="flex-1 overflow-y-auto p-6 grid grid-cols-3 gap-4 content-start">
                {[...primaryItems, ...widgetItems, ...bottomItems, {id: 'settings', label: 'Опції', icon: 'fa-gear'}].map(item => {
                  const isActive = activeTab === item.id;
                  return (
                    <button 
                      key={item.id} 
                      onClick={() => { setActiveTab(item.id); setShowMobileTools(false); }}
                      className={`flex flex-col items-center justify-center p-4 rounded-2xl transition-all aspect-square border ${
                        isActive 
                          ? 'bg-[var(--primary)] border-[var(--primary)] text-white shadow-lg' 
                          : 'bg-[var(--bg-main)] border-[var(--border-color)] text-[var(--text-muted)]'
                      }`}
                    >
                      <i className={`fa-solid ${item.icon} text-xl mb-2`}></i>
                      <span className="text-[7px] font-black uppercase text-center leading-tight">{item.label}</span>
                    </button>
                  );
                })}
             </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
