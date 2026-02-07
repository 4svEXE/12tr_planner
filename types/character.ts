
export interface Skill {
  name: string;
  level: number;
  xp: number;
  icon: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: number;
}

export interface Character {
  name: string;
  race: 'Gnome' | 'Elf' | 'Human' | 'Dwarf';
  archetype: 'Strategist' | 'Builder' | 'Monk' | 'Explorer';
  role: string;
  level: number;
  xp: number;
  gold: number;
  bio: string;
  vision: string;
  avatarUrl: string;
  energy: number;
  maxEnergy: number;
  focus: number;
  goals: string[];
  views: string[];
  beliefs: string[];
  preferences: {
    workStyle?: string;
    planningStyle?: string;
    focusBlockers: string[];
  };
  skills: Skill[];
  achievements: Achievement[];
  stats: {
    health: number;
    career: number;
    finance: number;
    education: number;
    relationships: number;
    rest: number;
  };
  // Added updatedAt for synchronization consistency
  updatedAt: number;
}
