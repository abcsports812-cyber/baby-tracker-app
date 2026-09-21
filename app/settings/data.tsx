import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { Screen } from '../../src/components/ui/Screen';
import { ModuleHeader } from '../../src/components/ui/ModuleHeader';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { ConfirmDialog } from '../../src/components/ui/ConfirmDialog';
import {
  useActivityStore,
  useAppointmentStore,
  useBabyCareStore,
  useCaregiverStore,
  useDiaperStore,
  useFeedingStore,
  useGrowthStore,
  useHealthRecordStore,
  useMemoryStore,
  useMilestoneStore,
  useNoteStore,
  useReminderStore,
  useSleepStore,
  useVaccinationStore,
} from '../../src/store';
import { cancelReminderNotification } from '../../src/lib/notifications';
import { showToast } from '../../src/components/ui/Toast';
import { fontSize, palette, spacing } from '../../src/theme';

export default function DataSettingsScreen() {
  const [confirmOpen, setConfirmOpen] = useState(false);

  const feeding = useFeedingStore();
  const diaper = useDiaperStore();
  const sleep = useSleepStore();
  const growth = useGrowthStore();
  const milestones = useMilestoneStore();
  const vaccinations = useVaccinationStore();
  const health = useHealthRecordStore();
  const appointments = useAppointmentStore();
  const reminders = useReminderStore();
  const babyCare = useBabyCareStore();
  const activities = useActivityStore();
  const memories = useMemoryStore();
  const caregivers = useCaregiverStore();
  const notes = useNoteStore();

  const totalRecords =
    feeding.items.length +
    diaper.items.length +
    sleep.items.length +
    growth.items.length +
    milestones.items.length +
    vaccinations.items.length +
    health.items.length +
    appointments.items.length +
    reminders.items.length +
    babyCare.items.length +
    activities.items.length +
    memories.items.length +
    caregivers.items.length +
    notes.items.length;

  const clearAll = async () => {
    for (const r of reminders.items) await cancelReminderNotification(r.notificationId);
    for (const a of appointments.items) await cancelReminderNotification(a.notificationId);

    feeding.setAll([]);
    diaper.setAll([]);
    sleep.setAll([]);
    growth.setAll([]);
    milestones.setAll([]);
    vaccinations.setAll([]);
    health.setAll([]);
    appointments.setAll([]);
    reminders.setAll([]);
    babyCare.setAll([]);
    activities.setAll([]);
    memories.setAll([]);
    caregivers.setAll([]);
    notes.setAll([]);

    setConfirmOpen(false);
    showToast('All tracking data cleared', 'trash');
  };

  return (
    <Screen>
      <ModuleHeader illustration="settings" title="Data" subtitle={`${totalRecords} total records stored on this device`} />

      <Card>
        <Text style={styles.body}>
          All your data is stored privately on this device — nothing is uploaded to the cloud. Clearing data removes every
          feeding, diaper, sleep, growth, milestone, health, appointment, reminder, baby care, activity, memory, note and
          caregiver record. Your baby’s profile and app settings are kept.
        </Text>
        <Button
          label="Clear all tracking data"
          variant="danger"
          icon="trash"
          onPress={() => setConfirmOpen(true)}
          style={{ marginTop: spacing.lg }}
        />
      </Card>

      <ConfirmDialog
        visible={confirmOpen}
        title="Clear all tracking data?"
        message="This permanently deletes all tracked records on this device. This cannot be undone."
        confirmLabel="Clear data"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={clearAll}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {
    fontSize: fontSize.sm,
    color: palette.textSecondary,
    lineHeight: 20,
  },
});
