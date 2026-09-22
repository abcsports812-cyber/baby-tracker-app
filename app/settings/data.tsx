import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
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
import { buildBackup, getBackupSummary, serializeBackup, validateBackup, type BackupSummary } from '../../src/lib/backup';
import { applyBackup } from '../../src/lib/restore';
import { exportBackupFile, importBackupFile } from '../../src/lib/fileExport';
import { formatDateTime } from '../../src/lib/date';
import { fontSize, palette, radius, spacing } from '../../src/theme';
import type { BackupFile } from '../../src/types/backup';

const SUMMARY_ROWS: { key: keyof BackupSummary['counts']; label: string }[] = [
  { key: 'feeding', label: 'Feedings' },
  { key: 'diaper', label: 'Diapers' },
  { key: 'sleep', label: 'Sleep records' },
  { key: 'growth', label: 'Growth measurements' },
  { key: 'milestones', label: 'Milestones' },
  { key: 'vaccinations', label: 'Vaccinations' },
  { key: 'healthRecords', label: 'Health records' },
  { key: 'appointments', label: 'Appointments' },
  { key: 'reminders', label: 'Reminders' },
  { key: 'babyCare', label: 'Baby care entries' },
  { key: 'activities', label: 'Activities' },
  { key: 'memories', label: 'Memories' },
  { key: 'caregivers', label: 'Family & caregivers' },
  { key: 'notes', label: 'Notes' },
  { key: 'soundMixes', label: 'Sound mixes' },
];

