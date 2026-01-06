
import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { Task, Project, Character, Tag, Hobby, TaskStatus, Priority, TwelveWeekYear, ProjectSection, HabitDayData, DiaryEntry, InboxCategory, TimeBlock, RoutinePreset, ThemeType, ChecklistItem, ReportQuestion, Person, Memory, PersonNote, ImportantDate } from '../types';
import { saveState, loadState } from '../store';

export type CalendarViewMode = 'day' | 'week' | 'month' | 'year' | 'agenda';

interface AppContextType {
  tasks: Task[];
  projects: Project[];
  people: Person[];
  relationshipTypes: string[];
  cycle: TwelveWeekYear;
  character: Character;
  tags: Tag[];
  hobbies: Hobby[];
  diary: DiaryEntry[];
  inboxCategories: InboxCategory[];
  timeBlocks: TimeBlock[];
  blockHistory: Record<string, Record<string, 'pending' | 'completed' | 'missed'>>;
  routinePresets: RoutinePreset[];
  activeTab: string;
  theme: ThemeType;
  detailsWidth: number;
  sidebarSettings: Record<string, boolean>;
  isSidebarCollapsed: boolean;
  aiEnabled: boolean;
  calendarDate: number;
  calendarViewMode: CalendarViewMode;
  reportTemplate: ReportQuestion[];
  setCalendarDate: (date: number) => void;
  setCalendarViewMode: (mode: CalendarViewMode) => void;
  setDetailsWidth: (width: number) => void;
  setActiveTab: (tab: string) => void;
  setTheme: (theme: ThemeType) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setAiEnabled: (enabled: boolean) => void;
  updateSidebarSetting: (key: string, visible: boolean) => void;
  updateCharacter: (updates: Partial<Character>) => void;
  addTask: (title: string, category?: string, projectId?: string, projectSection?: ProjectSection, isEvent?: boolean, scheduledDate?: number, personId?: string) => string;
  addProject: (project: Omit<Project, 'id' | 'progress' | 'status'>) => string;
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
  addHobby: (name: string) => Hobby;
  renameHobby: (oldName: string, newName: string) => void;
  deleteHobby: (hobbyName: string) => void;
  saveDiaryEntry: (date: string, content: string) => void;
  deleteDiaryEntry: (id: string) => void;
  addInboxCategory: (title: string) => void;
  updateInboxCategory: (id: string, updates: Partial<InboxCategory>) => void;
  deleteInboxCategory: (id: string) => void;
  addTimeBlock: (block: Omit<TimeBlock, 'id'>) => void;
  updateTimeBlock: (block: TimeBlock) => void;
  deleteTimeBlock: (blockId: string) => void;
  setBlockStatus: (dateStr: string, blockId: string, status: 'pending' | 'completed' | 'missed') => void;
  saveRoutineAsPreset: (name: string, dayOfWeek: number) => void;
  applyRoutinePreset: (presetId: string, dayOfWeek: number) => void;
  addChecklistItem: (taskId: string, title: string) => void;
  toggleChecklistItem: (taskId: string, itemId: string) => void;
  removeChecklistItem: (taskId: string, itemId: string) => void;
  updateReportTemplate: (newTemplate: ReportQuestion[]) => void;
  // --- People Methods ---
  addPerson: (name: string) => string;
  updatePerson: (person: Person) => void;
  deletePerson: (id: string) => void;
  addPersonMemory: (personId: string, memory: Omit<Memory, 'id'>) => void;
  addPersonNote: (personId: string, text: string) => void;
  addRelationshipType: (type: string) => void;
  deleteRelationshipType: (type: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const SEED_TAGS: Tag[] = [
  { id: 'tg1', name: 'coding', color: '#3b82f6' },
  { id: 'tg2', name: 'ai', color: '#a855f7' },
  { id: 'tg3', name: 'health', color: '#10b981' },
  { id: 'tg4', name: 'finance', color: '#f59e0b' },
  { id: 'tg5', name: 'study', color: '#6366f1' },
];

const SEED_HOBBIES: Hobby[] = [
  { id: 'hb1', name: 'Chess', color: '#64748b' },
  { id: 'hb2', name: 'Hiking', color: '#10b981' },
  { id: 'hb3', name: 'Photography', color: '#ec4899' },
  { id: 'hb4', name: 'Podcasts', color: '#f97316' },
];

const SEED_RELATIONSHIP_TYPES = ['friend', 'colleague', 'family', 'mentor', 'acquaintance'];

const DEFAULT_REPORT_TEMPLATE: ReportQuestion[] = [
  { id: 'q1', text: 'Як твій день? (продуктивність, настрій)', page: 1 },
  { id: 'q2', text: 'Чи були ситуації, від яких я почувався не так, як зазвичай? (тривога, злість, несподіванка)', page: 1 },
  { id: 'q3', text: 'Які звички не виконав? чому? (мінімум 1)', page: 2 },
  { id: 'q4', text: 'За що і кому я вдячний?', page: 3 },
  { id: 'q5', text: 'За що вдячний собі?', page: 3 },
  { id: 'q6', text: 'Що було позитивного сьогодні?', page: 4 },
  { id: 'q7', text: 'Що не хочу терпіти / що змінив би?', page: 4 },
  { id: 'q8', text: 'Які можливості і ресурси у мене зараз є?', page: 5 },
  { id: 'q9', text: 'Як я можу вижати максимум з моєї ситуації?', page: 5 },
  { id: 'q10', text: 'Висновок дня:', page: 5 },
  { id: 'q11', text: 'Що лишнє в житті і побуті?', page: 6 },
  { id: 'q12', text: 'Як я спав? Що вплинуло на якість сну?', page: 6 },
  { id: 'q13', text: 'Чи ок калораж? чому?', page: 6 },
  { id: 'q14', text: 'Чи підготував їжу на завтра?', page: 6 },
];

const DEFAULT_INBOX_CATEGORIES: InboxCategory[] = [
  { id: 'pinned', title: 'Закріплено', icon: 'fa-thumbtack', isPinned: true },
  { id: 'unsorted', title: 'Вхідні', icon: 'fa-inbox', isPinned: false },
  { id: 'tasks', title: 'Завдання', icon: 'fa-check-to-slot', isPinned: false },
  { id: 'notes', title: 'Нотатки', icon: 'fa-note-sticky', isPinned: false },
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const savedState = loadState();

  const [activeTab, setActiveTab] = useState(savedState?.activeTab || 'dashboard');
  const [theme, setTheme] = useState<ThemeType>(savedState?.theme || 'classic');
  const [detailsWidth, setDetailsWidth] = useState(savedState?.detailsWidth || 450);
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(savedState?.isSidebarCollapsed || false);
  const [sidebarSettings, setSidebarSettings] = useState<Record<string, boolean>>(savedState?.sidebarSettings || {});
  const [aiEnabled, setAiEnabled] = useState<boolean>(savedState?.aiEnabled ?? false);
  
  const [calendarDate, setCalendarDate] = useState<number>(Date.now());
  const [calendarViewMode, setCalendarViewMode] = useState<CalendarViewMode>('month');

  const [cycle, setCycle] = useState<TwelveWeekYear>(savedState?.cycle || {
    id: 'c1', startDate: Date.now(), endDate: Date.now() + (1000 * 60 * 60 * 24 * 84), currentWeek: 1, globalExecutionScore: 65
  });

  const [tasks, setTasks] = useState<Task[]>(savedState?.tasks || []);
  const [diary, setDiary] = useState<DiaryEntry[]>(savedState?.diary || []);
  const [inboxCategories, setInboxCategories] = useState<InboxCategory[]>(savedState?.inboxCategories || DEFAULT_INBOX_CATEGORIES);
  const [projects, setProjects] = useState<Project[]>(savedState?.projects || []);
  const [people, setPeople] = useState<Person[]>(savedState?.people || []);
  const [relationshipTypes, setRelationshipTypes] = useState<string[]>(savedState?.relationshipTypes || SEED_RELATIONSHIP_TYPES);
  const [tags, setTags] = useState<Tag[]>(savedState?.tags?.length ? savedState.tags : SEED_TAGS);
  const [hobbies, setHobbies] = useState<Hobby[]>(savedState?.hobbies?.length ? savedState.hobbies : SEED_HOBBIES);
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>(savedState?.timeBlocks || []);
  const [blockHistory, setBlockHistory] = useState<Record<string, Record<string, 'pending' | 'completed' | 'missed'>>>(savedState?.blockHistory || {});
  const [routinePresets, setRoutinePresets] = useState<RoutinePreset[]>(savedState?.routinePresets || []);
  const [reportTemplate, setReportTemplate] = useState<ReportQuestion[]>(savedState?.reportTemplate || DEFAULT_REPORT_TEMPLATE);
  
  const [character, setCharacter] = useState<Character>(savedState?.character || {
    name: 'Hero', race: 'Human', archetype: 'Strategist', level: 1, xp: 0, gold: 0, bio: '', vision: '', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Hero', energy: 100, maxEnergy: 100, focus: 100, goals: [], views: [], skills: [], achievements: [], stats: { health: 50, career: 50, finance: 50, education: 50, relationships: 50, rest: 50 }
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    saveState({ tasks, projects, people, relationshipTypes, character, tags, hobbies, cycle, diary, inboxCategories, detailsWidth, sidebarSettings, isSidebarCollapsed, aiEnabled, timeBlocks, blockHistory, routinePresets, activeTab, theme, reportTemplate });
  }, [tasks, projects, people, relationshipTypes, character, tags, hobbies, cycle, diary, inboxCategories, detailsWidth, sidebarSettings, isSidebarCollapsed, aiEnabled, timeBlocks, blockHistory, routinePresets, activeTab, theme, reportTemplate]);

  const updateReportTemplate = useCallback((newTemplate: ReportQuestion[]) => {
    setReportTemplate(newTemplate);
  }, []);

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

  const updateCharacter = useCallback((updates: Partial<Character>) => setCharacter(prev => ({ ...prev, ...updates })), []);
  const updateSidebarSetting = (key: string, visible: boolean) => setSidebarSettings(prev => ({ ...prev, [key]: visible }));
  
  const addTask = useCallback((title: string, categoryId: string = 'unsorted', projectId?: string, projectSection: ProjectSection = 'actions', isEvent: boolean = false, scheduledDate?: number, personId?: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    const isHabit = projectSection === 'habits';
    const newTask: Task = { 
      id, 
      title, 
      status: TaskStatus.INBOX, 
      priority: Priority.NUI, 
      difficulty: 1, 
      xp: isHabit ? 150 : 50, 
      tags: isHabit ? ['habit'] : [], 
      createdAt: Date.now(), 
      category: categoryId, 
      projectId, 
      projectSection, 
      isEvent,
      scheduledDate,
      personId,
      habitHistory: {}, 
      checklist: [],
      isDeleted: false 
    };
    setTasks(prev => [newTask, ...prev]);
    return id;
  }, []);

  const addProject = useCallback((projectData: Omit<Project, 'id' | 'progress' | 'status'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newProject: Project = { ...projectData, id, progress: 0, status: 'active' };
    setProjects(prev => [newProject, ...prev]);
    return id;
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

  const moveTaskToCategory = (id: string, cat: string, isPinned?: boolean) => setTasks(prev => prev.map(t => t.id === id ? { ...t, category: cat, isPinned: isPinned ?? t.isPinned } : t));
  const moveTaskToProjectSection = (id: string, sec: ProjectSection) => setTasks(prev => prev.map(t => t.id === id ? { ...t, projectSection: sec } : t));
  const setProjectParent = (id: string, pId: string | undefined) => setProjects(prev => prev.map(p => p.id === id ? { ...p, parentFolderId: pId } : p));
  const addTag = useCallback((n: string) => { const nt = { id: Math.random().toString(36).substr(2, 9), name: n.toLowerCase(), color: `hsl(${Math.random() * 360}, 70%, 90%)` }; setTags(p => [...p, nt]); return nt; }, []);
  const renameTag = (o: string, n: string) => setTags(p => p.map(t => t.name === o ? { ...t, name: n } : t));
  const deleteTag = (n: string) => { setTags(p => p.filter(t => t.name !== n)); setTasks(p => p.map(t => ({...t, tags: t.tags.filter(tag => tag !== n)}))); };

  const addHobby = useCallback((n: string) => { const nh = { id: Math.random().toString(36).substr(2, 9), name: n, color: `hsl(${Math.random() * 360}, 60%, 80%)` }; setHobbies(p => [...p, nh]); return nh; }, []);
  const renameHobby = (o: string, n: string) => { setHobbies(p => p.map(h => h.name === o ? { ...h, name: n } : h)); setPeople(p => p.map(per => ({...per, hobbies: per.hobbies.map(h => h === o ? n : h)}))); };
  const deleteHobby = (n: string) => { setHobbies(p => p.filter(h => h.name !== n)); setPeople(p => p.map(per => ({...per, hobbies: per.hobbies.filter(h => h !== n)}))); };

  const saveDiaryEntry = useCallback((d: string, c: string) => setDiary(p => { const ex = p.find(e => e.date === d); return ex ? p.map(e => e.date === d ? { ...e, content: c, updatedAt: Date.now() } : e) : [{ id: Math.random().toString(36).substr(2, 9), date: d, content: c, createdAt: Date.now(), updatedAt: Date.now() }, ...p] }), []);
  const deleteDiaryEntry = (id: string) => setDiary(p => p.filter(e => e.id !== id));
  const addInboxCategory = (t: string) => setInboxCategories(p => [...p, { id: Math.random().toString(36).substr(2, 9), title: t, icon: 'fa-folder', isPinned: false }]);
  const updateInboxCategory = (id: string, u: any) => setInboxCategories(p => p.map(c => c.id === id ? { ...c, ...u } : c));
  const deleteInboxCategory = (id: string) => setInboxCategories(p => p.filter(c => c.id !== id));
  const toggleTaskPin = (id: string) => setTasks(p => p.map(t => t.id === id ? { ...t, isPinned: !t.isPinned } : t));

  const addChecklistItem = useCallback((taskId: string, title: string) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, checklist: [...(t.checklist || []), { id: Math.random().toString(36).substr(2, 9), title, completed: false }] } : t));
  }, []);

