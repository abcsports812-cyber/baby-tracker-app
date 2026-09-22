import { createCollectionStore } from '../lib/collectionStore';
import { createSingletonStore } from '../lib/singletonStore';
import type {
  ActivityRecord,
  Appointment,
  AppSettings,
  BabyCareRecord,
  BabyProfile,
  Caregiver,
  DiaperRecord,
  FeedingRecord,
  GrowthRecord,
  HealthRecord,
  JournalNote,
  Memory,
  Milestone,
  RecentGuideEntry,
  RecentSoundEntry,
  Reminder,
  SleepRecord,
  SoundMix,
  ToothRecord,
  Vaccination,
} from '../types/models';

export const useBabyProfileStore = createSingletonStore<BabyProfile | null>('babyProfile', null);

export const useSettingsStore = createSingletonStore<AppSettings>('settings', {
  weightUnit: 'kg',
  heightUnit: 'cm',
  notificationsEnabled: true,
  themeMode: 'light',
  language: 'English',
  onboardingCompleted: false,
});

export const useFeedingStore = createCollectionStore<FeedingRecord>('feeding');
export const useDiaperStore = createCollectionStore<DiaperRecord>('diaper');
export const useSleepStore = createCollectionStore<SleepRecord>('sleep');
export const useGrowthStore = createCollectionStore<GrowthRecord>('growth');
export const useMilestoneStore = createCollectionStore<Milestone>('milestones');
export const useVaccinationStore = createCollectionStore<Vaccination>('vaccinations');
export const useHealthRecordStore = createCollectionStore<HealthRecord>('healthRecords');
export const useAppointmentStore = createCollectionStore<Appointment>('appointments');
export const useReminderStore = createCollectionStore<Reminder>('reminders');
export const useBabyCareStore = createCollectionStore<BabyCareRecord>('babyCare');
export const useActivityStore = createCollectionStore<ActivityRecord>('activities');
export const useMemoryStore = createCollectionStore<Memory>('memories');
export const useCaregiverStore = createCollectionStore<Caregiver>('caregivers');
export const useNoteStore = createCollectionStore<JournalNote>('notes');
export const useToothStore = createCollectionStore<ToothRecord>('teeth');

export const useFavoriteSoundsStore = createSingletonStore<string[]>('favoriteSounds', []);
export const useRecentSoundsStore = createSingletonStore<RecentSoundEntry[]>('recentSounds', []);
export const useSoundMixStore = createCollectionStore<SoundMix>('soundMixes');

export const useSavedGuidesStore = createSingletonStore<string[]>('savedGuides', []);
export const useRecentGuidesStore = createSingletonStore<RecentGuideEntry[]>('recentGuides', []);
