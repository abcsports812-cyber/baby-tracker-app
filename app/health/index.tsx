import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../src/components/ui/Screen';
import { ModuleHeader } from '../../src/components/ui/ModuleHeader';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { FormSheet } from '../../src/components/ui/FormSheet';
import { FormField } from '../../src/components/ui/FormField';
import { ChipSelect } from '../../src/components/ui/ChipSelect';
import { DateTimeRow } from '../../src/components/ui/DateTimeRow';
import { DateTimeField } from '../../src/components/ui/DateTimeField';
import { RecordRow } from '../../src/components/ui/RecordRow';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { ConfirmDialog } from '../../src/components/ui/ConfirmDialog';
import { useHealthRecordStore, useVaccinationStore } from '../../src/store';
import { generateId, nowIso } from '../../src/lib/id';
import { daysBetween, formatDate, formatDateTime } from '../../src/lib/date';
import { healthRecordTypeLabel } from '../../src/lib/labels';
import { showToast } from '../../src/components/ui/Toast';
import { cancelReminderNotification, scheduleReminderNotification } from '../../src/lib/notifications';
import { categoryColors, fontSize, palette, radius, spacing } from '../../src/theme';
import type { HealthRecord, HealthRecordType, Vaccination } from '../../src/types/models';

const HEALTH_ICON: Record<HealthRecordType, keyof typeof Ionicons.glyphMap> = {
  doctorVisit: 'medical',
  symptom: 'thermometer',
  temperature: 'thermometer',
  medication: 'medkit',
  other: 'document-text',
};

type VaccinationStatus = 'due' | 'upcoming' | 'completed';

/** A next-due date within this many days counts as "Due Soon" rather than
 * "Upcoming". This is purely a display grouping of the parent's own
 * entered date — not a medical determination of when a vaccine is due. */
const DUE_SOON_WINDOW_DAYS = 30;

/** Reminder scheduling can involve a first-time browser/OS permission
 * prompt. If it's never answered, that must never block saving the
 * vaccination record itself — so we give it a bounded window and move on. */
const NOTIFICATION_TIMEOUT_MS = 4000;
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | undefined> {
  return Promise.race([promise, new Promise<undefined>((resolve) => setTimeout(() => resolve(undefined), ms))]);
}

/** Deterministic, date-safe status derived only from what the parent
 * entered. No stored status field: recomputing avoids the list ever
 * going stale relative to nextDueDate. */
function deriveVaccinationStatus(v: Vaccination): VaccinationStatus {
  if (!v.nextDueDate) return 'completed';
  const daysUntilDue = daysBetween(new Date(), v.nextDueDate);
  return daysUntilDue <= DUE_SOON_WINDOW_DAYS ? 'due' : 'upcoming';
}

const VAX_STATUS_META: Record<VaccinationStatus, { label: string; bg: string; text: string }> = {
  due: { label: 'Due Soon', bg: categoryColors.health.bg, text: categoryColors.health.text },
  upcoming: { label: 'Upcoming', bg: categoryColors.appointment.bg, text: categoryColors.appointment.text },
  completed: { label: 'Completed', bg: categoryColors.diaper.bg, text: categoryColors.diaper.text },
};

function VaxGroup({
  title,
  items,
  onEdit,
  onDelete,
}: {
  title: string;
  items: Vaccination[];
  onEdit: (v: Vaccination) => void;
  onDelete: (id: string) => void;
}) {
  if (items.length === 0) return null;
  return (
    <View style={{ marginBottom: spacing.lg }}>
      <Text style={styles.vaxGroupTitle}>{title}</Text>
      <Card padded={false}>
        {items.map((v, i) => (
          <VaxRow key={v.id} vax={v} isLast={i === items.length - 1} onPress={() => onEdit(v)} onDelete={() => onDelete(v.id)} />
        ))}
      </Card>
    </View>
  );
}

