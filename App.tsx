
import React, { useState, useEffect, useMemo } from 'react';
import { AppProvider, useApp } from './contexts/AppContext';
import Sidebar from './components/Sidebar';
import Dashboard from './views/Dashboard';
import StrategyMap from './views/StrategyMap';
import Inbox from './views/Inbox';
import Calendar from './views/Calendar';
import Hashtags from './views/Hashtags';
import HobbiesView from './views/HobbiesView';
import DeepFocus from './views/DeepFocus';
import ProjectsView from './views/ProjectsView';
import HabitsView from './views/HabitsView';
import TodayView from './views/TodayView';
import NotesView from './views/NotesView';
import DiaryView from './views/DiaryView';
import TrashView from './views/TrashView';
import PeopleView from './views/PeopleView';
import CharacterProfile from './views/CharacterProfile';
import SettingsView from './views/SettingsView';
import { TaskStatus, Task } from './types';

const MainLayout: React.FC = () => {
  const { 
    activeTab, setActiveTab, tasks, pendingUndo, undoLastAction, character, projects,
    aiEnabled
  } = useApp();
  
  const [showFocusMode, setShowFocusMode] = React.useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [notifications, setNotifications] = useState<{id: string, task: Task}[]>([]);

  const todayTimestamp = new Date().setHours(0, 0, 0, 0);

  // Notification logic
  useEffect(() => {
    const checkSchedule = () => {
      const now = Date.now();
      const oneMinuteAgo = now - 60000;
      
      const dueTasks = tasks.filter(t => 
        !t.isDeleted && 
        t.status !== TaskStatus.DONE && 
        t.scheduledDate && 
        t.scheduledDate <= now && 
        t.scheduledDate > oneMinuteAgo
      );

      if (dueTasks.length > 0) {
        dueTasks.forEach(task => {
          setNotifications(prev => [{ id: Math.random().toString(), task }, ...prev]);
        });
      }
    };

    const interval = setInterval(checkSchedule, 60000);
    return () => clearInterval(interval);
  }, [tasks]);

  const removeNotification = (id: string) => {
    setNotifications(prev => setNotifications(prev.filter(n => n.id !== id)));
  };

  const counts = React.useMemo(() => ({
    today: tasks.filter(t => 
      !t.isDeleted &&
      t.status !== TaskStatus.DONE && 
      (t.scheduledDate && new Date(t.scheduledDate).setHours(0,0,0,0) === todayTimestamp)
    ).length,
    inbox: tasks.filter(t => {
      const isHabit = t.projectSection === 'habits' || t.tags.includes('habit');
      return !t.isDeleted && t.status === TaskStatus.INBOX && t.category !== 'note' && !isHabit && !t.projectId && !t.scheduledDate;
    }).length,
    next_actions: tasks.filter(t => !t.isDeleted && t.status === TaskStatus.NEXT_ACTION).length,
    notes: tasks.filter(t => !t.isDeleted && t.category === 'note' && t.status !== TaskStatus.DONE).length,
    calendar: tasks.filter(t => !t.isDeleted && t.status !== TaskStatus.DONE && !!t.scheduledDate).length,
    trash: tasks.filter(t => t.isDeleted).length
  }), [tasks, todayTimestamp]);

  const renderContent = () => {
    switch (activeTab) {
      case 'today': return <TodayView />;
      case 'dashboard': return <Dashboard character={character} tasks={tasks.filter(t => !t.isDeleted)} projects={projects} />;
      case 'map': return <StrategyMap />;
      case 'inbox': return <Inbox />;
      case 'next_actions': return <Inbox showNextActions />;
      case 'diary': return <DiaryView />;
      case 'notes': return <NotesView />;
      case 'habits': return <HabitsView />;
      case 'people': return <PeopleView />;
      case 'hobbies': return <HobbiesView />;
      case 'completed': return <Inbox showCompleted />;
      case 'calendar': return <Calendar />;
      case 'projects': return <ProjectsView />;
      case 'hashtags': return <Hashtags tasks={tasks.filter(t => !t.isDeleted)} />;
      case 'trash': return <TrashView />;
      case 'character': return <CharacterProfile />;
      case 'settings': return <SettingsView />;
      case 'focus': return (
        <div className="flex flex-col items-center justify-center h-full p-12 text-center">
          <div className="w-24 h-24 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-4xl mb-6">
            <i className="fa-solid fa-bullseye"></i>
          </div>
          <h2 className="text-3xl font-black mb-4">Глибокий Фокус</h2>
          <p className="text-slate-500 mb-8 max-w-sm">Обери завдання для занурення. Жодних сповіщень, тільки ти і твоя мета.</p>
          <button 
            onClick={() => setShowFocusMode(true)}
            className="px-10 py-4 bg-orange-600 text-white rounded-2xl font-black shadow-xl hover:bg-orange-700"
          >
            УВІЙТИ В ПОТІК
          </button>
        </div>
      );
      default: return null;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800 selection:bg-orange-100 selection:text-orange-900 overflow-hidden">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} counts={counts} />
      
      <main className="flex-1 overflow-y-auto relative">
        {renderContent()}

        {showFocusMode && (
          <DeepFocus 
            taskTitle={tasks.find(t => !t.isDeleted)?.title || "Робота над проектом"} 
            onExit={() => setShowFocusMode(false)} 
          />
        )}

        <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none">
          {notifications.map(n => (
            <div key={n.id} className="pointer-events-auto bg-[var(--text-main)] text-[var(--bg-card)] p-4 rounded-2xl shadow-2xl flex items-center gap-4 border border-white/10 tiktok-blur w-72">
              <div className="w-10 h-10 rounded-xl bg-[var(--primary)] flex items-center justify-center text-white shrink-0">
                <i className="fa-solid fa-bolt"></i>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-black uppercase text-[var(--primary)] mb-1">Час квесту!</div>
                <div className="text-[11px] font-bold truncate leading-tight">{n.task.title}</div>
              </div>
              <button onClick={() => removeNotification(n.id)} className="w-6 h-6 rounded-lg hover:bg-white/10 flex items-center justify-center">
                <i className="fa-solid fa-xmark text-[9px]"></i>
              </button>
            </div>
          ))}
        </div>

        {pendingUndo && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] w-full max-w-sm px-4">
            <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between overflow-hidden relative border border-white/10">
              <div className="flex items-center gap-3">
                <i className="fa-solid fa-circle-check text-emerald-400"></i>
                <span className="text-sm font-bold">Завдання завершене!</span>
              </div>
              <button 
                onClick={undoLastAction}
                className="text-xs font-black uppercase text-orange-400 hover:text-white"
              >
                Відмінити
              </button>
              <div className="absolute bottom-0 left-0 h-1 bg-orange-500 w-full"></div>
            </div>
          </div>
        )}

        {aiEnabled && !isAiOpen && (
          <button 
            onClick={() => setIsAiOpen(true)}
            className="fixed bottom-8 right-8 w-14 h-14 rounded-2xl bg-gradient-to-tr from-orange-500 to-pink-500 text-white shadow-2xl shadow-orange-200 flex items-center justify-center group z-40"
          >
            <i className="fa-solid fa-wand-magic-sparkles text-xl"></i>
          </button>
        )}
      </main>

      <div 
        className={`fixed top-0 right-0 h-screen bg-white/80 border-l border-slate-100 flex flex-col tiktok-blur shadow-[-20px_0_50px_rgba(0,0,0,0.05)] z-[100] ${
          isAiOpen ? 'w-80 translate-x-0' : 'w-0 translate-x-full invisible pointer-events-none'
        }`}
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h3 className="font-heading font-black text-lg flex items-center gap-3 text-slate-900 whitespace-nowrap">
            <i className="fa-solid fa-wand-magic-sparkles text-orange-500"></i> Асистент
          </h3>
          <button 
            onClick={() => setIsAiOpen(false)}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400"
          >
            <i className="fa-solid fa-chevron-right text-xs"></i>
          </button>
        </div>

        <div className="flex-1 p-6 space-y-4 overflow-y-auto custom-scrollbar">
          <div className="bg-orange-50 p-4 rounded-2xl rounded-tl-none border border-orange-100 text-sm font-medium leading-relaxed text-orange-800 shadow-sm">
            Привіт! Я твій стратегічний асистент. Увімкнути чи налаштувати мої функції можна в меню налаштувань. Чим можу допомогти зараз?
          </div>
        </div>

        <div className="p-6 border-t border-slate-100">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Спитай що завгодно..." 
              className="w-full bg-slate-100 border-none rounded-2xl py-4 pl-5 pr-12 text-sm focus:ring-2 focus:ring-orange-500 font-medium"
            />
            <button className="absolute right-2 top-2 w-10 h-10 bg-orange-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-orange-200">
              <i className="fa-solid fa-paper-plane text-xs"></i>
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

const App: React.FC = () => (
  <AppProvider>
    <MainLayout />
  </AppProvider>
);

export default App;
