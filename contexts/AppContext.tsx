
import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { Task, Project, Character, Tag, Hobby, TaskStatus, Priority, TwelveWeekYear, ProjectSection, HabitDayData, DiaryEntry, InboxCategory, TimeBlock, RoutinePreset, ThemeType, ChecklistItem, ReportQuestion, Person, Memory, PersonNote, ImportantDate, ShoppingStore, ShoppingItem, Interaction } from '../types';
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
  shoppingStores: ShoppingStore[];
  shoppingItems: ShoppingItem[];
  setCalendarDate: (date: number) => void;
  setCalendarViewMode: (mode: CalendarViewMode) => void;
  setDetailsWidth: (width: number) => void;
  setActiveTab: (tab: string) => void;
  setTheme: (theme: ThemeType) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setAiEnabled: (enabled: boolean) => void;
  updateSidebarSetting: (key: string, visible: boolean) => void;
  updateCharacter: (updates: Partial<Character>) => void;
  addTask: (title: string, category?: string, projectId?: string, projectSection?: ProjectSection, isEvent?: boolean, scheduledDate?: number, personId?: string, status?: TaskStatus) => string;
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
  saveDiaryEntry: (date: string, content: string, id?: string) => string;
  deleteDiaryEntry: (id: string) => void;
  addInboxCategory: (title: string, scope: 'inbox' | 'actions', color?: InboxCategory['color']) => void;
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
  addPerson: (name: string, status?: string) => string;
  updatePerson: (person: Person) => void;
  deletePerson: (id: string) => void;
  addPersonMemory: (personId: string, memory: Omit<Memory, 'id'>) => void;
  addPersonNote: (personId: string, text: string) => void;
  addInteraction: (personId: string, interaction: Omit<Interaction, 'id'>) => void;
  deleteInteraction: (personId: string, id: string) => void;
  addRelationshipType: (type: string) => void;
  deleteRelationshipType: (type: string) => void;
  updateCycle: (updates: Partial<TwelveWeekYear>) => void;
  toggleCycleDay: (dateStr: string) => void;
  setWeeklyScore: (weekNum: number, score: number) => void;
  addStore: (name: string, icon?: string, color?: string) => void;
  updateStore: (store: ShoppingStore) => void;
  deleteStore: (id: string) => void;
  addShoppingItem: (name: string, storeId: string) => void;
  updateShoppingItem: (item: ShoppingItem) => void;
  toggleShoppingItem: (id: string) => void;
  deleteShoppingItem: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// SEED DATA GENERATOR FOR PEOPLE