function RestorePreviewModal({
  summary,
  restoring,
  onCancel,
  onConfirm,
}: {
  summary: BackupSummary | null;
  restoring: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal visible={!!summary} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.previewCard}>
          <Text style={styles.previewTitle}>Restore this backup?</Text>

          {summary && (
            <>
              <View style={styles.previewMetaRow}>
                <Text style={styles.previewMetaLabel}>Baby</Text>
                <Text style={styles.previewMetaValue}>{summary.babyName ?? 'Not set'}</Text>
              </View>
              <View style={styles.previewMetaRow}>
                <Text style={styles.previewMetaLabel}>Backup date</Text>
                <Text style={styles.previewMetaValue}>{formatDateTime(summary.exportedAt)}</Text>
              </View>
              <View style={styles.previewMetaRow}>
                <Text style={styles.previewMetaLabel}>App version</Text>
                <Text style={styles.previewMetaValue}>{summary.appVersion}</Text>
              </View>

              <View style={styles.previewDivider} />

              {SUMMARY_ROWS.map(({ key, label }) => (
                <View key={key} style={styles.previewCountRow}>
                  <Text style={styles.previewCountLabel}>{label}</Text>
                  <Text style={styles.previewCountValue}>{summary.counts[key]}</Text>
                </View>
              ))}

              <View style={styles.previewDivider} />

              <Text style={styles.previewWarning}>Restoring will replace the data currently on this device.</Text>
              <Text style={styles.previewWarningBold}>This cannot be undone.</Text>
            </>
          )}

          <View style={styles.previewButtonRow}>
            <Button label="Cancel" variant="secondary" onPress={onCancel} disabled={restoring} style={{ flex: 1 }} />
            <Button label="Restore Backup" variant="danger" onPress={onConfirm} loading={restoring} style={{ flex: 1 }} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function DataSettingsScreen() {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [pendingRestore, setPendingRestore] = useState<{ backup: BackupFile; summary: BackupSummary } | null>(null);

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

  const handleExport = async () => {
    setExporting(true);
    try {
      const backup = buildBackup();
      const json = serializeBackup(backup);
      const result = await exportBackupFile(json);
      if (result.success) {
        showToast('Backup exported successfully.', 'checkmark-circle');
      } else {
        showToast(result.error ?? "Couldn't export your backup. Please try again.", 'alert-circle-outline');
      }
    } catch {
      showToast("Couldn't export your backup. Please try again.", 'alert-circle-outline');
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async () => {
    setImporting(true);
    try {
      const picked = await importBackupFile();
      if (picked.canceled) return;
      if (picked.error || !picked.content) {
        showToast(picked.error ?? "Couldn't read that file. Please try again.", 'alert-circle-outline');
        return;
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(picked.content);
      } catch {
        showToast("This file isn't a valid Baby Tracker backup.", 'alert-circle-outline');
        return;
      }

      const validation = validateBackup(parsed);
      if (!validation.valid || !validation.backup) {
        showToast(validation.error ?? "This file isn't a valid Baby Tracker backup.", 'alert-circle-outline');
        return;
      }

      // Validated only — nothing is restored until the user explicitly
      // confirms in the preview modal below.
      setPendingRestore({ backup: validation.backup, summary: getBackupSummary(validation.backup) });
    } finally {
      setImporting(false);
    }
  };

  const handleRestoreConfirm = async () => {
    if (!pendingRestore) return;
    setRestoring(true);
    try {
      await applyBackup(pendingRestore.backup);
      showToast('Backup restored successfully.', 'checkmark-circle');
      setPendingRestore(null);
    } catch {
      showToast("Couldn't restore this backup. Please try again.", 'alert-circle-outline');
    } finally {
      setRestoring(false);
    }
  };

  return (
    <Screen>
      <ModuleHeader illustration="settings" title="Data" subtitle={`${totalRecords} total records stored on this device`} />

      <Text style={styles.sectionTitle}>Data & Backup</Text>

      <Card style={{ marginBottom: spacing.md }}>
        <View style={styles.rowHeader}>
          <View style={styles.iconWrap}>
            <Ionicons name="cloud-upload-outline" size={20} color={palette.primaryPinkDark} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Export Backup</Text>
            <Text style={styles.cardBody}>Save a copy of your tracked data and settings so you can restore it later.</Text>
          </View>
        </View>
        <Button label="Export" icon="download-outline" onPress={handleExport} loading={exporting} style={{ marginTop: spacing.md }} />
      </Card>

      <Card style={{ marginBottom: spacing.lg }}>
        <View style={styles.rowHeader}>
          <View style={styles.iconWrap}>
            <Ionicons name="cloud-download-outline" size={20} color={palette.primaryPinkDark} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Import / Restore</Text>
            <Text style={styles.cardBody}>Restore your Baby Tracker data from a previous backup file.</Text>
          </View>
        </View>
        <Button label="Import" icon="folder-open-outline" variant="secondary" onPress={handleImport} loading={importing} style={{ marginTop: spacing.md }} />
      </Card>

      <View style={styles.privacyNote}>
        <Ionicons name="information-circle-outline" size={16} color={palette.primaryPinkDark} />
        <Text style={styles.privacyNoteText}>
          Backup files contain personal baby and health data. Photos are not included.
        </Text>
      </View>

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

      <RestorePreviewModal
        summary={pendingRestore?.summary ?? null}
        restoring={restoring}
        onCancel={() => setPendingRestore(null)}
        onConfirm={handleRestoreConfirm}
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
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '800',
    color: palette.text,
    marginBottom: spacing.md,
  },
  rowHeader: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: palette.softPink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: palette.text,
  },
  cardBody: {
    fontSize: fontSize.sm,
    color: palette.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: palette.softPink,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  privacyNoteText: {
    flex: 1,
    fontSize: fontSize.xs,
    color: palette.primaryPinkDark,
    lineHeight: 16,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(91,82,96,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  previewCard: {
    backgroundColor: palette.white,
    borderRadius: radius.lg,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 400,
    maxHeight: '85%',
  },
  previewTitle: {
    fontSize: fontSize.lg,
    fontWeight: '800',
    color: palette.text,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  previewMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  previewMetaLabel: {
    fontSize: fontSize.sm,
    color: palette.textSecondary,
  },
  previewMetaValue: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: palette.text,
  },
  previewDivider: {
    height: 1,
    backgroundColor: palette.border,
    marginVertical: spacing.md,
  },
  previewCountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  previewCountLabel: {
    fontSize: fontSize.sm,
    color: palette.textSecondary,
  },
  previewCountValue: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: palette.text,
  },
  previewWarning: {
    fontSize: fontSize.sm,
    color: palette.text,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  previewWarningBold: {
    fontSize: fontSize.sm,
    fontWeight: '800',
    color: palette.danger,
    textAlign: 'center',
    marginTop: 2,
  },
  previewButtonRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
});
