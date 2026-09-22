export type ID = string;

export type Gender = 'girl' | 'boy' | 'other' | 'unspecified';

export interface BabyProfile {
  id: ID;
  name: string;
  dateOfBirth: string; // ISO date
  birthTime?: string; // HH:mm
  gender: Gender;
  birthWeightKg?: number;
  birthHeightCm?: number;
  bloodType?: string;
  photoUri?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type FeedingType = 'breast' | 'bottle' | 'solid';
export type BreastSide = 'left' | 'right' | 'both';

export interface FeedingRecord {
  id: ID;
  type: FeedingType;
  startTime: string; // ISO datetime
  // breast
  side?: BreastSide;
  durationMin?: number;
  // bottle
  amountMl?: number;
  milkType?: string;
  // solid
  foodName?: string;
  amount?: string;
  reaction?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type DiaperType = 'wet' | 'dirty' | 'both';

export interface DiaperRecord {
  id: ID;
  type: DiaperType;
  time: string; // ISO datetime
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type SleepKind = 'nap' | 'night';

export interface SleepRecord {
  id: ID;
  kind: SleepKind;
  startTime: string; // ISO
  endTime?: string; // ISO, undefined = in progress
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type GrowthMetric = 'weight' | 'height' | 'headCircumference';

export interface GrowthRecord {
  id: ID;
  date: string; // ISO date
  weightKg?: number;
  heightCm?: number;
  headCircumferenceCm?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type MilestoneCategory =
  | 'motor'
  | 'communication'
  | 'social'
  | 'cognitive'
  | 'feeding'
  | 'sleep'
  | 'other';

export interface Milestone {
  id: ID;
  title: string;
  category: MilestoneCategory;
  completed: boolean;
  dateAchieved?: string; // ISO date
  notes?: string;
  photoUri?: string;
  isCustom: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Vaccination {
  id: ID;
  vaccineName: string;
  date: string; // ISO date
  doseNotes?: string;
  doseNumber?: string; // e.g. "Dose 1 of 3", "Booster"
  nextDueDate?: string;
  reminderEnabled?: boolean;
  notificationId?: string;
  createdAt: string;
  updatedAt: string;
}

export type HealthRecordType = 'doctorVisit' | 'symptom' | 'temperature' | 'medication' | 'other';

export interface HealthRecord {
  id: ID;
  type: HealthRecordType;
  date: string; // ISO datetime
  title: string;
  temperatureC?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Appointment {
  id: ID;
  title: string;
  doctorOrClinic?: string;
  date: string; // ISO date
  time?: string; // HH:mm
  notes?: string;
  reminderEnabled: boolean;
  completed: boolean;
  notificationId?: string;
  createdAt: string;
  updatedAt: string;
}

export type ReminderCategory =
  | 'feeding'
  | 'diaper'
  | 'sleep'
  | 'medication'
  | 'vaccination'
  | 'appointment'
  | 'custom';

export type ReminderRepeat = 'none' | 'daily' | 'weekly';

export interface Reminder {
  id: ID;
  title: string;
  category: ReminderCategory;
  dateTime: string; // ISO datetime
  repeat: ReminderRepeat;
  enabled: boolean;
  notificationId?: string;
  createdAt: string;
  updatedAt: string;
}

export type BabyCareActivity = 'bath' | 'nails' | 'hair' | 'oral' | 'skin' | 'other';

export interface BabyCareRecord {
  id: ID;
  activity: BabyCareActivity;
  customLabel?: string;
  dateTime: string; // ISO datetime
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type ActivityKind =
  | 'play'
  | 'tummyTime'
  | 'reading'
  | 'outdoor'
  | 'music'
  | 'sensory'
  | 'familyTime'
  | 'other';

export interface ActivityRecord {
  id: ID;
  kind: ActivityKind;
  customLabel?: string;
  dateTime: string; // ISO datetime
  durationMin?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Memory {
  id: ID;
  title: string;
  date: string; // ISO date
  caption?: string;
  photoUri?: string;
  createdAt: string;
  updatedAt: string;
}

export type CaregiverRelationship =
  | 'mother'
  | 'father'
  | 'grandparent'
  | 'caregiver'
  | 'other';

export interface Caregiver {
  id: ID;
  name: string;
  relationship: CaregiverRelationship;
  photoUri?: string;
  createdAt: string;
  updatedAt: string;
}

export type NoteCategory = 'general' | 'feeding' | 'sleep' | 'health' | 'milestone' | 'other';

export interface JournalNote {
  id: ID;
  title: string;
  body: string;
  date: string; // ISO date
  category: NoteCategory;
  createdAt: string;
  updatedAt: string;
}

export type WeightUnit = 'kg' | 'lb';
export type HeightUnit = 'cm' | 'in';

export interface AppSettings {
  weightUnit: WeightUnit;
  heightUnit: HeightUnit;
  notificationsEnabled: boolean;
  themeMode: 'light' | 'system';
  language: string;
  onboardingCompleted: boolean;
}

export interface RecentSoundEntry {
  soundId: ID;
  playedAt: string;
}

export interface SoundMix {
  id: ID;
  name: string;
  soundIds: string[];
  volumes: Record<string, number>; // soundId -> 0..1
  createdAt: string;
  updatedAt: string;
}

export interface RecentGuideEntry {
  guideId: ID;
  viewedAt: string;
}
