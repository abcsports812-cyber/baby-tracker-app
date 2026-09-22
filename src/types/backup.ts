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
  Reminder,
  SleepRecord,
  SoundMix,
  Vaccination,
} from './models';

export const BACKUP_FORMAT_VERSION = 1;

/** notificationId is an OS notification-scheduler handle, meaningless outside
 * the device that created it — never included in a backup, always
 * regenerated on restore. */
export type BackupVaccination = Omit<Vaccination, 'notificationId'>;
export type BackupAppointment = Omit<Appointment, 'notificationId'>;
export type BackupReminder = Omit<Reminder, 'notificationId'>;

export interface BackupStores {
  feeding: FeedingRecord[];
  diaper: DiaperRecord[];
  sleep: SleepRecord[];
  growth: GrowthRecord[];
  milestones: Milestone[];
  vaccinations: BackupVaccination[];
  healthRecords: HealthRecord[];
  appointments: BackupAppointment[];
  reminders: BackupReminder[];
  babyCare: BabyCareRecord[];
  activities: ActivityRecord[];
  memories: Memory[];
  caregivers: Caregiver[];
  notes: JournalNote[];
  soundMixes: SoundMix[];
  favoriteSounds: string[];
  savedGuides: string[];
}

/** Settings worth restoring. Deliberately excludes `onboardingCompleted`
 * (app-flow state, not user data — restoring a backup must never send a
 * user back through onboarding). */
export type BackupSettings = Omit<AppSettings, 'onboardingCompleted'>;

export interface BackupData {
  babyProfile: BabyProfile | null;
  settings: BackupSettings;
  stores: BackupStores;
}

export interface BackupFile {
  formatVersion: number;
  appVersion: string;
  exportedAt: string;
  platform: 'ios' | 'android' | 'web' | 'unknown';
  data: BackupData;
}
