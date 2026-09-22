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

export type FeedingType = 'breast' | 'bottle' | 'solid' | 'pump';
export type BreastSide = 'left' | 'right' | 'both';

export interface FeedingRecord {
  id: ID;
  type: FeedingType;
  startTime: string; // ISO datetime
  // breast; also reused by pump (side, durationMin)
  side?: BreastSide;
  durationMin?: number;
  // bottle; amountMl also reused by pump as total expressed volume (ml)
  amountMl?: number;
  milkType?: string;
  // solid
  foodName?: string;
  amount?: string;
  reaction?: string;
  // pump — optional per-side breakdown; when both are set, amountMl is their sum
  leftAmountMl?: number;
  rightAmountMl?: number;
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

/** Shared category vocabulary for the Journal (notes + memories) system. */
export type JournalCategory = 'everyday' | 'milestone' | 'first' | 'health' | 'family' | 'specialDay';

export interface Memory {
  id: ID;
  title: string;
  date: string; // ISO date
  caption?: string;
  photoUri?: string;
  category?: JournalCategory;
  favorite?: boolean;
  /** Optional cross-reference to an existing Milestone — never auto-created
   * or auto-derived, only set when the user explicitly links one. */
  relatedMilestoneId?: string;
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

// A superset of JournalCategory: 'general' | 'feeding' | 'sleep' | 'other' are
// kept only so any already-persisted note keeps rendering its category label
// correctly. New entries only offer JournalCategory's values going forward.
export type NoteCategory = 'general' | 'feeding' | 'sleep' | 'other' | JournalCategory;

export interface JournalNote {
  id: ID;
  title: string;
  body: string;
  date: string; // ISO date
  category: NoteCategory;
  favorite?: boolean;
  photoUri?: string;
  /** Optional cross-reference to an existing Milestone — never auto-created
   * or auto-derived, only set when the user explicitly links one. */
  relatedMilestoneId?: string;
  createdAt: string;
  updatedAt: string;
}

export type ToothPosition = 'upperLeft' | 'upperRight' | 'lowerLeft' | 'lowerRight';
export type ToothType = 'centralIncisor' | 'lateralIncisor' | 'canine' | 'firstMolar' | 'secondMolar';
export type ToothStatus = 'notErupted' | 'emerging' | 'erupted' | 'lost';
export type TeethingSymptom =
  | 'drooling'
  | 'fussiness'
  | 'gumSwelling'
  | 'lowFever'
  | 'chewing'
  | 'disruptedSleep'
  | 'other';

/** One record per tooth *slot* in the fixed 20-tooth primary dentition
 * chart (see src/lib/teeth.ts for the slot definitions). The store only
 * ever holds a record for a slot the parent has actually touched — a
 * slot with no record renders as its default `notErupted` state, so a
 * baby with no teeth yet never writes 20 near-empty rows. */
export interface ToothRecord {
  id: ID; // matches a TOOTH_CHART slot id, e.g. "upperLeft-centralIncisor"
  position: ToothPosition;
  type: ToothType;
  status: ToothStatus;
  eruptionDate?: string; // ISO date
  lossDate?: string; // ISO date
  symptoms?: TeethingSymptom[];
  notes?: string;
  photoUri?: string;
  /** Optional cross-reference to an existing Milestone — never auto-created
   * or auto-derived, only set when the user explicitly links one. */
  relatedMilestoneId?: string;
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