function VaxRow({ vax, isLast, onPress, onDelete }: { vax: Vaccination; isLast: boolean; onPress: () => void; onDelete: () => void }) {
  const status = deriveVaccinationStatus(vax);
  const meta = VAX_STATUS_META[status];
  const metaParts = [
    `Given ${formatDate(vax.date)}`,
    vax.nextDueDate ? `Next due ${formatDate(vax.nextDueDate)}` : null,
  ].filter(Boolean);

  return (
    <Pressable onPress={onPress} style={[styles.vaxRow, !isLast && styles.vaxRowBorder]}>
      <View style={styles.vaxIconWrap}>
        <Ionicons name="shield-checkmark" size={18} color={categoryColors.health.accent} />
      </View>
      <View style={styles.vaxMiddle}>
        <Text style={styles.vaxTitle} numberOfLines={1}>
          {vax.vaccineName}
          {vax.doseNumber ? ` · ${vax.doseNumber}` : ''}
        </Text>
        <Text style={styles.vaxMeta} numberOfLines={1}>
          {metaParts.join(' · ')}
        </Text>
      </View>
      <View style={[styles.statusPill, { backgroundColor: meta.bg }]}>
        <Text style={[styles.statusPillLabel, { color: meta.text }]}>{meta.label}</Text>
      </View>
      <Pressable onPress={onDelete} hitSlop={10} style={styles.vaxDeleteBtn}>
        <Ionicons name="trash-outline" size={16} color={palette.textFaint} />
      </Pressable>
    </Pressable>
  );
}

