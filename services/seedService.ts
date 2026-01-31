
import { Task, Project, Person, Tag, Hobby, DiaryEntry, ShoppingStore, ShoppingItem, TaskStatus, Priority, TimeBlock, Character, TwelveWeekYear, InboxCategory } from '../types';

export const generateSeedData = () => {
  const today = new Date().setHours(0, 0, 0, 0);

  // 1. Мінімальні теги
  const tags: Tag[] = [
    { id: 'tag-1', name: 'робота', color: '#f97316', updatedAt: Date.now() },
    { id: 'tag-2', name: 'спорт', color: '#10b981', updatedAt: Date.now() },
    { id: 'tag-3', name: 'навчання', color: '#6366f1', updatedAt: Date.now() },
    { id: 'tag-4', name: 'терміново', color: '#ef4444', updatedAt: Date.now() }
  ];

  // 2. Базові хобі як категорії інтересів
  const hobbies: Hobby[] = [
    { id: 'hobby-1', name: 'Читання', color: '#6366f1', updatedAt: Date.now() },
    { id: 'hobby-2', name: 'Спорт', color: '#10b981', updatedAt: Date.now() },
    { id: 'hobby-3', name: 'Подорожі', color: '#f97316', updatedAt: Date.now() }
  ];

  // 3. Системні папки (Проєкти)
  const projects: Project[] = [
    { 
      id: 'folder_insights', 
      name: 'Інсайти', 
      color: '#f97316', 
      status: 'active', 
      progress: 0, 
      isStrategic: false, 
      description: 'FOLDER_NOTE', 
      updatedAt: Date.now() 
    }
  ];

  // 4. Базовий розпорядок дня (TimeBlocks)
  const timeBlocks: TimeBlock[] = [];
  const days = [0, 1, 2, 3, 4, 5, 6];
  days.forEach(day => {
    timeBlocks.push(
      { id: `tb-${day}-1`, title: 'Ранкова рутина', startHour: 7, endHour: 9, type: 'routine', dayOfWeek: day, color: '#10b981' },
      { id: `tb-${day}-2`, title: 'Робота/Навчання', startHour: 10, endHour: 13, type: 'work', dayOfWeek: day, color: '#f97316' },
      { id: `tb-${day}-3`, title: 'Відпочинок', startHour: 13, endHour: 14, type: 'rest', dayOfWeek: day, color: '#06b6d4' }
    );
  });

  // 5. Порожні масиви для контенту
  const tasks: Task[] = [];
  const people: Person[] = [];
  const diary: DiaryEntry[] = [];

  // 6. Персонаж та Цикл
  const character: Character = {
    name: 'Мандрівник', 
    race: 'Human', archetype: 'Strategist', role: 'Новачок', level: 1, xp: 0, gold: 0, 
    bio: '', vision: '', 
    avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=NewHero`, 
    energy: 100, maxEnergy: 100, focus: 100, goals: [], views: [], beliefs: [],
    preferences: { focusBlockers: [] }, skills: [], achievements: [], 
    stats: { health: 50, career: 50, finance: 50, education: 50, relationships: 50, rest: 50 },
    updatedAt: Date.now()
  };

  const cycle: TwelveWeekYear = { 
    id: 'c1', startDate: today, endDate: today + 86400000 * 84, 
    currentWeek: 1, globalExecutionScore: 0, updatedAt: Date.now() 
  };

  return {
    tags, hobbies, projects, people, tasks, diary, timeBlocks, character, cycle
  };
};
