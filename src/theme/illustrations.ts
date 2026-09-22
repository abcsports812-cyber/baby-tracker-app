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
  | 'settings'
  | 'solidFood'
  | 'sounds'
  | 'guides'
  | 'pumping';

// All 18 approved illustrations are integrated here. "activities" is
// intentionally left without a source: the supplied 19th image (a baby
// journaling) doesn't visually match the Activities module (play, tummy
// time, reading, outdoor, music, sensory), so it falls back to a themed
// icon badge instead of forcing a mismatched illustration.
export const illustrationSources: Partial<Record<IllustrationKey, ReturnType<typeof require>>> = {
  home: require('../../assets/illustrations/home.webp'),
  calendar: require('../../assets/illustrations/calendar.webp'),
  babyProfile: require('../../assets/illustrations/baby-profile.webp'),
  feeding: require('../../assets/illustrations/feeding.webp'),
  diaper: require('../../assets/illustrations/diaper.webp'),
  sleep: require('../../assets/illustrations/sleep.webp'),
  growth: require('../../assets/illustrations/growth.webp'),
  milestones: require('../../assets/illustrations/milestones.webp'),
  health: require('../../assets/illustrations/health.webp'),
  memories: require('../../assets/illustrations/memories.webp'),
  family: require('../../assets/illustrations/family.webp'),
  notes: require('../../assets/illustrations/notes.webp'),
  reports: require('../../assets/illustrations/reports.webp'),
  reminders: require('../../assets/illustrations/reminders.webp'),
  babyCare: require('../../assets/illustrations/babycare.webp'),
  doctor: require('../../assets/illustrations/doctor.webp'),
  settings: require('../../assets/illustrations/settings.webp'),
  solidFood: require('../../assets/illustrations/solid-food.webp'),
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
  solidFood: { icon: 'restaurant', category: 'feeding' },
  sounds: { icon: 'headset', category: 'sound' },
  guides: { icon: 'book-outline', category: 'growth' },
  pumping: { icon: 'timer-outline', category: 'feeding' },
};
