import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
import { BarChart } from '../../src/components/charts/BarChart';
import { useDiaperStore } from '../../src/store';
import { useAutoOpenAdd } from '../../src/hooks/useAutoOpenAdd';
import { generateId, nowIso } from '../../src/lib/id';
import { formatTime, isSameDay, last7Days, toISODate } from '../../src/lib/date';
import { showToast } from '../../src/components/ui/Toast';
import { categoryColors, fontSize, palette, radius, spacing } from '../../src/theme';
import type { DiaperRecord, DiaperType } from '../../src/types/models';

const QUICK_OPTIONS: { type: DiaperType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { type: 'wet', label: 'Wet', icon: 'water' },
  { type: 'dirty', label: 'Dirty', icon: 'leaf' },
  { type: 'both', label: 'Both', icon: 'water-outline' },
];

export default function DiaperScreen() {
  const items = useDiaperStore((s) => s.items);
  const add = useDiaperStore((s) => s.add);
  const update = useDiaperStore((s) => s.update);
  const remove = useDiaperStore((s) => s.remove);

  const [sheetOpen, setSheetOpen] = useAutoOpenAdd();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [type, setType] = useState<DiaperType>('wet');
  const [when, setWhen] = useState(new Date());
  const [notes, setNotes] = useState('');

  const sorted = useMemo(() => [...items].sort((a, b) => b.time.localeCompare(a.time)), [items]);
  const today = new Date();
  const todayItems = sorted.filter((d) => isSameDay(d.time, today));
  const wetCount = todayItems.filter((d) => d.type === 'wet' || d.type === 'both').length;
  const dirtyCount = todayItems.filter((d) => d.type === 'dirty' || d.type === 'both').length;

  const weekData = useMemo(() => {
    const days = last7Days();
    return days.map((d) => ({
      label: d.toLocaleDateString(undefined, { weekday: 'narrow' }),
      value: items.filter((x) => toISODate(new Date(x.time)) === toISODate(d)).length,
    }));
  }, [items]);

  const quickLog = (t: DiaperType) => {
    add({ id: generateId(), type: t, time: nowIso(), createdAt: nowIso(), updatedAt: nowIso() });
    showToast('Diaper logged', 'checkmark-circle');
  };

  const openEdit = (item: DiaperRecord) => {
    setEditingId(item.id);
    setType(item.type);
    setWhen(new Date(item.time));
    setNotes(item.notes ?? '');
    setSheetOpen(true);
  };

  const openAdd = () => {
    setEditingId(null);
    setType('wet');
    setWhen(new Date());
    setNotes('');
    setSheetOpen(true);
  };

  const save = () => {
    const now = nowIso();
    if (editingId) {
      update(editingId, { type, time: when.toISOString(), notes: notes.trim() || undefined, updatedAt: now });
      showToast('Diaper entry updated', 'checkmark-circle');
    } else {
      add({ id: generateId(), type, time: when.toISOString(), notes: notes.trim() || undefined, createdAt: now, updatedAt: now });
      showToast('Diaper logged', 'checkmark-circle');
    }
    setSheetOpen(false);
  };

  return (
    <Screen>
      <ModuleHeader illustration="diaper" title="Diaper" subtitle={`${wetCount} wet · ${dirtyCount} dirty today`} />

      <View style={styles.quickRow}>
        {QUICK_OPTIONS.map((opt) => (
          <Pressable key={opt.type} style={[styles.quickBtn, { backgroundColor: categoryColors.diaper.bg }]} onPress={() => quickLog(opt.type)}>
            <Ionicons name={opt.icon} size={20} color={categoryColors.diaper.accent} />
            <Text style={styles.quickLabel}>{opt.label}</Text>
          </Pressable>
        ))}
      </View>

      <Card style={{ marginBottom: spacing.xl }}>
        <Text style={styles.chartTitle}>This week</Text>
        <BarChart data={weekData} color={categoryColors.diaper.accent} height={120} />
      </Card>

      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>History</Text>
        <Button label="Custom" icon="add" size="sm" onPress={openAdd} />
      </View>

      {sorted.length === 0 ? (
        <EmptyState illustration="diaper" title="No diaper records yet" message="Log a change to start tracking." />
      ) : (
        <Card>
          {sorted.map((item) => (
            <RecordRow
              key={item.id}
              category="diaper"
              icon="water"
              title={item.type === 'both' ? 'Wet & dirty' : item.type === 'wet' ? 'Wet' : 'Dirty'}
              subtitle={item.notes}
              time={formatTime(item.time)}
              onPress={() => openEdit(item)}
              onDelete={() => setDeleteId(item.id)}
            />
          ))}
        </Card>
      )}

      <FormSheet visible={sheetOpen} title={editingId ? 'Edit diaper entry' : 'Add diaper entry'} onClose={() => setSheetOpen(false)} onSave={save}>
        <ChipSelect
          label="Type"
          value={type}
          onChange={setType}
          options={[
            { value: 'wet', label: 'Wet' },
            { value: 'dirty', label: 'Dirty' },
            { value: 'both', label: 'Both' },
          ]}
        />
        <DateTimeRow value={when} onChange={setWhen} maximumDate={new Date()} />
        <FormField label="Notes" value={notes} onChangeText={setNotes} multiline optional />
      </FormSheet>

      <ConfirmDialog
        visible={!!deleteId}
        title="Delete this record?"
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
  quickRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  quickBtn: {
    flex: 1,
    borderRadius: radius.lg,
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.xs,
  },
  quickLabel: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: palette.text,
  },
  chartTitle: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: palette.textSecondary,
    marginBottom: spacing.sm,
  },
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
