
import React, { createContext, useContext, useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Task, Project, Character, Tag, TaskStatus, Priority, TwelveWeekYear, ProjectSection, HabitDayData, DiaryEntry, InboxCategory, TimeBlock, RoutinePreset } from '../types';
import { saveState, loadState } from '../store';

interface AppContextType {
  tasks: Task[];
  projects: Project[];
  cycle: TwelveWeekYear;
  character: Character;
  tags: Tag[];
  diary: DiaryEntry[];
  inboxCategories: InboxCategory[];
  timeBlocks: TimeBlock[];
  blockHistory: Record<string, Record<string, 'pending' | 'completed' | 'missed'>>;
  routinePresets: RoutinePreset[];
  activeTab: string;
  detailsWidth: number;
  sidebarSettings: Record<string, boolean>;
  isSidebarCollapsed: boolean;
  aiEnabled: boolean;
  setDetailsWidth: (width: number) => void;
  setActiveTab: (tab: string) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setAiEnabled: (enabled: boolean) => void;
  updateSidebarSetting: (key: string, visible: boolean) => void;
  updateCharacter: (updates: Partial<Character>) => void;
  addTask: (title: string, category?: string, projectId?: string, projectSection?: ProjectSection) => void;
  addProject: (project: Omit<Project, 'id' | 'progress' | 'status'>) => void;
  updateTask: (task: Task) => void;
  updateProject: (project: Project) => void;
  deleteProject: (projectId: string) => void;
  deleteTask: (taskId: string, permanent?: boolean) => void;
  restoreTask: (taskId: string) => void;
  moveTaskToCategory: (taskId: string, category: string, isPinned?: boolean) => void;
  moveTaskToProjectSection: (taskId: string, section: ProjectSection) => void;
  setProjectParent: (projectId: string, parentId: string | undefined) => void;
  scheduleTask: (taskId: string, date: number | undefined) => void;
  toggleTaskStatus: (task: Task) => void;
  toggleHabitStatus: (habitId: string, dateStr: string, status?: 'completed' | 'skipped' | 'none', note?: string) => void;
  toggleTaskPin: (taskId: string) => void;
  undoLastAction: () => void;
  pendingUndo: boolean;
  addTag: (name: string) => Tag;
  renameTag: (oldName: string, newName: string) => void;
  deleteTag: (tagName: string) => void;
  saveDiaryEntry: (date: string, content: string) => void;
  deleteDiaryEntry: (id: string) => void;
  addInboxCategory: (title: string) => void;
  updateInboxCategory: (id: string, updates: Partial<InboxCategory>) => void;
  deleteInboxCategory: (id: string) => void;
  // Scheduling methods
  addTimeBlock: (block: Omit<TimeBlock, 'id'>) => void;
  updateTimeBlock: (block: TimeBlock) => void;
  deleteTimeBlock: (blockId: string) => void;
  setBlockStatus: (dateStr: string, blockId: string, status: 'pending' | 'completed' | 'missed') => void;
  saveRoutineAsPreset: (name: string, dayOfWeek: number) => void;
  applyRoutinePreset: (presetId: string, dayOfWeek: number) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const DEFAULT_INBOX_CATEGORIES: InboxCategory[] = [
  { id: 'pinned', title: 'Закріплено', icon: 'fa-thumbtack', isPinned: true },
  { id: 'unsorted', title: 'Несортовано', icon: 'fa-box-open', isPinned: false },
  { id: 'tasks', title: 'Завдання', icon: 'fa-check-to-slot', isPinned: false },
  { id: 'notes', title: 'Нотатки', icon: 'fa-note-sticky', isPinned: false },
  { id: 'hypothesis', title: 'Гіпотези', icon: 'fa-flask', isPinned: false },
  { id: 'useful', title: 'Корисне', icon: 'fa-bookmark', isPinned: false },
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const savedState = loadState();

  const [activeTab, setActiveTab] = useState('today');
  const [detailsWidth, setDetailsWidth] = useState(savedState?.detailsWidth || 450);
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(savedState?.isSidebarCollapsed || false);
  const [sidebarSettings, setSidebarSettings] = useState<Record<string, boolean>>(savedState?.sidebarSettings || {});
  const [aiEnabled, setAiEnabled] = useState<boolean>(savedState?.aiEnabled || false);
  
  const [cycle, setCycle] = useState<TwelveWeekYear>(savedState?.cycle || {
    id: 'c1', startDate: Date.now() - (1000 * 60 * 60 * 24 * 25), endDate: Date.now() + (1000 * 60 * 60 * 24 * 59), currentWeek: 4, globalExecutionScore: 78
  });

  const [tasks, setTasks] = useState<Task[]>(savedState?.tasks || []);
  const [diary, setDiary] = useState<DiaryEntry[]>(savedState?.diary || []);
  const [inboxCategories, setInboxCategories] = useState<InboxCategory[]>(savedState?.inboxCategories || DEFAULT_INBOX_CATEGORIES);
  const [projects, setProjects] = useState<Project[]>(savedState?.projects || []);
  const [tags, setTags] = useState<Tag[]>(savedState?.tags || []);
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>(savedState?.timeBlocks || []);
  const [blockHistory, setBlockHistory] = useState<Record<string, Record<string, 'pending' | 'completed' | 'missed'>>>(savedState?.blockHistory || {});
  const [routinePresets, setRoutinePresets] = useState<RoutinePreset[]>(savedState?.routinePresets || []);
  const [character, setCharacter] = useState<Character>(savedState?.character || {
    name: 'Тален', race: 'Elf', archetype: 'Strategist', level: 4, xp: 2450, gold: 152, bio: '...', vision: '...', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Talent', energy: 85, maxEnergy: 100, focus: 92, goals: [], views: [], skills: [], achievements: [], stats: { health: 85, career: 42, finance: 68, education: 30, relationships: 55, rest: 40 }
  });

  useEffect(() => {
    saveState({ tasks, projects, character, tags, cycle, diary, inboxCategories, detailsWidth, sidebarSettings, isSidebarCollapsed, aiEnabled, timeBlocks, blockHistory, routinePresets });
  }, [tasks, projects, character, tags, cycle, diary, inboxCategories, detailsWidth, sidebarSettings, isSidebarCollapsed, aiEnabled, timeBlocks, blockHistory, routinePresets]);

  const addTimeBlock = useCallback((blockData: Omit<TimeBlock, 'id'>) => {
    const newBlock: TimeBlock = { ...blockData, id: Math.random().toString(36).substr(2, 9) };
    setTimeBlocks(prev => [...prev, newBlock].sort((a, b) => a.startHour - b.startHour));
  }, []);

  const updateTimeBlock = useCallback((updated: TimeBlock) => {
    setTimeBlocks(prev => prev.map(b => b.id === updated.id ? updated : b));
  }, []);

  const deleteTimeBlock = useCallback((blockId: string) => {
    setTimeBlocks(prev => prev.filter(b => b.id !== blockId));
  }, []);

  const setBlockStatus = useCallback((dateStr: string, blockId: string, status: 'pending' | 'completed' | 'missed') => {
    setBlockHistory(prev => ({
      ...prev,
      [dateStr]: { ...(prev[dateStr] || {}), [blockId]: status }
    }));
  }, []);

  const saveRoutineAsPreset = useCallback((name: string, dayOfWeek: number) => {
    const blocks = timeBlocks.filter(b => b.dayOfWeek === dayOfWeek);
    if (blocks.length === 0) return;
    const newPreset: RoutinePreset = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      blocks: blocks.map(({ id, ...rest }) => rest)
    };
    setRoutinePresets(prev => [...prev, newPreset]);
  }, [timeBlocks]);

