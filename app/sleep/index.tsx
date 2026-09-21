import { useEffect, useMemo, useState } from 'react';
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
import { BarChart } from '../../src/components/charts/BarChart';
import { useSleepStore } from '../../src/store';
import { useAutoOpenAdd } from '../../src/hooks/useAutoOpenAdd';
import { generateId, nowIso } from '../../src/lib/id';
import { formatDuration, formatTime, isSameDay, last7Days, toISODate } from '../../src/lib/date';
import { showToast } from '../../src/components/ui/Toast';
import { categoryColors, fontSize, palette, spacing } from '../../src/theme';
import type { SleepKind, SleepRecord } from '../../src/types/models';

export default function SleepScreen() {
  const items = useSleepStore((s) => s.items);
  const add = useSleepStore((s) => s.add);
  const update = useSleepStore((s) => s.update);
  const remove = useSleepStore((s) => s.remove);

  const [sheetOpen, setSheetOpen] = useAutoOpenAdd();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [kind, setKind] = useState<SleepKind>('nap');
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());
  const [notes, setNotes] = useState('');
  const [now, setNow] = useState(() => Date.now());

  const active = items.find((s) => !s.endTime);

  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [active]);

  const sorted = useMemo(() => [...items].sort((a, b) => b.startTime.localeCompare(a.startTime)), [items]);
  const today = new Date();
  const todayItems = sorted.filter((s) => isSameDay(s.startTime, today) && s.endTime);
  const todayMinutes = todayItems.reduce(
    (sum, s) => sum + (new Date(s.endTime!).getTime() - new Date(s.startTime).getTime()) / 60000,
    0
  );

  const weekData = useMemo(() => {
    const days = last7Days();
    return days.map((d) => {
      const minutes = items
        .filter((s) => s.endTime && toISODate(new Date(s.startTime)) === toISODate(d))
        .reduce((sum, s) => sum + (new Date(s.endTime!).getTime() - new Date(s.startTime).getTime()) / 60000, 0);
      return { label: d.toLocaleDateString(undefined, { weekday: 'narrow' }), value: Math.round(minutes / 60) };
    });
  }, [items]);

  const startSleep = (k: SleepKind) => {
    add({ id: generateId(), kind: k, startTime: nowIso(), createdAt: nowIso(), updatedAt: nowIso() });
    showToast(`${k === 'nap' ? 'Nap' : 'Night sleep'} started`, 'moon');
  };

  const stopSleep = () => {
    if (!active) return;
    update(active.id, { endTime: nowIso(), updatedAt: nowIso() });
    showToast('Sleep saved', 'checkmark-circle');
  };

  const openEdit = (item: SleepRecord) => {
    setEditingId(item.id);
    setKind(item.kind);
    setStartTime(new Date(item.startTime));
    setEndTime(item.endTime ? new Date(item.endTime) : new Date());
    setNotes(item.notes ?? '');
    setSheetOpen(true);
  };

  const openManualAdd = () => {
    setEditingId(null);
    setKind('nap');
    const now = new Date();
    setStartTime(now);
    setEndTime(now);
    setNotes('');
    setSheetOpen(true);
  };

  const save = () => {
    const now = nowIso();
    const payload = {
      kind,
      startTime: startTime.toISOString(),
      endTime: endTime > startTime ? endTime.toISOString() : undefined,
      notes: notes.trim() || undefined,
    };
    if (editingId) {
      update(editingId, { ...payload, updatedAt: now });
      showToast('Sleep entry updated', 'checkmark-circle');
    } else {
      add({ id: generateId(), ...payload, createdAt: now, updatedAt: now });
      showToast('Sleep entry added', 'checkmark-circle');
    }
    setSheetOpen(false);
  };

  const elapsedMin = active ? (now - new Date(active.startTime).getTime()) / 60000 : 0;

  return (
    <Screen>
      <ModuleHeader illustration="sleep" title="Sleep" subtitle={`${formatDuration(todayMinutes)} today`} />

      {active ? (
        <Card style={[styles.activeCard, { backgroundColor: categoryColors.sleep.bg }]}>
          <Text style={styles.activeLabel}>{active.kind === 'nap' ? 'Napping' : 'Sleeping'} since {formatTime(active.startTime)}</Text>
          <Text style={styles.activeElapsed}>{formatDuration(elapsedMin)}</Text>
          <Button label="Stop sleep" variant="danger" icon="stop" onPress={stopSleep} fullWidth />
        </Card>
      ) : (
        <View style={styles.startRow}>
          <Button label="Start nap" icon="sunny" onPress={() => startSleep('nap')} style={{ flex: 1 }} />
          <Button label="Start night sleep" icon="moon" variant="secondary" onPress={() => startSleep('night')} style={{ flex: 1 }} />
        </View>
      )}

      <Card style={{ marginTop: spacing.xl, marginBottom: spacing.xl }}>
        <Text style={styles.chartTitle}>This week (hours)</Text>
        <BarChart data={weekData} color={categoryColors.sleep.accent} height={120} />
      </Card>

      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>History</Text>
        <Button label="Manual entry" icon="add" size="sm" onPress={openManualAdd} />
      </View>

      {sorted.length === 0 ? (
        <EmptyState illustration="sleep" title="Start tracking your baby's sleep" message="Tap Start nap or Start night sleep above." />
      ) : (
        <Card>
          {sorted.map((item) => (
            <RecordRow
              key={item.id}
              category="sleep"
              icon="moon"
              title={item.kind === 'nap' ? 'Nap' : 'Night sleep'}
              subtitle={
                item.endTime
                  ? formatDuration((new Date(item.endTime).getTime() - new Date(item.startTime).getTime()) / 60000)
                  : 'In progress'
              }
              time={formatTime(item.startTime)}
              onPress={() => openEdit(item)}
              onDelete={() => setDeleteId(item.id)}
            />
          ))}
        </Card>
      )}

      <FormSheet visible={sheetOpen} title={editingId ? 'Edit sleep' : 'Add sleep entry'} onClose={() => setSheetOpen(false)} onSave={save}>
        <ChipSelect
          label="Type"
          value={kind}
          onChange={setKind}
          options={[
            { value: 'nap', label: 'Nap' },
            { value: 'night', label: 'Night sleep' },
          ]}
        />
        <DateTimeRow label="Start" value={startTime} onChange={setStartTime} />
        <DateTimeRow label="End" value={endTime} onChange={setEndTime} />
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
  activeCard: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  activeLabel: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: palette.text,
  },
  activeElapsed: {
    fontSize: fontSize.xxxl,
    fontWeight: '800',
    color: palette.text,
    marginBottom: spacing.sm,
  },
  startRow: {
    flexDirection: 'row',
    gap: spacing.md,
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
