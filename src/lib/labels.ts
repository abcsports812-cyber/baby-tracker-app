import type {
  ActivityKind,
  BabyCareActivity,
  CaregiverRelationship,
  HealthRecordType,
  JournalCategory,
  MilestoneCategory,
  NoteCategory,
  ReminderCategory,
  TeethingSymptom,
  ToothStatus,
} from '../types/models';

export function activityLabel(kind: ActivityKind, custom?: string): string {
  if (kind === 'other') return custom?.trim() || 'Activity';
  const map: Record<Exclude<ActivityKind, 'other'>, string> = {
    play: 'Play time',
    tummyTime: 'Tummy time',
    reading: 'Reading',
    outdoor: 'Outdoor time',
    music: 'Music',
    sensory: 'Sensory play',
    familyTime: 'Family time',
  };
  return map[kind];
}

export function babyCareLabel(activity: BabyCareActivity, custom?: string): string {
  if (activity === 'other') return custom?.trim() || 'Baby care';
  const map: Record<Exclude<BabyCareActivity, 'other'>, string> = {
    bath: 'Bath time',
    nails: 'Nail trimming',
    hair: 'Hair care',
    oral: 'Oral care',
    skin: 'Skin care',
  };
  return map[activity];
}

export const milestoneCategoryLabel: Record<MilestoneCategory, string> = {
  motor: 'Motor skills',
  communication: 'Communication',
  social: 'Social',
  cognitive: 'Cognitive',
  feeding: 'Feeding',
  sleep: 'Sleep',
  other: 'Other',
};

export const healthRecordTypeLabel: Record<HealthRecordType, string> = {
  doctorVisit: 'Doctor visit',
  symptom: 'Symptom',
  temperature: 'Temperature',
  medication: 'Medication',
  other: 'Other',
};

export const reminderCategoryLabel: Record<ReminderCategory, string> = {
  feeding: 'Feeding',
  diaper: 'Diaper',
  sleep: 'Sleep',
  medication: 'Medication',
  vaccination: 'Vaccination',
  appointment: 'Appointment',
  custom: 'Custom',
};

export const caregiverRelationshipLabel: Record<CaregiverRelationship, string> = {
  mother: 'Mother',
  father: 'Father',
  grandparent: 'Grandparent',
  caregiver: 'Caregiver',
  other: 'Other',
};

export const journalCategoryLabel: Record<JournalCategory, string> = {
  everyday: 'Everyday',
  milestone: 'Milestone',
  first: 'First',
  health: 'Health',
  family: 'Family',
  specialDay: 'Special Day',
};

// Covers every NoteCategory value, including the legacy-only ones kept
// solely so an already-persisted note's category never renders blank.
export const noteCategoryLabel: Record<NoteCategory, string> = {
  ...journalCategoryLabel,
  general: 'General',
  feeding: 'Feeding',
  sleep: 'Sleep',
  other: 'Other',
};

export const toothStatusLabel: Record<ToothStatus, string> = {
  notErupted: 'Not erupted',
  emerging: 'Emerging',
  erupted: 'Erupted',
  lost: 'Lost',
};

export const teethingSymptomLabel: Record<TeethingSymptom, string> = {
  drooling: 'Drooling',
  fussiness: 'Fussiness',
  gumSwelling: 'Gum swelling',
  lowFever: 'Low fever',
  chewing: 'Chewing on things',
  disruptedSleep: 'Disrupted sleep',
  other: 'Other',
};