  const applyRoutinePreset = useCallback((presetId: string, dayOfWeek: number) => {
    const preset = routinePresets.find(p => p.id === presetId);
    if (!preset) return;
    const newBlocks: TimeBlock[] = preset.blocks.map(b => ({
      ...b,
      id: Math.random().toString(36).substr(2, 9),
      dayOfWeek
    }));
    setTimeBlocks(prev => [...prev.filter(b => b.dayOfWeek !== dayOfWeek), ...newBlocks]);
  }, [routinePresets]);

  // Rest of state logic remains identical...
  const updateCharacter = useCallback((updates: Partial<Character>) => setCharacter(prev => ({ ...prev, ...updates })), []);
  const updateSidebarSetting = (key: string, visible: boolean) => setSidebarSettings(prev => ({ ...prev, [key]: visible }));
  const addTask = useCallback((title: string, categoryId: string = 'tasks', projectId?: string, projectSection: ProjectSection = 'actions') => {
    const newTask: Task = { id: Math.random().toString(36).substr(2, 9), title, status: TaskStatus.INBOX, priority: Priority.NUI, difficulty: 1, xp: 50, tags: [], createdAt: Date.now(), category: categoryId, projectId, projectSection, habitHistory: {}, isDeleted: false };
    setTasks(prev => [newTask, ...prev]);
  }, []);
  const addProject = useCallback((projectData: Omit<Project, 'id' | 'progress' | 'status'>) => {
    const newProject: Project = { ...projectData, id: Math.random().toString(36).substr(2, 9), progress: 0, status: 'active' };
    setProjects(prev => [newProject, ...prev]);
  }, []);
  const updateTask = useCallback((t: Task) => setTasks(prev => prev.map(old => old.id === t.id ? t : old)), []);
  const updateProject = useCallback((p: Project) => setProjects(prev => prev.map(old => old.id === p.id ? p : old)), []);
  const deleteTask = useCallback((id: string, perm = false) => setTasks(prev => perm ? prev.filter(t => t.id !== id) : prev.map(t => t.id === id ? { ...t, isDeleted: true } : t)), []);
  const restoreTask = useCallback((id: string) => setTasks(prev => prev.map(t => t.id === id ? { ...t, isDeleted: false } : t)), []);
  const deleteProject = useCallback((id: string) => setProjects(prev => prev.filter(p => p.id !== id)), []);
  const scheduleTask = useCallback((id: string, date: number | undefined) => setTasks(prev => prev.map(t => t.id === id ? { ...t, scheduledDate: date } : t)), []);
  const toggleTaskStatus = useCallback((task: Task) => {
    const isNowDone = task.status !== TaskStatus.DONE;
    updateTask({ ...task, status: isNowDone ? TaskStatus.DONE : TaskStatus.INBOX });
  }, [updateTask]);
  const toggleHabitStatus = useCallback((id: string, d: string, s?: any, n?: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        const history = { ...(t.habitHistory || {}) };
        history[d] = { status: s || (history[d]?.status === 'completed' ? 'none' : 'completed'), note: n || history[d]?.note };
        return { ...t, habitHistory: history };
      }
      return t;
    }));
  }, []);
  const moveTaskToCategory = (id: string, cat: string) => setTasks(prev => prev.map(t => t.id === id ? { ...t, category: cat } : t));
  const moveTaskToProjectSection = (id: string, sec: ProjectSection) => setTasks(prev => prev.map(t => t.id === id ? { ...t, projectSection: sec } : t));
  const setProjectParent = (id: string, pId: string | undefined) => setProjects(prev => prev.map(p => p.id === id ? { ...p, parentFolderId: pId } : p));
  const addTag = useCallback((n: string) => { const nt = { id: Math.random().toString(36).substr(2, 9), name: n.toLowerCase(), color: '#orange' }; setTags(p => [...p, nt]); return nt; }, []);
  const renameTag = (o: string, n: string) => setTags(p => p.map(t => t.name === o ? { ...t, name: n } : t));
  const deleteTag = (n: string) => setTags(p => p.filter(t => t.name !== n));
  const saveDiaryEntry = useCallback((d: string, c: string) => setDiary(p => { const ex = p.find(e => e.date === d); return ex ? p.map(e => e.date === d ? { ...e, content: c, updatedAt: Date.now() } : e) : [{ id: Math.random().toString(36).substr(2, 9), date: d, content: c, createdAt: Date.now(), updatedAt: Date.now() }, ...p] }), []);
  const deleteDiaryEntry = (id: string) => setDiary(p => p.filter(e => e.id !== id));
  const addInboxCategory = (t: string) => setInboxCategories(p => [...p, { id: Math.random().toString(36).substr(2, 9), title: t, icon: 'fa-folder', isPinned: false }]);
  const updateInboxCategory = (id: string, u: any) => setInboxCategories(p => p.map(c => c.id === id ? { ...c, ...u } : c));
  const deleteInboxCategory = (id: string) => setInboxCategories(p => p.filter(c => c.id !== id));
  const toggleTaskPin = (id: string) => setTasks(p => p.map(t => t.id === id ? { ...t, isPinned: !t.isPinned } : t));

  const value = useMemo(() => ({
    tasks, projects, cycle, character, tags, diary, inboxCategories, timeBlocks, blockHistory, routinePresets, activeTab, setActiveTab,
    detailsWidth, setDetailsWidth, sidebarSettings, isSidebarCollapsed, setSidebarCollapsed, updateSidebarSetting,
    aiEnabled, setAiEnabled, updateCharacter,
    addTask, addProject, updateTask, updateProject, deleteProject, deleteTask, restoreTask, moveTaskToCategory, moveTaskToProjectSection, setProjectParent, scheduleTask, toggleTaskStatus, toggleHabitStatus, toggleTaskPin, undoLastAction: () => {},
    saveDiaryEntry, deleteDiaryEntry, addInboxCategory, updateInboxCategory, deleteInboxCategory,
    addTimeBlock, updateTimeBlock, deleteTimeBlock, setBlockStatus, saveRoutineAsPreset, applyRoutinePreset,
    pendingUndo: false, addTag, renameTag, deleteTag
  }), [tasks, projects, cycle, character, tags, diary, inboxCategories, timeBlocks, blockHistory, routinePresets, activeTab, detailsWidth, sidebarSettings, isSidebarCollapsed, aiEnabled]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
