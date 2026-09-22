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
  useToothStore,
  useVaccinationStore,
} from '../store';
import { cancelReminderNotification, scheduleReminderNotification } from './notifications';
import { reminderCategoryLabel } from './labels';
import type { BackupFile } from '../types/backup';
import { generateId, nowIso } from './id';

/** Restore logic only — assumes `backup` has already passed
 * `validateBackup()`. Kept separate from file/picker handling (see
 * `fileExport.ts`) and from validation (see `backup.ts`) so each concern
 * stays independently reviewable. */

/** A first-time OS notification-permission prompt can hang indefinitely in
 * some environments (the same issue already worked around locally in the
 * Health screen). Restore can schedule several notifications in a row, so
 * every scheduling call here is bounded the same way — never blocking the
 * restore itself. */
const NOTIFICATION_TIMEOUT_MS = 4000;
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | undefined> {
  return Promise.race([promise, new Promise<undefined>((resolve) => setTimeout(() => resolve(undefined), ms))]);
}

/** Replaces all local data with the contents of a validated backup.
 *
 * Sequence: cancel every notification tied to the *current* (about-to-be-
 * discarded) dataset first, since their ids only exist on the current
 * store items and would otherwise be unreachable the moment the stores are
 * replaced — then replace every store atomically (no store is left
 * un-replaced), then schedule fresh notifications for the restored records
 * that call for one, using the existing notification utility exactly as
 * Health/Appointments/Reminders already do. Never writes a backup's
 * (already-stripped) notificationId back — every restored notification id
 * is newly issued by this device.
 */
export async function applyBackup(backup: BackupFile): Promise<void> {
  const { data } = backup;

  // 1. Cancel notifications belonging to the current, about-to-be-replaced dataset.
  const currentVax = useVaccinationStore.getState().items;
  const currentAppointments = useAppointmentStore.getState().items;
  const currentReminders = useReminderStore.getState().items;
  await Promise.all([
    ...currentVax.map((v) => withTimeout(cancelReminderNotification(v.notificationId), NOTIFICATION_TIMEOUT_MS)),
    ...currentAppointments.map((a) => withTimeout(cancelReminderNotification(a.notificationId), NOTIFICATION_TIMEOUT_MS)),
    ...currentReminders.map((r) => withTimeout(cancelReminderNotification(r.notificationId), NOTIFICATION_TIMEOUT_MS)),
  ]);

  // 2. Replace every store. Each restored record is given a fresh local id
  // when it doesn't already carry a valid string id, so a hand-edited or
  // unusually-shaped (but structurally valid) backup can't collide ids.
  const now = nowIso();
  const withId = <T extends { id?: unknown }>(item: T): T & { id: string } => ({
    ...item,
    id: typeof item.id === 'string' && item.id ? item.id : generateId(),
  });

  useBabyProfileStore.getState().set(data.babyProfile);
  useSettingsStore.getState().patch({
    weightUnit: data.settings.weightUnit,
    heightUnit: data.settings.heightUnit,
    notificationsEnabled: data.settings.notificationsEnabled,
    themeMode: data.settings.themeMode,
    language: data.settings.language,
    // onboardingCompleted is deliberately left untouched — restoring data
    // must never send an already-onboarded user back through onboarding.
  });

  useFeedingStore.getState().setAll(data.stores.feeding.map(withId));
  useDiaperStore.getState().setAll(data.stores.diaper.map(withId));
  useSleepStore.getState().setAll(data.stores.sleep.map(withId));
  useGrowthStore.getState().setAll(data.stores.growth.map(withId));
  useMilestoneStore.getState().setAll(data.stores.milestones.map(withId));
  useHealthRecordStore.getState().setAll(data.stores.healthRecords.map(withId));
  useBabyCareStore.getState().setAll(data.stores.babyCare.map(withId));
  useActivityStore.getState().setAll(data.stores.activities.map(withId));
  useMemoryStore.getState().setAll(data.stores.memories.map(withId));
  useCaregiverStore.getState().setAll(data.stores.caregivers.map(withId));
  useNoteStore.getState().setAll(data.stores.notes.map(withId));
  useSoundMixStore.getState().setAll(data.stores.soundMixes.map(withId));
  useFavoriteSoundsStore.getState().set(data.stores.favoriteSounds);
  useSavedGuidesStore.getState().set(data.stores.savedGuides);
  // Absent on a pre-Teeth-Tracker backup — restores as an empty collection.
  useToothStore.getState().setAll((data.stores.teeth ?? []).map(withId));

  // Vaccinations/Appointments/Reminders are restored without a
  // notificationId first (never carry the backup's stripped/absent one),
  // then patched below once a fresh notification has actually been scheduled.
  useVaccinationStore.getState().setAll(data.stores.vaccinations.map((v) => ({ ...withId(v), notificationId: undefined })));
  useAppointmentStore.getState().setAll(data.stores.appointments.map((a) => ({ ...withId(a), notificationId: undefined })));
  useReminderStore.getState().setAll(data.stores.reminders.map((r) => ({ ...withId(r), notificationId: undefined })));

  // 3. Regenerate notifications for restored records that call for one,
  // reusing the exact scheduling function Health/Appointments/Reminders
  // already use, and store each freshly-issued id back onto its record.
  const restoredVax = useVaccinationStore.getState().items;
  for (const v of restoredVax) {
    if (!v.reminderEnabled || !v.nextDueDate) continue;
    const notificationId = await withTimeout(
      scheduleReminderNotification({ title: `Vaccination due: ${v.vaccineName}`, body: v.doseNumber || undefined, date: new Date(v.nextDueDate) }),
      NOTIFICATION_TIMEOUT_MS
    );
    if (notificationId) useVaccinationStore.getState().update(v.id, { notificationId, updatedAt: now });
  }

  const restoredAppointments = useAppointmentStore.getState().items;
  for (const a of restoredAppointments) {
    if (!a.reminderEnabled || a.completed) continue;
    const notificationId = await withTimeout(
      scheduleReminderNotification({ title: `Appointment: ${a.title}`, body: a.doctorOrClinic || undefined, date: new Date(`${a.date}T${a.time ?? '09:00'}`) }),
      NOTIFICATION_TIMEOUT_MS
    );
    if (notificationId) useAppointmentStore.getState().update(a.id, { notificationId, updatedAt: now });
  }

  const restoredReminders = useReminderStore.getState().items;
  for (const r of restoredReminders) {
    if (!r.enabled) continue;
    const notificationId = await withTimeout(
      scheduleReminderNotification({ title: r.title, body: reminderCategoryLabel[r.category], date: new Date(r.dateTime), repeat: r.repeat }),
      NOTIFICATION_TIMEOUT_MS
    );
    if (notificationId) useReminderStore.getState().update(r.id, { notificationId, updatedAt: now });
  }
}
