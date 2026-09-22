import Constants from 'expo-constants';
import { Platform } from 'react-native';
import {
  useActivityStore,
  useAppointmentStore,
  useBabyCareStore,
  useBabyProfileStore,
  useCaregiverStore,
  useDiaperStore,
  useFavoriteSoundsStore,
  useFeedingStore,
  useGrowthStore,
  useHealthRecordStore,
  useMemoryStore,
  useMilestoneStore,
  useNoteStore,
  useReminderStore,
  useSavedGuidesStore,
  useSettingsStore,
  useSleepStore,
  useSoundMixStore,
  useVaccinationStore,
} from '../store';
import { BACKUP_FORMAT_VERSION, type BackupFile, type BackupStores } from '../types/backup';

/** Pure, platform-independent backup construction and validation. No UI,
 * no file/share APIs — see `fileExport.ts` for the platform-specific glue
 * that turns a BackupFile into an actual shared/downloaded file. */

function currentPlatform(): BackupFile['platform'] {
  if (Platform.OS === 'ios' || Platform.OS === 'android' || Platform.OS === 'web') return Platform.OS;
  return 'unknown';
}

export function buildBackup(): BackupFile {
  const { weightUnit, heightUnit, notificationsEnabled, themeMode, language } = useSettingsStore.getState().value;

  const stores: BackupStores = {
    feeding: useFeedingStore.getState().items,
    diaper: useDiaperStore.getState().items,
    sleep: useSleepStore.getState().items,
    growth: useGrowthStore.getState().items,
    milestones: useMilestoneStore.getState().items,
    // notificationId is an OS-scheduler handle, not portable across devices/reinstalls — stripped here.
    vaccinations: useVaccinationStore.getState().items.map(({ notificationId: _notificationId, ...rest }) => rest),
    healthRecords: useHealthRecordStore.getState().items,
    appointments: useAppointmentStore.getState().items.map(({ notificationId: _notificationId, ...rest }) => rest),
    reminders: useReminderStore.getState().items.map(({ notificationId: _notificationId, ...rest }) => rest),
    babyCare: useBabyCareStore.getState().items,
    activities: useActivityStore.getState().items,
    memories: useMemoryStore.getState().items,
    caregivers: useCaregiverStore.getState().items,
    notes: useNoteStore.getState().items,
    soundMixes: useSoundMixStore.getState().items,
    favoriteSounds: useFavoriteSoundsStore.getState().value,
    savedGuides: useSavedGuidesStore.getState().value,
    // recentSounds / recentGuides are recency caches, intentionally excluded — see BackupStores.
  };

  return {
    formatVersion: BACKUP_FORMAT_VERSION,
    appVersion: Constants.expoConfig?.version ?? 'unknown',
    exportedAt: new Date().toISOString(),
    platform: currentPlatform(),
    data: {
      babyProfile: useBabyProfileStore.getState().value,
      settings: { weightUnit, heightUnit, notificationsEnabled, themeMode, language },
      stores,
    },
  };
}

export function serializeBackup(backup: BackupFile): string {
  return JSON.stringify(backup, null, 2);
}

export interface BackupValidationResult {
  valid: boolean;
  backup?: BackupFile;
  error?: string;
}

const WEIGHT_UNITS = ['kg', 'lb'];
const HEIGHT_UNITS = ['cm', 'in'];
const THEME_MODES = ['light', 'system'];

const STORE_ARRAY_KEYS: (keyof BackupStores)[] = [
  'feeding',
  'diaper',
  'sleep',
  'growth',
  'milestones',
  'vaccinations',
  'healthRecords',
  'appointments',
  'reminders',
  'babyCare',
  'activities',
  'memories',
  'caregivers',
  'notes',
  'soundMixes',
  'favoriteSounds',
  'savedGuides',
];

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Validates the backup envelope and every store's shape. Deliberately
 * lightweight on individual record fields beyond requiring each array
 * element to be a plain object with a string `id` — a full per-field
 * schema check for every one of the ~16 record types would be a large,
 * separate undertaking, and isn't needed to safely reject a corrupted,
 * foreign, or version-incompatible file, which is this function's job. */
