import Constants from 'expo-constants';
import { Platform } from 'react-native';
import {
  useActiveBabyIdStore,
  useActivityStore,
  useAppointmentStore,
  useBabyCareStore,
  useBabyProfileStore,
  useBabyProfilesStore,
  useCaregiverStore,
  useDiaperStore,
  useFavoriteSoundsStore,
  useFeedingStore,
  useGrowthStore,
  useHealthRecordStore,
  useLegacyDefaultBabyIdStore,
  useMemoryStore,
  useMilestoneStore,
  useNoteStore,
  useReminderStore,
  useSavedGuidesStore,
  useSettingsStore,
  useSleepStore,
  useSoundMixStore,
  useToothStore,
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
    teeth: useToothStore.getState().items,
    // recentSounds / recentGuides are recency caches, intentionally excluded — see BackupStores.
  };

  return {
    formatVersion: BACKUP_FORMAT_VERSION,
    appVersion: Constants.expoConfig?.version ?? 'unknown',
    exportedAt: new Date().toISOString(),
    platform: currentPlatform(),
    data: {
      babyProfile: useBabyProfileStore.getState().value,
      babyProfiles: useBabyProfilesStore.getState().items,
      activeBabyId: useActiveBabyIdStore.getState().value,
      legacyDefaultBabyId: useLegacyDefaultBabyIdStore.getState().value,
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

/** Store keys added after the original backup format shipped. Unlike
 * STORE_ARRAY_KEYS, these are validated only when present — an older
 * backup file that predates the key entirely must still restore
 * successfully, with the key treated as an empty collection, never as
 * a validation failure. Any future new store should be added here
 * first, not to STORE_ARRAY_KEYS, to preserve backward compatibility. */
const OPTIONAL_STORE_ARRAY_KEYS: (keyof BackupStores)[] = ['teeth'];

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
    return { valid: false, error: "This file isn't a valid Zoni Baby backup." };
  }

  const { formatVersion, appVersion, exportedAt, data } = raw as Record<string, unknown>;

  if (typeof formatVersion !== 'number' || !Number.isInteger(formatVersion) || formatVersion < 1) {
    return { valid: false, error: "This file isn't a valid Zoni Baby backup." };
  }
  if (formatVersion > BACKUP_FORMAT_VERSION) {
    return { valid: false, error: 'This backup was created by a newer version of Zoni Baby.' };
  }

  if (typeof appVersion !== 'string' || !appVersion) {
    return { valid: false, error: "This file isn't a valid Zoni Baby backup." };
  }

  if (typeof exportedAt !== 'string' || Number.isNaN(new Date(exportedAt).getTime())) {
    return { valid: false, error: "This file isn't a valid Zoni Baby backup." };
  }

  if (!isPlainObject(data)) {
    return { valid: false, error: "This file isn't a valid Zoni Baby backup." };
  }

  const { babyProfile, babyProfiles, activeBabyId, legacyDefaultBabyId, settings, stores } = data as Record<string, unknown>;

  if (babyProfile !== null && !isPlainObject(babyProfile)) {
    return { valid: false, error: 'This backup file is corrupted (invalid baby profile).' };
  }
  if (babyProfile && (typeof babyProfile.id !== 'string' || typeof babyProfile.name !== 'string' || typeof babyProfile.dateOfBirth !== 'string')) {
    return { valid: false, error: 'This backup file is corrupted (invalid baby profile).' };
  }

  // V2 (Phase 3G): `babyProfiles` is present only on a multi-baby-aware
  // backup — a V1 file simply doesn't have the key at all, and that absence
  // is exactly what routes restore.ts to the V1 single-baby compatibility
  // path instead. Nothing here is required, or even inspected, for a V1 file.
  if (babyProfiles !== undefined) {
    if (!Array.isArray(babyProfiles)) {
      return { valid: false, error: 'This backup file is corrupted (invalid baby profiles).' };
    }
    const ids = new Set<string>();
    for (const entry of babyProfiles) {
      if (!isPlainObject(entry) || typeof entry.id !== 'string' || typeof entry.name !== 'string' || typeof entry.dateOfBirth !== 'string') {
        return { valid: false, error: 'This backup file is corrupted (invalid baby profiles).' };
      }
      if (ids.has(entry.id)) {
        return { valid: false, error: 'This backup file is corrupted (duplicate baby profile).' };
      }
      ids.add(entry.id);
    }
    if (activeBabyId !== null && (typeof activeBabyId !== 'string' || !ids.has(activeBabyId))) {
      return { valid: false, error: 'This backup file is corrupted (invalid active baby).' };
    }
    if (legacyDefaultBabyId !== null && (typeof legacyDefaultBabyId !== 'string' || !ids.has(legacyDefaultBabyId))) {
      return { valid: false, error: 'This backup file is corrupted (invalid default baby).' };
    }
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
      } else if (entry.babyId !== undefined && typeof entry.babyId !== 'string') {
        // A record's babyId is optional (legacy/undefined is always valid),
        // but when present it must be a string — never silently coerced or
        // stripped, since that's exactly what Section 3G's compatibility
        // rules forbid.
        return { valid: false, error: `This backup file is corrupted (invalid ${key} data).` };
      }
    }
  }

  // A backup made before a given optional key existed simply won't have
  // it at all — that must be accepted, not rejected. Only reject when the
  // key is present but shaped wrong.
  for (const key of OPTIONAL_STORE_ARRAY_KEYS) {
    const value = (stores as Record<string, unknown>)[key];
    if (value === undefined) continue;
    if (
      !Array.isArray(value) ||
      value.some(
        (entry) =>
          !isPlainObject(entry) ||
          typeof entry.id !== 'string' ||
          (entry.babyId !== undefined && typeof entry.babyId !== 'string')
      )
    ) {
      return { valid: false, error: `This backup file is corrupted (invalid ${key} data).` };
    }
  }

  return {
    valid: true,
    backup: raw as unknown as BackupFile,
  };
}

export interface BackupSummary {
  /** V1-shaped convenience field — the primary/active baby's name, or null.
   * Always populated; for a V2 backup with 2+ babies, prefer babyCount/
   * babyNames for display and treat this as a fallback label only. */
  babyName: string | null;
  /** Number of baby profiles this backup contains. 0 or 1 for a V1 backup
   * (mirrors babyName), the real count for a V2 backup. */
  babyCount: number;
  /** Every baby profile's name in this backup, in the backup's own order. */
  babyNames: string[];
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
    teeth: number;
  };
}

/** Summarizes a validated backup for the restore-preview screen — counts
 * and headline info only, no mutation, safe to call before any
 * confirmation. */
export function getBackupSummary(backup: BackupFile): BackupSummary {
  const s = backup.data.stores;
  // V1 backups have no babyProfiles array at all — fall back to the single
  // babyProfile field so a V1 file still summarizes as exactly one baby.
  const profiles = backup.data.babyProfiles ?? (backup.data.babyProfile ? [backup.data.babyProfile] : []);
  return {
    babyName: backup.data.babyProfile?.name ?? null,
    babyCount: profiles.length,
    babyNames: profiles.map((p) => p.name),
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
      // Absent on a pre-Teeth-Tracker backup — treated as zero, not an error.
      teeth: (s.teeth ?? []).length,
    },
  };
}