export default function HealthScreen() {
  const vaccinations = useVaccinationStore((s) => s.items);
  const addVax = useVaccinationStore((s) => s.add);
  const updateVax = useVaccinationStore((s) => s.update);
  const removeVax = useVaccinationStore((s) => s.remove);

  const records = useHealthRecordStore((s) => s.items);
  const addRecord = useHealthRecordStore((s) => s.add);
  const updateRecord = useHealthRecordStore((s) => s.update);
  const removeRecord = useHealthRecordStore((s) => s.remove);

  const [vaxSheet, setVaxSheet] = useState(false);
  const [vaxEditId, setVaxEditId] = useState<string | null>(null);
  const [vaxDeleteId, setVaxDeleteId] = useState<string | null>(null);
  const [vaxName, setVaxName] = useState('');
  const [vaxDate, setVaxDate] = useState(new Date());
  const [vaxDose, setVaxDose] = useState('');
  const [vaxDoseNumber, setVaxDoseNumber] = useState('');
  const [vaxNextDue, setVaxNextDue] = useState<Date | null>(null);
  const [vaxReminderEnabled, setVaxReminderEnabled] = useState(false);

  const [recordSheet, setRecordSheet] = useState(false);
  const [recordEditId, setRecordEditId] = useState<string | null>(null);
  const [recordDeleteId, setRecordDeleteId] = useState<string | null>(null);
  const [recordType, setRecordType] = useState<HealthRecordType>('doctorVisit');
  const [recordTitle, setRecordTitle] = useState('');
  const [recordDate, setRecordDate] = useState(new Date());
  const [recordTemp, setRecordTemp] = useState('');
  const [recordNotes, setRecordNotes] = useState('');

  const groupedVax = useMemo(() => {
    const due: Vaccination[] = [];
    const upcoming: Vaccination[] = [];
    const completed: Vaccination[] = [];
    for (const v of vaccinations) {
      const status = deriveVaccinationStatus(v);
      (status === 'due' ? due : status === 'upcoming' ? upcoming : completed).push(v);
    }
    due.sort((a, b) => (a.nextDueDate ?? '').localeCompare(b.nextDueDate ?? ''));
    upcoming.sort((a, b) => (a.nextDueDate ?? '').localeCompare(b.nextDueDate ?? ''));
    completed.sort((a, b) => b.date.localeCompare(a.date));
    return { due, upcoming, completed };
  }, [vaccinations]);
  const sortedRecords = useMemo(() => [...records].sort((a, b) => b.date.localeCompare(a.date)), [records]);

  const openAddVax = () => {
    setVaxEditId(null);
    setVaxName('');
    setVaxDate(new Date());
    setVaxDose('');
    setVaxDoseNumber('');
    setVaxNextDue(null);
    setVaxReminderEnabled(false);
    setVaxSheet(true);
  };

  const openEditVax = (v: Vaccination) => {
    setVaxEditId(v.id);
    setVaxName(v.vaccineName);
    setVaxDate(new Date(v.date));
    setVaxDose(v.doseNotes ?? '');
    setVaxDoseNumber(v.doseNumber ?? '');
    setVaxNextDue(v.nextDueDate ? new Date(v.nextDueDate) : null);
    setVaxReminderEnabled(v.reminderEnabled ?? false);
    setVaxSheet(true);
  };

  const saveVax = async () => {
    const now = nowIso();
    const existing = vaxEditId ? vaccinations.find((v) => v.id === vaxEditId) : undefined;

    // Notification scheduling is best-effort: a permission prompt hanging or a
    // platform without notification support must never block saving the
    // vaccination record itself, which is the data that actually matters.
    const shouldSchedule = vaxReminderEnabled && !!vaxNextDue;
    let notificationId: string | undefined;
    try {
      if (existing?.notificationId) await withTimeout(cancelReminderNotification(existing.notificationId), NOTIFICATION_TIMEOUT_MS);
      if (shouldSchedule && vaxNextDue) {
        notificationId = await withTimeout(
          scheduleReminderNotification({
            title: `Vaccination due: ${vaxName.trim() || 'Vaccine'}`,
            body: vaxDoseNumber.trim() || undefined,
            date: vaxNextDue,
          }),
          NOTIFICATION_TIMEOUT_MS
        );
      }
    } catch {
      // best-effort — proceed to save the record regardless
    }

    const payload = {
      vaccineName: vaxName.trim() || 'Vaccine',
      date: vaxDate.toISOString().slice(0, 10),
      doseNotes: vaxDose.trim() || undefined,
      doseNumber: vaxDoseNumber.trim() || undefined,
      nextDueDate: vaxNextDue ? vaxNextDue.toISOString().slice(0, 10) : undefined,
      reminderEnabled: shouldSchedule,
      notificationId,
    };
    if (vaxEditId) {
      updateVax(vaxEditId, { ...payload, updatedAt: now });
      showToast('Vaccination updated', 'checkmark-circle');
    } else {
      addVax({ id: generateId(), ...payload, createdAt: now, updatedAt: now });
      showToast('Vaccination saved', 'shield-checkmark');
    }
    setVaxSheet(false);
  };

  const openAddRecord = () => {
    setRecordEditId(null);
    setRecordType('doctorVisit');
    setRecordTitle('');
    setRecordDate(new Date());
    setRecordTemp('');
    setRecordNotes('');
    setRecordSheet(true);
  };

  const openEditRecord = (r: HealthRecord) => {
    setRecordEditId(r.id);
    setRecordType(r.type);
    setRecordTitle(r.title);
    setRecordDate(new Date(r.date));
    setRecordTemp(r.temperatureC?.toString() ?? '');
    setRecordNotes(r.notes ?? '');
    setRecordSheet(true);
  };

  const saveRecord = () => {
    const now = nowIso();
    const payload = {
      type: recordType,
      title: recordTitle.trim() || healthRecordTypeLabel[recordType],
      date: recordDate.toISOString(),
      temperatureC: recordType === 'temperature' && recordTemp ? Number(recordTemp) : undefined,
      notes: recordNotes.trim() || undefined,
    };
    if (recordEditId) {
      updateRecord(recordEditId, { ...payload, updatedAt: now });
      showToast('Health record updated', 'checkmark-circle');
    } else {
      addRecord({ id: generateId(), ...payload, createdAt: now, updatedAt: now });
      showToast('Health record saved', 'medkit');
    }
    setRecordSheet(false);
  };

  return (
    <Screen>
      <ModuleHeader illustration="health" title="Health" subtitle="Vaccinations & health records" />

      <View style={styles.disclaimer}>
        <Ionicons name="information-circle" size={16} color={palette.primaryPinkDark} />
        <Text style={styles.disclaimerText}>
          Baby Tracker is for personal record keeping and does not replace professional medical advice.
        </Text>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Vaccinations</Text>
        <Button label="Add" icon="add" size="sm" onPress={openAddVax} />
      </View>
      {vaccinations.length === 0 ? (
        <EmptyState illustration="health" title="No vaccinations recorded" message="Add your baby's vaccination history here." />
      ) : (
        <View style={{ marginBottom: spacing.xl }}>
          <VaxGroup title="Due Soon" items={groupedVax.due} onEdit={openEditVax} onDelete={setVaxDeleteId} />
          <VaxGroup title="Upcoming" items={groupedVax.upcoming} onEdit={openEditVax} onDelete={setVaxDeleteId} />
          <VaxGroup title="Completed" items={groupedVax.completed} onEdit={openEditVax} onDelete={setVaxDeleteId} />
        </View>
      )}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Health records</Text>
        <Button label="Add" icon="add" size="sm" onPress={openAddRecord} />
      </View>
      {sortedRecords.length === 0 ? (
        <EmptyState illustration="health" title="No health records yet" message="Log doctor visits, symptoms or medication here." />
      ) : (
        <Card>
          {sortedRecords.map((r) => (
            <RecordRow
              key={r.id}
              category="health"
              icon={HEALTH_ICON[r.type]}
              title={r.title}
              subtitle={r.temperatureC != null ? `${r.temperatureC}°C · ${r.notes ?? ''}` : r.notes}
              time={formatDateTime(r.date)}
              onPress={() => openEditRecord(r)}
              onDelete={() => setRecordDeleteId(r.id)}
            />
          ))}
        </Card>
      )}

      <FormSheet visible={vaxSheet} title={vaxEditId ? 'Edit vaccination' : 'Add vaccination'} onClose={() => setVaxSheet(false)} onSave={saveVax}>
        <FormField label="Vaccine name" value={vaxName} onChangeText={setVaxName} placeholder="e.g. DTaP" />
        <DateTimeField label="Date given" value={vaxDate} onChange={setVaxDate} mode="date" maximumDate={new Date()} />
        <FormField label="Dose number" value={vaxDoseNumber} onChangeText={setVaxDoseNumber} placeholder="e.g. Dose 1 of 3, Booster" optional />
        <FormField label="Notes" value={vaxDose} onChangeText={setVaxDose} optional />
        <DateTimeField label="Next due date" value={vaxNextDue ?? new Date()} onChange={setVaxNextDue} mode="date" />
        {vaxNextDue && (
          <Pressable style={styles.reminderToggle} onPress={() => setVaxReminderEnabled((v) => !v)}>
            <Ionicons name={vaxReminderEnabled ? 'notifications' : 'notifications-off'} size={18} color={palette.primaryPinkDark} />
            <Text style={styles.reminderLabel}>Remind me when due</Text>
          </Pressable>
        )}
      </FormSheet>

      <FormSheet visible={recordSheet} title={recordEditId ? 'Edit health record' : 'Add health record'} onClose={() => setRecordSheet(false)} onSave={saveRecord}>
        <ChipSelect
          label="Type"
          value={recordType}
          onChange={setRecordType}
          options={(Object.keys(healthRecordTypeLabel) as HealthRecordType[]).map((t) => ({ value: t, label: healthRecordTypeLabel[t] }))}
        />
        <FormField label="Title" value={recordTitle} onChangeText={setRecordTitle} placeholder="e.g. Pediatrician checkup" />
        <DateTimeRow value={recordDate} onChange={setRecordDate} maximumDate={new Date()} />
        {recordType === 'temperature' && (
          <FormField label="Temperature (°C)" value={recordTemp} onChangeText={setRecordTemp} keyboardType="decimal-pad" />
        )}
        <FormField label="Notes" value={recordNotes} onChangeText={setRecordNotes} multiline optional />
      </FormSheet>

      <ConfirmDialog
        visible={!!vaxDeleteId}
        title="Delete this vaccination?"
        onCancel={() => setVaxDeleteId(null)}
        onConfirm={async () => {
          if (vaxDeleteId) {
            const v = vaccinations.find((x) => x.id === vaxDeleteId);
            if (v?.notificationId) {
              try {
                await withTimeout(cancelReminderNotification(v.notificationId), NOTIFICATION_TIMEOUT_MS);
              } catch {
                // best-effort — proceed to delete the record regardless
              }
            }
            removeVax(vaxDeleteId);
          }
          setVaxDeleteId(null);
        }}
      />
      <ConfirmDialog
        visible={!!recordDeleteId}
        title="Delete this record?"
        onCancel={() => setRecordDeleteId(null)}
        onConfirm={() => {
          if (recordDeleteId) removeRecord(recordDeleteId);
          setRecordDeleteId(null);
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: palette.softPink,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  disclaimerText: {
    flex: 1,
    fontSize: fontSize.xs,
    color: palette.primaryPinkDark,
    lineHeight: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '800',
    color: palette.text,
  },
  vaxGroupTitle: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: palette.textSecondary,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  vaxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  vaxRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  vaxIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: categoryColors.health.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vaxMiddle: {
    flex: 1,
  },
  vaxTitle: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: palette.text,
  },
  vaxMeta: {
    fontSize: fontSize.xs,
    color: palette.textSecondary,
    marginTop: 1,
  },
  statusPill: {
    borderRadius: radius.pill,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
  },
  statusPillLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  vaxDeleteBtn: {
    padding: 4,
  },
  reminderToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: palette.white,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: palette.border,
  },
  reminderLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: palette.text,
  },
});