export function validateBackup(raw: unknown): BackupValidationResult {
  if (!isPlainObject(raw)) {
    return { valid: false, error: "This file isn't a valid Baby Tracker backup." };
  }

  const { formatVersion, appVersion, exportedAt, data } = raw as Record<string, unknown>;

  if (typeof formatVersion !== 'number' || !Number.isInteger(formatVersion) || formatVersion < 1) {
    return { valid: false, error: "This file isn't a valid Baby Tracker backup." };
  }
  if (formatVersion > BACKUP_FORMAT_VERSION) {
    return { valid: false, error: 'This backup was created by a newer version of Baby Tracker.' };
  }

  if (typeof appVersion !== 'string' || !appVersion) {
    return { valid: false, error: "This file isn't a valid Baby Tracker backup." };
  }

  if (typeof exportedAt !== 'string' || Number.isNaN(new Date(exportedAt).getTime())) {
    return { valid: false, error: "This file isn't a valid Baby Tracker backup." };
  }

  if (!isPlainObject(data)) {
    return { valid: false, error: "This file isn't a valid Baby Tracker backup." };
  }

  const { babyProfile, settings, stores } = data as Record<string, unknown>;

  if (babyProfile !== null && !isPlainObject(babyProfile)) {
    return { valid: false, error: 'This backup file is corrupted (invalid baby profile).' };
  }
  if (babyProfile && (typeof babyProfile.id !== 'string' || typeof babyProfile.name !== 'string' || typeof babyProfile.dateOfBirth !== 'string')) {
    return { valid: false, error: 'This backup file is corrupted (invalid baby profile).' };
  }

  if (!isPlainObject(settings)) {
    return { valid: false, error: 'This backup file is corrupted (invalid settings).' };
  }
  if (!WEIGHT_UNITS.includes(settings.weightUnit as string) || !HEIGHT_UNITS.includes(settings.heightUnit as string)) {
    return { valid: false, error: 'This backup file is corrupted (invalid settings).' };
  }
  if (typeof settings.notificationsEnabled !== 'boolean') {
    return { valid: false, error: 'This backup file is corrupted (invalid settings).' };
  }
  if (!THEME_MODES.includes(settings.themeMode as string) || typeof settings.language !== 'string') {
    return { valid: false, error: 'This backup file is corrupted (invalid settings).' };
  }

  if (!isPlainObject(stores)) {
    return { valid: false, error: 'This backup file is corrupted (missing tracked data).' };
  }

  for (const key of STORE_ARRAY_KEYS) {
    const value = (stores as Record<string, unknown>)[key];
    if (!Array.isArray(value)) {
      return { valid: false, error: `This backup file is corrupted (invalid ${key} data).` };
    }
    const isIdArray = key === 'favoriteSounds' || key === 'savedGuides';
    for (const entry of value) {
      if (isIdArray) {
        if (typeof entry !== 'string') {
          return { valid: false, error: `This backup file is corrupted (invalid ${key} data).` };
        }
      } else if (!isPlainObject(entry) || typeof entry.id !== 'string') {
        return { valid: false, error: `This backup file is corrupted (invalid ${key} data).` };
      }
    }
  }

  return {
    valid: true,
    backup: raw as unknown as BackupFile,
  };
}

export interface BackupSummary {
  babyName: string | null;
  exportedAt: string;
  appVersion: string;
  counts: {
    feeding: number;
    diaper: number;
    sleep: number;
    growth: number;
    milestones: number;
    vaccinations: number;
    healthRecords: number;
    appointments: number;
    reminders: number;
    babyCare: number;
    activities: number;
    memories: number;
    caregivers: number;
    notes: number;
    soundMixes: number;
  };
}

/** Summarizes a validated backup for the restore-preview screen — counts
 * and headline info only, no mutation, safe to call before any
 * confirmation. */
export function getBackupSummary(backup: BackupFile): BackupSummary {
  const s = backup.data.stores;
  return {
    babyName: backup.data.babyProfile?.name ?? null,
    exportedAt: backup.exportedAt,
    appVersion: backup.appVersion,
    counts: {
      feeding: s.feeding.length,
      diaper: s.diaper.length,
      sleep: s.sleep.length,
      growth: s.growth.length,
      milestones: s.milestones.length,
      vaccinations: s.vaccinations.length,
      healthRecords: s.healthRecords.length,
      appointments: s.appointments.length,
      reminders: s.reminders.length,
      babyCare: s.babyCare.length,
      activities: s.activities.length,
      memories: s.memories.length,
      caregivers: s.caregivers.length,
      notes: s.notes.length,
      soundMixes: s.soundMixes.length,
    },
  };
}
