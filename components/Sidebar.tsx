
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
        <button onClick={() => { setActiveTab(item.id); setShowMobileTools(false); }} className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-xl transition-all ${isActive ? 'bg-orange-50 text-orange-700 border border-orange-100 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>
          <span className={`w-4 flex justify-center text-xs ${isActive ? 'text-orange-600' : ''}`}><i className={`fa-solid ${item.icon}`}></i></span>
          {!isSidebarCollapsed && (
            <><span className="flex-1 text-left font-black text-[9px] tracking-widest truncate uppercase leading-none">{item.label}</span>
              {counts[item.id] > 0 && <span className="h-3.5 min-w-[14px] flex items-center justify-center rounded-full text-[7px] font-black px-1 bg-slate-100 text-slate-500">{counts[item.id]}</span>}</>
          )}
        </button>
      </div>
    );
  };

  return (
    <>
      <div className={`${isSidebarCollapsed ? 'w-14' : 'w-48'} hidden md:flex bg-white border-r border-slate-100 flex-col h-screen sticky top-0 z-40 transition-all duration-300 ease-in-out shrink-0`}>
        <div className="p-4 flex items-center justify-between">
          {!isSidebarCollapsed && <div className="text-xl font-black font-heading text-orange-600 flex items-center gap-2 tracking-tighter leading-none"><span>12TR</span></div>}
          <button onClick={() => setSidebarCollapsed(!isSidebarCollapsed)} className="w-8 h-8 rounded-xl hover:bg-slate-50 flex items-center justify-center text-slate-300 hover:text-slate-600"><i className={`fa-solid ${isSidebarCollapsed ? 'fa-bars' : 'fa-chevron-left'}`}></i></button>
        </div>
        <nav className="flex-1 space-y-0.5 py-2 overflow-y-auto custom-scrollbar no-scrollbar pl-0.5">
          {primaryItems.map(renderMenuItem)}
          <div className="my-3 mx-4 border-t border-slate-50"></div>
          {!isSidebarCollapsed && <div className="px-4 mb-1"><span className="text-[7px] uppercase font-black tracking-widest text-slate-300">Toolbox</span></div>}
          {widgetItems.map(renderMenuItem)}
        </nav>
        <div className="px-1 py-4 border-t border-slate-50 space-y-0.5">
          {bottomItems.map(renderMenuItem)}
          <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl transition-all ${activeTab === 'settings' ? 'bg-orange-50 text-orange-700 shadow-sm' : 'text-slate-400 hover:bg-slate-50'}`}>
            <span className={`w-4 flex justify-center text-[10px] ${activeTab === 'settings' ? 'text-orange-600' : ''}`}><i className="fa-solid fa-gear"></i></span>
            {!isSidebarCollapsed && <span className="font-black text-[9px] tracking-widest uppercase">Налаштування</span>}
          </button>
        </div>
      </div>

      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-xl border-t border-slate-100 z-[100] flex items-center justify-around px-2 pb-safe">
         <button onClick={() => setActiveTab('today')} className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all ${activeTab === 'today' ? 'text-orange-600 font-black' : 'text-slate-400'}`}>
           <i className="fa-solid fa-star text-lg mb-1"></i>
           <span className="text-[6px] font-black uppercase tracking-tighter">Сьогодні</span>
         </button>
         <button onClick={() => setActiveTab('inbox')} className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all ${activeTab === 'inbox' ? 'text-orange-600 font-black' : 'text-slate-400'}`}>
           <i className="fa-solid fa-inbox text-lg mb-1"></i>
           <span className="text-[6px] font-black uppercase tracking-tighter">Вхідні</span>
         </button>
         <button onClick={() => setActiveTab('calendar')} className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all ${activeTab === 'calendar' ? 'text-orange-600 font-black' : 'text-slate-400'}`}>
           <i className="fa-solid fa-calendar-days text-lg mb-1"></i>
           <span className="text-[6px] font-black uppercase tracking-tighter">Календар</span>
         </button>
         <button onClick={() => setActiveTab('projects')} className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all ${activeTab === 'projects' ? 'text-orange-600 font-black' : 'text-slate-400'}`}>
           <i className="fa-solid fa-folder-tree text-lg mb-1"></i>
           <span className="text-[6px] font-black uppercase tracking-tighter">Проєкти</span>
         </button>
         <button onClick={() => setShowMobileTools(true)} className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all ${showMobileTools ? 'text-orange-600 bg-orange-50' : 'text-slate-400'}`}>
           <i className="fa-solid fa-shapes text-lg mb-1"></i>
           <span className="text-[6px] font-black uppercase tracking-tighter">Меню</span>
         </button>
      </div>

      {showMobileTools && (
        <div className="md:hidden fixed inset-0 z-[200] tiktok-blur animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-white/60" onClick={() => setShowMobileTools(false)}></div>
          <div className="absolute inset-x-4 bottom-24 top-12 bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10">
             <header className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                <Typography variant="h2" className="text-lg">Арсенал Героя</Typography>
                <button onClick={() => setShowMobileTools(false)} className="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center text-slate-400"><i className="fa-solid fa-xmark"></i></button>
             </header>
             <div className="flex-1 overflow-y-auto p-6 grid grid-cols-3 gap-4 content-start">
                {[...primaryItems, ...widgetItems, ...bottomItems].map(item => {
                  const isActive = activeTab === item.id;
                  return (
                    <button 
                      key={item.id} 
                      onClick={() => { setActiveTab(item.id); setShowMobileTools(false); }}
                      className={`flex flex-col items-center justify-center p-4 rounded-[1.5rem] transition-all aspect-square border ${isActive ? 'bg-orange-600 border-orange-600 text-white shadow-lg' : 'bg-slate-50 border-slate-100 text-slate-500'}`}
                    >
                      <i className={`fa-solid ${item.icon} text-xl mb-2`}></i>
                      <span className="text-[7px] font-black uppercase text-center leading-tight">{item.label}</span>
                      {counts[item.id] > 0 && <span className={`mt-1 px-1.5 py-0.5 rounded-full text-[6px] font-black ${isActive ? 'bg-white text-orange-600' : 'bg-slate-200 text-slate-500'}`}>{counts[item.id]}</span>}
                    </button>
                  );
                })}
                <button onClick={() => { setActiveTab('settings'); setShowMobileTools(false); }} className={`flex flex-col items-center justify-center p-4 rounded-[1.5rem] transition-all aspect-square border ${activeTab === 'settings' ? 'bg-orange-600 border-orange-600 text-white shadow-lg' : 'bg-slate-100 border-slate-200 text-slate-500'}`}>
                    <i className="fa-solid fa-gear text-xl mb-2"></i>
                    <span className="text-[7px] font-black uppercase text-center leading-tight">Налаштування</span>
                </button>
             </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