  const toggleChecklistItem = useCallback((taskId: string, itemId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return { ...t, checklist: (t.checklist || []).map(i => i.id === itemId ? { ...i, completed: !i.completed } : i) };
      }
      return t;
    }));
  }, []);

  const removeChecklistItem = useCallback((taskId: string, itemId: string) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, checklist: (t.checklist || []).filter(i => i.id !== itemId) } : t));
  }, []);

  // --- People Methods ---
  const addPerson = useCallback((name: string) => {
    const id = `person-${Math.random().toString(36).substr(2, 9)}`;
    const newPerson: Person = {
      id, name, status: 'acquaintance', rating: 5, tags: [], hobbies: [], socials: {}, notes: [], memories: [], importantDates: [], createdAt: Date.now(), lastInteractionAt: Date.now()
    };
    setPeople(prev => [newPerson, ...prev]);
    return id;
  }, []);

  const updatePerson = useCallback((person: Person) => {
    setPeople(prev => prev.map(p => p.id === person.id ? person : p));
  }, []);

  const deletePerson = useCallback((id: string) => {
    setPeople(prev => prev.filter(p => p.id !== id));
  }, []);

  const addPersonMemory = useCallback((personId: string, memory: Omit<Memory, 'id'>) => {
    setPeople(prev => prev.map(p => {
      if (p.id === personId) {
        return { ...p, memories: [{ ...memory, id: Math.random().toString(36).substr(2, 9) }, ...p.memories], lastInteractionAt: Date.now() };
      }
      return p;
    }));
  }, []);

  const addPersonNote = useCallback((personId: string, text: string) => {
    setPeople(prev => prev.map(p => {
      if (p.id === personId) {
        return { ...p, notes: [{ id: Math.random().toString(36).substr(2, 9), text, date: new Date().toISOString().split('T')[0] }, ...p.notes] };
      }
      return p;
    }));
  }, []);

  const addRelationshipType = useCallback((type: string) => {
    setRelationshipTypes(prev => [...new Set([...prev, type.toLowerCase().trim()])]);
  }, []);

  const deleteRelationshipType = useCallback((type: string) => {
    setRelationshipTypes(prev => prev.filter(t => t !== type));
  }, []);

  const value = useMemo(() => ({
    tasks, projects, people, relationshipTypes, cycle, character, tags, hobbies, diary, inboxCategories, timeBlocks, blockHistory, routinePresets, activeTab, setActiveTab, theme, setTheme,
    detailsWidth, setDetailsWidth, sidebarSettings, isSidebarCollapsed, setSidebarCollapsed, updateSidebarSetting,
    aiEnabled, setAiEnabled, updateCharacter, calendarDate, setCalendarDate, calendarViewMode, setCalendarViewMode,
    reportTemplate, updateReportTemplate,
    addTask, addProject, updateTask, updateProject, deleteProject, deleteTask, restoreTask, moveTaskToCategory, moveTaskToProjectSection, setProjectParent, scheduleTask, toggleTaskStatus, toggleHabitStatus, toggleTaskPin, undoLastAction: () => {},
    saveDiaryEntry, deleteDiaryEntry, addInboxCategory, updateInboxCategory, deleteInboxCategory,
    addTimeBlock, updateTimeBlock, deleteTimeBlock, setBlockStatus, saveRoutineAsPreset, applyRoutinePreset,
    addChecklistItem, toggleChecklistItem, removeChecklistItem,
    addPerson, updatePerson, deletePerson, addPersonMemory, addPersonNote, addRelationshipType, deleteRelationshipType,
    pendingUndo: false, addTag, renameTag, deleteTag, addHobby, renameHobby, deleteHobby
  }), [tasks, projects, people, relationshipTypes, cycle, character, tags, hobbies, diary, inboxCategories, timeBlocks, blockHistory, routinePresets, activeTab, theme, detailsWidth, sidebarSettings, isSidebarCollapsed, aiEnabled, calendarDate, calendarViewMode, reportTemplate, updateReportTemplate]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
