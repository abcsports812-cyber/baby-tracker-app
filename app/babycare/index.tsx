import { useMemo, useState } from 'react';
import { Screen } from '../../src/components/ui/Screen';
import { ModuleHeader } from '../../src/components/ui/ModuleHeader';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { FormSheet } from '../../src/components/ui/FormSheet';
import { FormField } from '../../src/components/ui/FormField';
import { ChipSelect } from '../../src/components/ui/ChipSelect';
import { DateTimeRow } from '../../src/components/ui/DateTimeRow';
import { RecordRow } from '../../src/components/ui/RecordRow';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { ConfirmDialog } from '../../src/components/ui/ConfirmDialog';
import { useBabyCareStore } from '../../src/store';
import { useAutoOpenAdd } from '../../src/hooks/useAutoOpenAdd';
import { generateId, nowIso } from '../../src/lib/id';
import { formatDateTime } from '../../src/lib/date';
import { babyCareLabel } from '../../src/lib/labels';
import { showToast } from '../../src/components/ui/Toast';
import { StyleSheet, Text, View } from 'react-native';
import { fontSize, palette, spacing } from '../../src/theme';
import type { BabyCareActivity, BabyCareRecord } from '../../src/types/models';

const ACTIVITY_OPTIONS: { value: BabyCareActivity; label: string }[] = [
  { value: 'bath', label: 'Bath' },
  { value: 'nails', label: 'Nail trim' },
  { value: 'hair', label: 'Hair care' },
  { value: 'oral', label: 'Oral care' },
  { value: 'skin', label: 'Skin care' },
  { value: 'other', label: 'Other' },
];

export default function BabyCareScreen() {
  const items = useBabyCareStore((s) => s.items);
  const add = useBabyCareStore((s) => s.add);
  const update = useBabyCareStore((s) => s.update);
  const remove = useBabyCareStore((s) => s.remove);

  const [sheetOpen, setSheetOpen] = useAutoOpenAdd();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [activity, setActivity] = useState<BabyCareActivity>('bath');
  const [customLabel, setCustomLabel] = useState('');
  const [when, setWhen] = useState(new Date());
  const [notes, setNotes] = useState('');

  const sorted = useMemo(() => [...items].sort((a, b) => b.dateTime.localeCompare(a.dateTime)), [items]);

  const openAdd = () => {
    setEditingId(null);
    setActivity('bath');
    setCustomLabel('');
    setWhen(new Date());
    setNotes('');
    setSheetOpen(true);
  };

  const openEdit = (item: BabyCareRecord) => {
    setEditingId(item.id);
    setActivity(item.activity);
    setCustomLabel(item.customLabel ?? '');
    setWhen(new Date(item.dateTime));
    setNotes(item.notes ?? '');
    setSheetOpen(true);
  };

  const save = () => {
    const now = nowIso();
    const payload = {
      activity,
      customLabel: activity === 'other' ? customLabel.trim() || undefined : undefined,
      dateTime: when.toISOString(),
      notes: notes.trim() || undefined,
    };
    if (editingId) {
      update(editingId, { ...payload, updatedAt: now });
      showToast('Baby care entry updated', 'checkmark-circle');
    } else {
      add({ id: generateId(), ...payload, createdAt: now, updatedAt: now });
      showToast('Baby care logged', 'sparkles');
    }
    setSheetOpen(false);
  };

  return (
    <Screen>
      <ModuleHeader illustration="babyCare" title="Baby Care" subtitle="Bath, nails, hair & more" />

      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>History</Text>
        <Button label="Add" icon="add" size="sm" onPress={openAdd} />
      </View>

      {sorted.length === 0 ? (
        <EmptyState illustration="babyCare" title="No care activities logged" message="Track bath time, nail trims and more here." ctaLabel="Add activity" onPressCta={openAdd} />
      ) : (
        <Card>
          {sorted.map((item) => (
            <RecordRow
              key={item.id}
              category="bath"
              icon="sparkles"
              title={babyCareLabel(item.activity, item.customLabel)}
              subtitle={item.notes}
              time={formatDateTime(item.dateTime)}
              onPress={() => openEdit(item)}
              onDelete={() => setDeleteId(item.id)}
            />
          ))}
        </Card>
      )}

      <FormSheet visible={sheetOpen} title={editingId ? 'Edit care activity' : 'Add care activity'} onClose={() => setSheetOpen(false)} onSave={save}>
        <ChipSelect label="Activity" value={activity} onChange={setActivity} options={ACTIVITY_OPTIONS} />
        {activity === 'other' && <FormField label="Activity name" value={customLabel} onChangeText={setCustomLabel} />}
        <DateTimeRow value={when} onChange={setWhen} />
        <FormField label="Notes" value={notes} onChangeText={setNotes} multiline optional />
      </FormSheet>

      <ConfirmDialog
        visible={!!deleteId}
        title="Delete this entry?"
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
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  listTitle: {
    fontSize: fontSize.lg,
    fontWeight: '800',
    color: palette.text,
  },
});
