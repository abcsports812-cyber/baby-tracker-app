import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../src/components/ui/Screen';
import { ModuleHeader } from '../../src/components/ui/ModuleHeader';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { FormSheet } from '../../src/components/ui/FormSheet';
import { FormField } from '../../src/components/ui/FormField';
import { DateTimeRow } from '../../src/components/ui/DateTimeRow';
import { RecordRow } from '../../src/components/ui/RecordRow';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { ConfirmDialog } from '../../src/components/ui/ConfirmDialog';
import { useAppointmentStore } from '../../src/store';
import { useAutoOpenAdd } from '../../src/hooks/useAutoOpenAdd';
import { generateId, nowIso } from '../../src/lib/id';
import { formatDateTime } from '../../src/lib/date';
import { showToast } from '../../src/components/ui/Toast';
import { cancelReminderNotification, scheduleReminderNotification } from '../../src/lib/notifications';
import { fontSize, palette, radius, spacing } from '../../src/theme';
import type { Appointment } from '../../src/types/models';

export default function AppointmentsScreen() {
  const items = useAppointmentStore((s) => s.items);
  const add = useAppointmentStore((s) => s.add);
  const update = useAppointmentStore((s) => s.update);
  const remove = useAppointmentStore((s) => s.remove);

  const [sheetOpen, setSheetOpen] = useAutoOpenAdd();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [doctor, setDoctor] = useState('');
  const [when, setWhen] = useState(new Date());
  const [notes, setNotes] = useState('');
  const [reminderEnabled, setReminderEnabled] = useState(true);

  const upcoming = useMemo(
    () => items.filter((a) => !a.completed && new Date(a.date + 'T' + (a.time ?? '00:00')) >= new Date()).sort((a, b) => a.date.localeCompare(b.date)),
    [items]
  );
  const past = useMemo(
    () => items.filter((a) => a.completed || new Date(a.date + 'T' + (a.time ?? '00:00')) < new Date()).sort((a, b) => b.date.localeCompare(a.date)),
    [items]
  );

  const openAdd = () => {
    setEditingId(null);
    setTitle('');
    setDoctor('');
    setWhen(new Date());
    setNotes('');
    setReminderEnabled(true);
    setSheetOpen(true);
  };

  const openEdit = (a: Appointment) => {
    setEditingId(a.id);
    setTitle(a.title);
    setDoctor(a.doctorOrClinic ?? '');
    setWhen(new Date(`${a.date}T${a.time ?? '09:00'}`));
    setNotes(a.notes ?? '');
    setReminderEnabled(a.reminderEnabled);
    setSheetOpen(true);
  };

  const save = async () => {
    const now = nowIso();
    const existing = editingId ? items.find((a) => a.id === editingId) : undefined;
    if (existing?.notificationId) await cancelReminderNotification(existing.notificationId);

    let notificationId: string | undefined;
    if (reminderEnabled) {
      notificationId = await scheduleReminderNotification({
        title: `Appointment: ${title || 'Appointment'}`,
        body: doctor || undefined,
        date: when,
      });
    }

    const payload = {
      title: title.trim() || 'Appointment',
      doctorOrClinic: doctor.trim() || undefined,
      date: when.toISOString().slice(0, 10),
      time: when.toTimeString().slice(0, 5),
      notes: notes.trim() || undefined,
      reminderEnabled,
      notificationId,
    };

    if (editingId) {
      update(editingId, { ...payload, updatedAt: now });
      showToast('Appointment updated', 'checkmark-circle');
    } else {
      add({ id: generateId(), ...payload, completed: false, createdAt: now, updatedAt: now });
      showToast('Appointment added', 'calendar');
    }
    setSheetOpen(false);
  };

  const toggleComplete = (a: Appointment) => {
    update(a.id, { completed: !a.completed, updatedAt: nowIso() });
  };

  return (
    <Screen>
      <ModuleHeader illustration="doctor" title="Appointments" subtitle={`${upcoming.length} upcoming`} />

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Upcoming</Text>
        <Button label="Add" icon="add" size="sm" onPress={openAdd} />
      </View>
      {upcoming.length === 0 ? (
        <EmptyState illustration="doctor" title="No appointments scheduled" message="Add your baby's next doctor visit." ctaLabel="Add appointment" onPressCta={openAdd} />
      ) : (
        <Card style={{ marginBottom: spacing.xl }}>
          {upcoming.map((a, i) => (
            <View key={a.id} style={i < upcoming.length - 1 ? styles.rowBorder : undefined}>
              <View style={styles.appointmentRow}>
                <Pressable onPress={() => toggleComplete(a)} style={styles.checkbox}>
                  <Ionicons name="ellipse-outline" size={20} color={palette.textFaint} />
                </Pressable>
                <Pressable style={{ flex: 1 }} onPress={() => openEdit(a)}>
                  <Text style={styles.apptTitle}>{a.title}</Text>
                  <Text style={styles.apptMeta}>
                    {formatDateTime(`${a.date}T${a.time ?? '00:00'}`)} {a.doctorOrClinic ? `· ${a.doctorOrClinic}` : ''}
                  </Text>
                </Pressable>
                <Pressable onPress={() => setDeleteId(a.id)} hitSlop={10}>
                  <Ionicons name="trash-outline" size={16} color={palette.textFaint} />
                </Pressable>
              </View>
            </View>
          ))}
        </Card>
      )}

      {past.length > 0 && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Past</Text>
          </View>
          <Card>
            {past.map((a) => (
              <RecordRow
                key={a.id}
                category="appointment"
                icon="checkmark-done"
                title={a.title}
                subtitle={a.doctorOrClinic}
                time={formatDateTime(`${a.date}T${a.time ?? '00:00'}`)}
                onPress={() => openEdit(a)}
                onDelete={() => setDeleteId(a.id)}
              />
            ))}
          </Card>
        </>
      )}

      <FormSheet visible={sheetOpen} title={editingId ? 'Edit appointment' : 'Add appointment'} onClose={() => setSheetOpen(false)} onSave={save}>
        <FormField label="Title" value={title} onChangeText={setTitle} placeholder="e.g. 6-month checkup" />
        <FormField label="Doctor / clinic" value={doctor} onChangeText={setDoctor} optional />
        <DateTimeRow value={when} onChange={setWhen} />
        <FormField label="Notes" value={notes} onChangeText={setNotes} multiline optional />
        <Pressable style={styles.reminderToggle} onPress={() => setReminderEnabled((v) => !v)}>
          <Ionicons name={reminderEnabled ? 'notifications' : 'notifications-off'} size={18} color={palette.primaryPinkDark} />
          <Text style={styles.reminderLabel}>Remind me</Text>
        </Pressable>
      </FormSheet>

      <ConfirmDialog
        visible={!!deleteId}
        title="Delete this appointment?"
        onCancel={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) remove(deleteId);
          setDeleteId(null);
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
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
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  appointmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  checkbox: {
    padding: 2,
  },
  apptTitle: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: palette.text,
  },
  apptMeta: {
    fontSize: fontSize.xs,
    color: palette.textSecondary,
    marginTop: 2,
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
