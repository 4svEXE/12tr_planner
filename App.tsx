
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
import ShoppingView from './views/ShoppingView';
import { TaskStatus, Task } from './types';

const MainLayout: React.FC = () => {
  const { 
    activeTab, setActiveTab, tasks, pendingUndo, undoLastAction, character, projects,
    aiEnabled, theme
  } = useApp();
  
  const [showFocusMode, setShowFocusMode] = React.useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [notifications, setNotifications] = useState<{id: string, task: Task}[]>([]);
  const hasApiKey = !!localStorage.getItem('GEMINI_API_KEY');

  const todayTimestamp = new Date().setHours(0, 0, 0, 0);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Notification logic
  useEffect(() => {
    const checkSchedule = () => {
      const now = Date.now();
      const oneMinuteAgo = now - 60000;
      const dueTasks = tasks.filter(t => !t.isDeleted && t.status !== TaskStatus.DONE && t.scheduledDate && t.scheduledDate <= now && t.scheduledDate > oneMinuteAgo);
      if (dueTasks.length > 0) {
        dueTasks.forEach(task => setNotifications(prev => [{ id: Math.random().toString(), task }, ...prev]));
      }
    };
    const interval = setInterval(checkSchedule, 60000);
    return () => clearInterval(interval);
  }, [tasks]);

  const removeNotification = (id: string) => setNotifications(prev => prev.filter(n => n.id !== id));

  const counts = React.useMemo(() => ({
    today: tasks.filter(t => !t.isDeleted && t.status !== TaskStatus.DONE && (t.scheduledDate && new Date(t.scheduledDate).setHours(0,0,0,0) === todayTimestamp)).length,
    inbox: tasks.filter(t => !t.isDeleted && t.status === TaskStatus.INBOX && t.category !== 'note' && !t.projectId && !t.scheduledDate).length,
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
      case 'shopping': return <ShoppingView />;
      case 'completed': return <Inbox showCompleted />;
      case 'calendar': return <Calendar />;
      case 'projects': return <ProjectsView />;
      case 'hashtags': return <Hashtags tasks={tasks.filter(t => !t.isDeleted)} />;
      case 'trash': return <TrashView />;
      case 'character': return <CharacterProfile />;
      case 'settings': return <SettingsView />;
      case 'focus': return (
        <div className="flex flex-col items-center justify-center h-full p-12 text-center bg-[var(--bg-main)]">
          <div className="w-24 h-24 bg-[var(--primary)]/10 text-[var(--primary)] rounded-full flex items-center justify-center text-4xl mb-6">
            <i className="fa-solid fa-bullseye"></i>
          </div>
          <h2 className="text-3xl font-black mb-4">Глибокий Фокус</h2>
          <button onClick={() => setShowFocusMode(true)} className="px-10 py-4 bg-[var(--primary)] text-white rounded-2xl font-black shadow-xl">УВІЙТИ В ПОТІК</button>
        </div>
      );
      default: return null;
    }
  };

  return (
    <div className="flex min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] transition-colors duration-500 overflow-hidden">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} counts={counts} />
      <main className="flex-1 overflow-y-auto relative">
        {renderContent()}
        {showFocusMode && <DeepFocus taskTitle={tasks.find(t => !t.isDeleted)?.title || "Робота над проектом"} onExit={() => setShowFocusMode(false)} />}
        {aiEnabled && !isAiOpen && (
          <button onClick={() => setIsAiOpen(true)} className="fixed bottom-8 right-8 w-14 h-14 rounded-2xl bg-[var(--primary)] text-white shadow-2xl flex items-center justify-center z-40">
            <i className="fa-solid fa-wand-magic-sparkles text-xl"></i>
          </button>
        )}
      </main>
      <div className={`fixed top-0 right-0 h-screen bg-[var(--bg-card)]/90 border-l border-[var(--border-color)] flex flex-col backdrop-blur-xl transition-all duration-300 z-[100] ${isAiOpen ? 'w-80 translate-x-0' : 'w-0 translate-x-full invisible'}`}>
        <div className="flex items-center justify-between p-6 border-b border-[var(--border-color)]">
          <h3 className="font-black text-lg flex items-center gap-3"><i className="fa-solid fa-wand-magic-sparkles text-[var(--primary)]"></i> Асистент</h3>
          <button onClick={() => setIsAiOpen(false)} className="text-[var(--text-muted)]"><i className="fa-solid fa-chevron-right text-xs"></i></button>
        </div>
        <div className="flex-1 p-6 space-y-4 overflow-y-auto">
          <div className="bg-[var(--primary)]/5 p-4 rounded-2xl border border-[var(--primary)]/10 text-sm font-medium leading-relaxed">
            Привіт! Я твій стратегічний асистент. Чим можу допомогти?
          </div>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => (
  <AppProvider>
    <MainLayout />
  </AppProvider>
);

export default App;
