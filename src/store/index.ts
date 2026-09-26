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

// Multiple Baby Profiles V1 — Phase 1 (data foundation only).
//
// useBabyProfileStore below is UNCHANGED and remains the live store every
// existing screen reads/writes until Phase 2 cuts them over. The new
// collection (useBabyProfilesStore) and the migration that populates it
// from this singleton are purely additive in Phase 1 — nothing existing
// screens do today changes behavior yet.
export const useBabyProfileStore = createSingletonStore<BabyProfile | null>('babyProfile', null);

// The multi-profile collection. Not yet read by any screen — Phase 2 wires
// screens to useActiveBabyProfile() (src/lib/babyScope.ts) instead of the
// singleton above.
export const useBabyProfilesStore = createCollectionStore<BabyProfile>('babyProfiles');

// Which baby is currently active. Changes whenever the user switches.
export const useActiveBabyIdStore = createSingletonStore<string | null>('activeBabyId', null);

// The id of the one baby that existed before Multiple Baby Profiles
// shipped (or, for a fresh install, the first baby ever created). Set
// once and never changed again — see src/lib/babyScope.ts, which uses it
// as the fallback owner for any pre-existing record with no babyId, so a
// later switch to a different active baby can never make those legacy
// records appear to belong to the wrong baby.
export const useLegacyDefaultBabyIdStore = createSingletonStore<string | null>('legacyDefaultBabyId', null);

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

// A recency cache, not user data — intentionally excluded from BackupStores,
// exactly like recentSounds/recentGuides above.
export const useRecentSearchesStore = createSingletonStore<string[]>('recentSearches', []);
