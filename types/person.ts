
export type PersonStatus = 'friend' | 'colleague' | 'family' | 'mentor' | 'acquaintance' | string;

export interface Interaction {
  id: string;
  type: 'call' | 'meeting' | 'chat' | 'event' | 'coffee' | 'walk' | 'other';
  date: number;
  summary: string;
  emotion: 'joy' | 'insight' | 'support' | 'neutral' | 'tense';
}

export interface Memory {
  id: string;
  event: string;
  emotion: 'joy' | 'insight' | 'support' | 'neutral' | 'sad';
  date: string;
}

export interface PersonNote {
  id: string;
  text: string;
  date: string;
}

export interface ImportantDate {
  id: string;
  label: string;
  date: string;
  showInCalendar: boolean;
  repeatYearly: boolean;
}

export type RelationshipLoop = 'week' | 'month' | 'quarter' | 'year' | 'none';

export interface Person {
  id: string;
  name: string;
  avatar?: string;
  status: PersonStatus;
  rating: number;
  birthDate?: string;
  birthDateShowInCalendar?: boolean;
  birthDateRepeatYearly?: boolean;
  location?: string;
  description?: string;
  tags: string[];
  hobbies: string[];
  socials: {
    telegram?: string;
    instagram?: string;
    linkedin?: string;
    threads?: string;
    tiktok?: string;
    website?: string;
  };
  notes: PersonNote[];
  memories: Memory[];
  interactions: Interaction[];
  importantDates: ImportantDate[];
  loop: RelationshipLoop;
  aiPortrait?: any;
  lastInteractionAt?: number;
  createdAt: number;
  isDeleted?: boolean;
}
