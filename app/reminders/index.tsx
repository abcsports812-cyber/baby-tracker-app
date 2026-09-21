import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { Screen } from '../../src/components/ui/Screen';
import { ModuleHeader } from '../../src/components/ui/ModuleHeader';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { FormSheet } from '../../src/components/ui/FormSheet';
import { FormField } from '../../src/components/ui/FormField';
import { ChipSelect } from '../../src/components/ui/ChipSelect';
import { DateTimeRow } from '../../src/components/ui/DateTimeRow';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { ConfirmDialog } from '../../src/components/ui/ConfirmDialog';
import { useReminderStore } from '../../src/store';
import { useAutoOpenAdd } from '../../src/hooks/useAutoOpenAdd';
import { generateId, nowIso } from '../../src/lib/id';
import { formatDateTime } from '../../src/lib/date';
import { reminderCategoryLabel } from '../../src/lib/labels';
import { showToast } from '../../src/components/ui/Toast';
import { cancelReminderNotification, scheduleReminderNotification } from '../../src/lib/notifications';
import { palette, radius, fontSize, spacing } from '../../src/theme';
import type { Reminder, ReminderCategory, ReminderRepeat } from '../../src/types/models';

export default function RemindersScreen() {
  const items = useReminderStore((s) => s.items);
  const add = useReminderStore((s) => s.add);
  const update = useReminderStore((s) => s.update);
  const remove = useReminderStore((s) => s.remove);

  const [sheetOpen, setSheetOpen] = useAutoOpenAdd();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ReminderCategory>('custom');
  const [when, setWhen] = useState(new Date());
  const [repeat, setRepeat] = useState<ReminderRepeat>('none');

  const sorted = useMemo(() => [...items].sort((a, b) => a.dateTime.localeCompare(b.dateTime)), [items]);

  const openAdd = () => {
    setEditingId(null);
    setTitle('');
    setCategory('custom');
    setWhen(new Date());
    setRepeat('none');
    setSheetOpen(true);
  };

  const openEdit = (r: Reminder) => {
    setEditingId(r.id);
    setTitle(r.title);
    setCategory(r.category);
    setWhen(new Date(r.dateTime));
    setRepeat(r.repeat);
    setSheetOpen(true);
  };

  const save = async () => {
    const now = nowIso();
    const existing = editingId ? items.find((r) => r.id === editingId) : undefined;
    if (existing?.notificationId) await cancelReminderNotification(existing.notificationId);

    const notificationId = await scheduleReminderNotification({
      title: title.trim() || 'Reminder',
      body: reminderCategoryLabel[category],
      date: when,
      repeat,
    });

    const payload = {
      title: title.trim() || 'Reminder',
      category,
      dateTime: when.toISOString(),
      repeat,
      enabled: true,
      notificationId,
    };

    if (editingId) {
      update(editingId, { ...payload, updatedAt: now });
      showToast('Reminder updated', 'checkmark-circle');
    } else {
      add({ id: generateId(), ...payload, createdAt: now, updatedAt: now });
      showToast('Reminder set', 'alarm');
    }
    setSheetOpen(false);
  };

  const toggleEnabled = async (r: Reminder) => {
    if (r.enabled) {
      await cancelReminderNotification(r.notificationId);
      update(r.id, { enabled: false, notificationId: undefined, updatedAt: nowIso() });
    } else {
      const notificationId = await scheduleReminderNotification({
        title: r.title,
        body: reminderCategoryLabel[r.category],
        date: new Date(r.dateTime),
        repeat: r.repeat,
      });
      update(r.id, { enabled: true, notificationId, updatedAt: nowIso() });
    }
  };

  return (
    <Screen>
      <ModuleHeader illustration="reminders" title="Reminders" subtitle={`${items.filter((r) => r.enabled).length} active`} />

      <View style={styles.listHeader}>
        <Text style={styles.hint}>Gentle nudges for feeding, medication, appointments & more.</Text>
        <Button label="Add" icon="add" size="sm" onPress={openAdd} />
      </View>

      {sorted.length === 0 ? (
        <EmptyState illustration="reminders" title="No reminders yet" message="Create a reminder so you never miss a moment." ctaLabel="Add reminder" onPressCta={openAdd} />
      ) : (
        <Card padded={false}>
          {sorted.map((r, i) => (
            <View key={r.id} style={[styles.row, i < sorted.length - 1 && styles.rowBorder]}>
              <View style={[styles.iconWrap]}>
                <Ionicons name="alarm" size={18} color={palette.primaryPinkDark} />
              </View>
              <Pressable style={{ flex: 1 }} onPress={() => openEdit(r)}>
                <Text style={styles.title}>{r.title}</Text>
                <Text style={styles.meta}>
                  {reminderCategoryLabel[r.category]} · {formatDateTime(r.dateTime)}
                  {r.repeat !== 'none' ? ` · ${r.repeat}` : ''}
                </Text>
              </Pressable>
              <Switch value={r.enabled} onValueChange={() => toggleEnabled(r)} trackColor={{ true: palette.primaryPink, false: palette.border }} />
              <Pressable onPress={() => setDeleteId(r.id)} hitSlop={10} style={{ marginLeft: spacing.sm }}>
                <Ionicons name="trash-outline" size={16} color={palette.textFaint} />
              </Pressable>
            </View>
          ))}
        </Card>
      )}

      <FormSheet visible={sheetOpen} title={editingId ? 'Edit reminder' : 'Add reminder'} onClose={() => setSheetOpen(false)} onSave={save}>
        <FormField label="Title" value={title} onChangeText={setTitle} placeholder="e.g. Give vitamin D drops" />
        <ChipSelect
          label="Category"
          value={category}
          onChange={setCategory}
          options={(Object.keys(reminderCategoryLabel) as ReminderCategory[]).map((c) => ({ value: c, label: reminderCategoryLabel[c] }))}
        />
        <DateTimeRow value={when} onChange={setWhen} />
        <ChipSelect
          label="Repeat"
          value={repeat}
          onChange={setRepeat}
          options={[
            { value: 'none', label: 'Once' },
            { value: 'daily', label: 'Daily' },
            { value: 'weekly', label: 'Weekly' },
          ]}
        />
      </FormSheet>

      <ConfirmDialog
        visible={!!deleteId}
        title="Delete this reminder?"
        onCancel={() => setDeleteId(null)}
        onConfirm={async () => {
          if (deleteId) {
            const r = items.find((x) => x.id === deleteId);
            if (r?.notificationId) await cancelReminderNotification(r.notificationId);
            remove(deleteId);
          }
          setDeleteId(null);
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  hint: {
    flex: 1,
    fontSize: fontSize.xs,
    color: palette.textSecondary,
    lineHeight: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: palette.softPink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: palette.text,
  },
  meta: {
    fontSize: fontSize.xs,
    color: palette.textSecondary,
    marginTop: 2,
  },
});
