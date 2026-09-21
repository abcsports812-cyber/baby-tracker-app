import type { Ionicons } from '@expo/vector-icons';
import type { CategoryKey } from './colors';

export type IllustrationKey =
  | 'home'
  | 'calendar'
  | 'babyProfile'
  | 'feeding'
  | 'diaper'
  | 'sleep'
  | 'growth'
  | 'milestones'
  | 'health'
  | 'memories'
  | 'activities'
  | 'family'
  | 'notes'
  | 'reports'
  | 'reminders'
  | 'babyCare'
  | 'doctor'
  | 'settings';

// Only these 5 illustrations were supplied and approved for use.
// Every other module falls back to a themed icon badge in the same
// pastel visual language so the app stays consistent without them.
export const illustrationSources: Partial<Record<IllustrationKey, ReturnType<typeof require>>> = {
  home: require('../../assets/illustrations/home.webp'),
  calendar: require('../../assets/illustrations/calendar.webp'),
  babyProfile: require('../../assets/illustrations/baby-profile.webp'),
  feeding: require('../../assets/illustrations/feeding.webp'),
  diaper: require('../../assets/illustrations/diaper.webp'),
};

interface IconFallback {
  icon: keyof typeof Ionicons.glyphMap;
  category: CategoryKey;
}

export const illustrationIconFallback: Record<IllustrationKey, IconFallback> = {
  home: { icon: 'home', category: 'family' },
  calendar: { icon: 'calendar', category: 'appointment' },
  babyProfile: { icon: 'happy', category: 'family' },
  feeding: { icon: 'nutrition', category: 'feeding' },
  diaper: { icon: 'water', category: 'diaper' },
  sleep: { icon: 'moon', category: 'sleep' },
  growth: { icon: 'trending-up', category: 'growth' },
  milestones: { icon: 'star', category: 'milestone' },
  health: { icon: 'medkit', category: 'health' },
  memories: { icon: 'images', category: 'memory' },
  activities: { icon: 'game-controller', category: 'activity' },
  family: { icon: 'people', category: 'family' },
  notes: { icon: 'document-text', category: 'note' },
  reports: { icon: 'bar-chart', category: 'growth' },
  reminders: { icon: 'alarm', category: 'reminder' },
  babyCare: { icon: 'sparkles', category: 'bath' },
  doctor: { icon: 'medical', category: 'appointment' },
  settings: { icon: 'settings', category: 'family' },
};
