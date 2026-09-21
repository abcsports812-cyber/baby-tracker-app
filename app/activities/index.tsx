import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
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
import { useActivityStore } from '../../src/store';
import { useAutoOpenAdd } from '../../src/hooks/useAutoOpenAdd';
import { generateId, nowIso } from '../../src/lib/id';
import { formatDateTime, formatDuration } from '../../src/lib/date';
import { activityLabel } from '../../src/lib/labels';
import { showToast } from '../../src/components/ui/Toast';
import { fontSize, palette, spacing } from '../../src/theme';
import type { ActivityKind, ActivityRecord } from '../../src/types/models';

const ACTIVITY_OPTIONS: { value: ActivityKind; label: string }[] = [
  { value: 'play', label: 'Play' },
  { value: 'tummyTime', label: 'Tummy time' },
  { value: 'reading', label: 'Reading' },
  { value: 'outdoor', label: 'Outdoor' },
  { value: 'music', label: 'Music' },
  { value: 'sensory', label: 'Sensory play' },
  { value: 'familyTime', label: 'Family time' },
  { value: 'other', label: 'Other' },
];

export default function ActivitiesScreen() {
  const items = useActivityStore((s) => s.items);
  const add = useActivityStore((s) => s.add);
  const update = useActivityStore((s) => s.update);
  const remove = useActivityStore((s) => s.remove);

  const [sheetOpen, setSheetOpen] = useAutoOpenAdd();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [kind, setKind] = useState<ActivityKind>('play');
  const [customLabel, setCustomLabel] = useState('');
  const [when, setWhen] = useState(new Date());
  const [duration, setDuration] = useState('');
  const [notes, setNotes] = useState('');

  const sorted = useMemo(() => [...items].sort((a, b) => b.dateTime.localeCompare(a.dateTime)), [items]);

  const openAdd = () => {
    setEditingId(null);
    setKind('play');
    setCustomLabel('');
    setWhen(new Date());
    setDuration('');
    setNotes('');
    setSheetOpen(true);
  };

  const openEdit = (item: ActivityRecord) => {
    setEditingId(item.id);
    setKind(item.kind);
    setCustomLabel(item.customLabel ?? '');
    setWhen(new Date(item.dateTime));
    setDuration(item.durationMin?.toString() ?? '');
    setNotes(item.notes ?? '');
    setSheetOpen(true);
  };

  const save = () => {
    const now = nowIso();
    const payload = {
      kind,
      customLabel: kind === 'other' ? customLabel.trim() || undefined : undefined,
      dateTime: when.toISOString(),
      durationMin: duration ? Number(duration) : undefined,
      notes: notes.trim() || undefined,
    };
    if (editingId) {
      update(editingId, { ...payload, updatedAt: now });
      showToast('Activity updated', 'checkmark-circle');
    } else {
      add({ id: generateId(), ...payload, createdAt: now, updatedAt: now });
      showToast('Activity logged', 'game-controller');
    }
    setSheetOpen(false);
  };

  return (
    <Screen>
      <ModuleHeader illustration="activities" title="Activities" subtitle="Play, tummy time & more" />

      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>History</Text>
        <Button label="Add" icon="add" size="sm" onPress={openAdd} />
      </View>

      {sorted.length === 0 ? (
        <EmptyState illustration="activities" title="No activities logged" message="Track playtime, tummy time and more." ctaLabel="Add activity" onPressCta={openAdd} />
      ) : (
        <Card>
          {sorted.map((item) => (
            <RecordRow
              key={item.id}
              category="activity"
              icon="game-controller"
              title={activityLabel(item.kind, item.customLabel)}
              subtitle={item.durationMin ? formatDuration(item.durationMin) : item.notes}
              time={formatDateTime(item.dateTime)}
              onPress={() => openEdit(item)}
              onDelete={() => setDeleteId(item.id)}
            />
          ))}
        </Card>
      )}

      <FormSheet visible={sheetOpen} title={editingId ? 'Edit activity' : 'Add activity'} onClose={() => setSheetOpen(false)} onSave={save}>
        <ChipSelect label="Activity" value={kind} onChange={setKind} options={ACTIVITY_OPTIONS} />
        {kind === 'other' && <FormField label="Activity name" value={customLabel} onChangeText={setCustomLabel} />}
        <DateTimeRow value={when} onChange={setWhen} />
        <FormField label="Duration (minutes)" value={duration} onChangeText={setDuration} keyboardType="number-pad" optional />
        <FormField label="Notes" value={notes} onChangeText={setNotes} multiline optional />
      </FormSheet>

      <ConfirmDialog
        visible={!!deleteId}
        title="Delete this activity?"
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