const generateSeedPeople = (): Person[] => {
  const categories = ['friend', 'colleague', 'family', 'mentor', 'acquaintance'];
  const names: Record<string, string[]> = {
    friend: ['Макс Кава', 'Олена Спорт', 'Дмитро Гік', 'Іра Арт', 'Саша Тревел'],
    colleague: ['Артем Проджект', 'Вікторія HR', 'Ігор Розробка', 'Наталя Маркетинг', 'Сергій Аналітик'],
    family: ['Мама', 'Тато', 'Брат Олег', 'Сестра Анна', 'Дядько Петро'],
    mentor: ['Богдан Стратег', 'Марина Коуч', 'Професор Коваль', 'Інвестор Марк', 'Майстер Йода'],
    acquaintance: ['Сусід з 5го', 'Бармен Алекс', 'Юрій Ремонт', 'Світлана Стоматолог', 'Курєр Нової Пошти']
  };

  const results: Person[] = [];
  categories.forEach(cat => {
    names[cat].forEach((name, idx) => {
      const lastInt = Date.now() - (Math.random() * 1000 * 60 * 60 * 24 * 40); // random contact in last 40 days
      results.push({
        id: `seed-${cat}-${idx}`,
        name,
        status: cat,
        rating: 40 + Math.floor(Math.random() * 50),
        loop: cat === 'friend' ? 'week' : cat === 'family' ? 'month' : 'quarter',
        hobbies: ['Спорт', 'Технології', 'Книги'].slice(0, 1 + Math.floor(Math.random() * 2)),
        tags: [cat.toUpperCase()],
        socials: { telegram: name.split(' ')[0].toLowerCase() },
        notes: [{ id: `n-${idx}`, text: 'Важливий контакт з початкової бази.', date: new Date().toISOString() }],
        memories: [],
        interactions: [],
        importantDates: [{ id: `d-${idx}`, label: 'Річниця', date: '2024-06-15', showInCalendar: true, repeatYearly: true }],
        lastInteractionAt: lastInt,
        createdAt: Date.now() - 1000000
      });
    });
  });
  return results;
};

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

  const [cycle, setCycle] = useState<TwelveWeekYear>(savedState?.cycle || { id: 'c1', startDate: Date.now(), endDate: Date.now() + (1000 * 60 * 60 * 24 * 84), currentWeek: 1, globalExecutionScore: 0 });

  const [tasks, setTasks] = useState<Task[]>(savedState?.tasks || []);
  const [diary, setDiary] = useState<DiaryEntry[]>(savedState?.diary && savedState.diary.length > 0 ? savedState.diary : []);
  const [inboxCategories, setInboxCategories] = useState<InboxCategory[]>(savedState?.inboxCategories || [
    { id: 'pinned', title: 'Закріплено', icon: 'fa-thumbtack', isPinned: true, scope: 'inbox' },
    { id: 'unsorted', title: 'Вхідні', icon: 'fa-inbox', isPinned: false, scope: 'inbox' },
    { id: 'tasks', title: 'Завдання', icon: 'fa-bolt', isPinned: false, scope: 'actions' },
    { id: 'notes', title: 'Нотатки', icon: 'fa-note-sticky', isPinned: false, scope: 'inbox' },
  ]);
  const [projects, setProjects] = useState<Project[]>(savedState?.projects || []);
  const [people, setPeople] = useState<Person[]>(savedState?.people?.length ? savedState.people : generateSeedPeople());
  const [relationshipTypes, setRelationshipTypes] = useState<string[]>(savedState?.relationshipTypes || ['friend', 'colleague', 'family', 'mentor', 'acquaintance']);
  const [tags, setTags] = useState<Tag[]>(savedState?.tags?.length ? savedState.tags : []);
  const [hobbies, setHobbies] = useState<Hobby[]>(savedState?.hobbies || []);
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>(savedState?.timeBlocks || []);
  const [blockHistory, setBlockHistory] = useState<Record<string, Record<string, 'pending' | 'completed' | 'missed'>>>(savedState?.blockHistory || {});
  const [routinePresets, setRoutinePresets] = useState<RoutinePreset[]>(savedState?.routinePresets || []);
  const [reportTemplate, setReportTemplate] = useState<ReportQuestion[]>(savedState?.reportTemplate && savedState.reportTemplate.length > 0 ? savedState.reportTemplate : []);
  
  const [shoppingStores, setShoppingStores] = useState<ShoppingStore[]>(savedState?.shoppingStores || []);
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>(savedState?.shoppingItems || []);

  const [character, setCharacter] = useState<Character>(savedState?.character || {
    name: 'Гравець', race: 'Human', archetype: 'Strategist', role: 'Новачок', level: 1, xp: 0, gold: 0, 
    bio: 'Герой на початку шляху.', vision: 'Стати майстром своєї долі.', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Hero', 
    energy: 100, maxEnergy: 100, focus: 100, goals: [], views: [], beliefs: [],
    preferences: { focusBlockers: [] },
    skills: [], achievements: [], stats: { health: 50, career: 50, finance: 50, education: 50, relationships: 50, rest: 50 }
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    saveState({ tasks, projects, people, relationshipTypes, character, tags, hobbies, cycle, diary, inboxCategories, detailsWidth, sidebarSettings, isSidebarCollapsed, aiEnabled, timeBlocks, blockHistory, routinePresets, activeTab, theme, reportTemplate, shoppingStores, shoppingItems });
  }, [tasks, projects, people, relationshipTypes, character, tags, hobbies, cycle, diary, inboxCategories, detailsWidth, sidebarSettings, isSidebarCollapsed, aiEnabled, timeBlocks, blockHistory, routinePresets, activeTab, theme, reportTemplate, shoppingStores, shoppingItems]);

  const updateSidebarSetting = useCallback((key: string, visible: boolean) => {
    setSidebarSettings(prev => ({ ...prev, [key]: visible }));
  }, []);

  const updateCharacter = useCallback((updates: Partial<Character>) => {
    setCharacter(prev => ({ ...prev, ...updates }));
  }, []);

  const updateReportTemplate = useCallback((newTemplate: ReportQuestion[]) => {
    setReportTemplate(newTemplate);
  }, []);

  const saveDiaryEntry = useCallback((d: string, c: string, id?: string) => {
    let finalId = id;
    setDiary(p => {
      if (id) {
        return p.map(e => e.id === id ? { ...e, date: d, content: c, updatedAt: Date.now() } : e);
      } else {
        finalId = Math.random().toString(36).substr(2, 9);
        return [{ id: finalId, date: d, content: c, createdAt: Date.now(), updatedAt: Date.now() }, ...p];
      }
    });
    return finalId || '';
  }, []);

  const value = useMemo(() => ({
    tasks, projects, people, relationshipTypes, cycle, character, tags, hobbies, diary, inboxCategories, timeBlocks, blockHistory, routinePresets, activeTab, setActiveTab, theme, setTheme,
    detailsWidth, setDetailsWidth, sidebarSettings, isSidebarCollapsed, setSidebarCollapsed, updateSidebarSetting,
    aiEnabled, setAiEnabled, updateCharacter, calendarDate, setCalendarDate, calendarViewMode, setCalendarViewMode,
    reportTemplate, updateReportTemplate, shoppingStores, shoppingItems,
    addTask: (title: string, categoryId: string = 'unsorted', projectId?: string, section: ProjectSection = 'actions', isEvent = false, date?: number, personId?: string, status: TaskStatus = TaskStatus.INBOX) => {
        const id = Math.random().toString(36).substr(2,9);
        const newTask: Task = { id, title, status, priority: Priority.NUI, difficulty: 1, xp: 50, tags: [], createdAt: Date.now(), category: categoryId, projectId, projectSection: section, isEvent, scheduledDate: date, personId };
        setTasks(prev => [newTask, ...prev]);
        return id;
    },
    addProject: (p: any) => { const id = Math.random().toString(36).substr(2,9); setProjects(prev => [...prev, { ...p, id, progress: 0, status: 'active' }]); return id; },
    updateTask: (t: Task) => setTasks(prev => {
      const exists = prev.some(old => old.id === t.id);
      if (exists) return prev.map(old => old.id === t.id ? t : old);
      return [t, ...prev];
    }),
    updateProject: (p: Project) => setProjects(prev => prev.map(old => old.id === p.id ? p : old)),
    deleteProject: (id: string) => setProjects(prev => prev.filter(p => p.id !== id)),
    deleteTask: (id: string, perm = false) => setTasks(prev => perm ? prev.filter(t => t.id !== id) : prev.map(t => t.id === id ? { ...t, isDeleted: true } : t)),
    restoreTask: (id: string) => setTasks(prev => prev.map(t => t.id === id ? { ...t, isDeleted: false } : t)),
    moveTaskToCategory: (id: string, cat: string) => setTasks(prev => prev.map(t => t.id === id ? { ...t, category: cat } : t)),
    moveTaskToProjectSection: (id: string, sec: ProjectSection) => setTasks(prev => prev.map(t => t.id === id ? { ...t, projectSection: sec } : t)),
    setProjectParent: (id: string, pId: string | undefined) => setProjects(prev => prev.map(p => p.id === id ? { ...p, parentFolderId: pId } : p)),
    scheduleTask: (id: string, date: number | undefined) => setTasks(prev => prev.map(t => t.id === id ? { ...t, scheduledDate: date } : t)),
    toggleTaskStatus: (task: Task) => { const isNowDone = task.status !== TaskStatus.DONE; setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: isNowDone ? TaskStatus.DONE : TaskStatus.INBOX, completedAt: isNowDone ? Date.now() : undefined } : t)); },
    toggleHabitStatus: (id: string, d: string, s?: any, n?: string) => setTasks(prev => prev.map(t => { if (t.id === id) { const history = { ...(t.habitHistory || {}) }; history[d] = { status: s || (history[d]?.status === 'completed' ? 'none' : 'completed'), note: n || history[d]?.note }; return { ...t, habitHistory: history }; } return t; })),
    toggleTaskPin: (id: string) => setTasks(p => p.map(t => t.id === id ? { ...t, isPinned: !t.isPinned } : t)),
    undoLastAction: () => {}, pendingUndo: false,
    addTag: (n: string) => { const nt = { id: Math.random().toString(36).substr(2,9), name: n, color: '#f97316' }; setTags(p => [...p, nt]); return nt; },
    renameTag: (o: string, n: string) => setTags(p => p.map(t => t.name === o ? { ...t, name: n } : t)),
    deleteTag: (n: string) => setTags(p => p.filter(t => t.name !== n)),
    addHobby: (n: string) => { const nh = { id: Math.random().toString(36).substr(2,9), name: n, color: '#f97316' }; setHobbies(p => [...p, nh]); return nh; },
    renameHobby: (o: string, n: string) => setHobbies(p => p.map(h => h.name === o ? { ...h, name: n } : h)),
    deleteHobby: (n: string) => setHobbies(p => p.filter(h => h.name !== n)),
    saveDiaryEntry, deleteDiaryEntry: (id: string) => setDiary(p => p.filter(e => e.id !== id)),
    addInboxCategory: (t: string, scope: any, color: any) => setInboxCategories(p => [...p, { id: Math.random().toString(36).substr(2,9), title: t, icon: 'fa-folder', isPinned: false, scope, color }]),
    updateInboxCategory: (id: string, u: any) => setInboxCategories(p => p.map(c => c.id === id ? { ...c, ...u } : c)),
    deleteInboxCategory: (id: string) => setInboxCategories(p => p.filter(c => c.id !== id)),
    addTimeBlock: (b: any) => setTimeBlocks(p => [...p, { ...b, id: Math.random().toString(36).substr(2,9) }]),
    updateTimeBlock: (b: TimeBlock) => setTimeBlocks(p => p.map(old => old.id === b.id ? b : old)),
    deleteTimeBlock: (id: string) => setTimeBlocks(p => p.filter(b => b.id !== id)),
    setBlockStatus: (d: string, bid: string, s: any) => setBlockHistory(prev => ({ ...prev, [d]: { ...(prev[d] || {}), [bid]: s } })),
    saveRoutineAsPreset: (n: string, d: number) => { const bs = timeBlocks.filter(b => b.dayOfWeek === d); setRoutinePresets(p => [...p, { id: Math.random().toString(36).substr(2,9), name: n, blocks: bs }]); },
    applyRoutinePreset: (id: string, d: number) => { const pr = routinePresets.find(x => x.id === id); if (pr) setTimeBlocks(prev => [...prev.filter(b => b.dayOfWeek !== d), ...pr.blocks.map(b => ({ ...b, id: Math.random().toString(36).substr(2,9), dayOfWeek: d }))]); },
    addChecklistItem: (tid: string, title: string) => setTasks(p => p.map(t => t.id === tid ? { ...t, checklist: [...(t.checklist || []), { id: Math.random().toString(36).substr(2,9), title, completed: false }] } : t)),
    toggleChecklistItem: (tid: string, iid: string) => setTasks(p => p.map(t => t.id === tid ? { ...t, checklist: t.checklist?.map(i => i.id === iid ? { ...i, completed: !i.completed } : i) } : t)),
    removeChecklistItem: (tid: string, iid: string) => setTasks(p => p.map(t => t.id === tid ? { ...t, checklist: t.checklist?.filter(i => i.id !== iid) } : t)),
    addPerson: (n: string, status: string = 'acquaintance') => { const id = `p-${Math.random().toString(36).substr(2,9)}`; setPeople(prev => [...prev, { id, name: n, status, rating: 5, tags: [], hobbies: [], socials: {}, notes: [], memories: [], interactions: [], importantDates: [], loop: 'month', createdAt: Date.now() }]); return id; },
    updatePerson: (p: Person) => setPeople(prev => prev.map(old => old.id === p.id ? p : old)),
    deletePerson: (id: string) => setPeople(prev => prev.filter(p => p.id !== id)),
    addPersonMemory: (pid: string, m: any) => setPeople(p => p.map(x => x.id === pid ? { ...x, memories: [{ ...m, id: Math.random().toString(36).substr(2,9) }, ...x.memories] } : x)),
    addPersonNote: (pid: string, text: string) => setPeople(p => p.map(x => x.id === pid ? { ...x, notes: [{ id: Math.random().toString(36).substr(2,9), text, date: new Date().toISOString() }, ...x.notes] } : x)),
    addInteraction: (pid: string, i: any) => setPeople(p => p.map(x => x.id === pid ? { ...x, lastInteractionAt: i.date, interactions: [{ ...i, id: Math.random().toString(36).substr(2,9) }, ...(x.interactions || [])] } : x)),
    deleteInteraction: (pid: string, iid: string) => setPeople(p => p.map(x => x.id === pid ? { ...x, interactions: (x.interactions || []).filter(i => i.id !== iid) } : x)),
    addRelationshipType: (t: string) => setRelationshipTypes(p => [...new Set([...p, t])]),
    deleteRelationshipType: (t: string) => setRelationshipTypes(p => p.filter(x => x !== t)),
    updateCycle: (u: any) => setCycle(p => ({ ...p, ...u })),
    toggleCycleDay: (d: string) => {}, setWeeklyScore: (w: number, s: number) => {},
    addStore: (name: string, icon = 'fa-shop', color = '#f97316') => setShoppingStores(prev => [...prev, { id: Math.random().toString(36).substr(2,9), name, icon, color }]),
    updateStore: (s: ShoppingStore) => setShoppingStores(p => p.map(x => x.id === s.id ? s : x)),
    deleteStore: (id: string) => { setShoppingStores(p => p.filter(x => x.id !== id)); setShoppingItems(p => p.filter(x => x.storeId !== id)); },
    addShoppingItem: (name: string, storeId: string) => setShoppingItems(prev => [...prev, { id: Math.random().toString(36).substr(2,9), name, storeId, isBought: false }]),
    updateShoppingItem: (item: ShoppingItem) => setShoppingItems(p => p.map(x => x.id === item.id ? item : x)),
    toggleShoppingItem: (id: string) => setShoppingItems(p => p.map(x => x.id === id ? { ...x, isBought: !x.isBought } : x)),
    deleteShoppingItem: (id: string) => setShoppingItems(p => p.filter(x => x.id !== id))
  }), [tasks, projects, people, relationshipTypes, cycle, character, tags, hobbies, diary, inboxCategories, timeBlocks, blockHistory, routinePresets, activeTab, theme, detailsWidth, sidebarSettings, isSidebarCollapsed, aiEnabled, calendarDate, calendarViewMode, reportTemplate, shoppingStores, shoppingItems, saveDiaryEntry, updateSidebarSetting, updateCharacter, updateReportTemplate, setAiEnabled]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
