import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../src/components/ui/Screen';
import { ModuleHeader } from '../../src/components/ui/ModuleHeader';
import { IllustrationBadge } from '../../src/components/ui/IllustrationBadge';
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
import { useFeedingStore } from '../../src/store';
import { useAutoOpenAdd } from '../../src/hooks/useAutoOpenAdd';
import { generateId, nowIso } from '../../src/lib/id';
import { formatTime, isSameDay, last7Days, toISODate } from '../../src/lib/date';
import { showToast } from '../../src/components/ui/Toast';
import { fontSize, palette, spacing } from '../../src/theme';
import type { BreastSide, FeedingRecord, FeedingType } from '../../src/types/models';

export default function FeedingScreen() {
  const items = useFeedingStore((s) => s.items);
  const add = useFeedingStore((s) => s.add);
  const update = useFeedingStore((s) => s.update);
  const remove = useFeedingStore((s) => s.remove);

  const [sheetOpen, setSheetOpen] = useAutoOpenAdd();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [type, setType] = useState<FeedingType>('breast');
  const [when, setWhen] = useState(new Date());
  const [side, setSide] = useState<BreastSide>('left');
  const [durationMin, setDurationMin] = useState('10');
  const [amountMl, setAmountMl] = useState('120');
  const [milkType, setMilkType] = useState('');
  const [foodName, setFoodName] = useState('');
  const [amount, setAmount] = useState('');
  const [reaction, setReaction] = useState('');
  const [notes, setNotes] = useState('');

  const sorted = useMemo(() => [...items].sort((a, b) => b.startTime.localeCompare(a.startTime)), [items]);
  const today = new Date();
  const todayCount = sorted.filter((f) => isSameDay(f.startTime, today)).length;

  const weekData = useMemo(() => {
    const days = last7Days();
    return days.map((d) => ({
      label: d.toLocaleDateString(undefined, { weekday: 'narrow' }),
      value: items.filter((f) => toISODate(new Date(f.startTime)) === toISODate(d)).length,
    }));
  }, [items]);

  const resetForm = () => {
    setType('breast');
    setWhen(new Date());
    setSide('left');
    setDurationMin('10');
    setAmountMl('120');
    setMilkType('');
    setFoodName('');
    setAmount('');
    setReaction('');
    setNotes('');
    setEditingId(null);
  };

  const openAdd = () => {
    resetForm();
    setSheetOpen(true);
  };

  const openEdit = (item: FeedingRecord) => {
    setEditingId(item.id);
    setType(item.type);
    setWhen(new Date(item.startTime));
    setSide(item.side ?? 'left');
    setDurationMin(item.durationMin?.toString() ?? '');
    setAmountMl(item.amountMl?.toString() ?? '');
    setMilkType(item.milkType ?? '');
    setFoodName(item.foodName ?? '');
    setAmount(item.amount ?? '');
    setReaction(item.reaction ?? '');
    setNotes(item.notes ?? '');
    setSheetOpen(true);
  };

  const save = () => {
    const now = nowIso();
    const base = {
      type,
      startTime: when.toISOString(),
      notes: notes.trim() || undefined,
      side: type === 'breast' ? side : undefined,
      durationMin: type === 'breast' && durationMin ? Number(durationMin) : undefined,
      amountMl: type === 'bottle' && amountMl ? Number(amountMl) : undefined,
      milkType: type === 'bottle' ? milkType.trim() || undefined : undefined,
      foodName: type === 'solid' ? foodName.trim() || undefined : undefined,
      amount: type === 'solid' ? amount.trim() || undefined : undefined,
      reaction: type === 'solid' ? reaction.trim() || undefined : undefined,
    };

    if (editingId) {
      update(editingId, { ...base, updatedAt: now });
      showToast('Feeding updated', 'checkmark-circle');
    } else {
      add({ id: generateId(), ...base, createdAt: now, updatedAt: now });
      showToast('Feeding saved', 'checkmark-circle');
    }
    setSheetOpen(false);
    resetForm();
  };

  return (
    <Screen>
      <ModuleHeader illustration="feeding" title="Feeding" subtitle={`${todayCount} feeds today`} />

      <Card style={{ marginBottom: spacing.xl }}>
        <Text style={styles.chartTitle}>This week</Text>
        <BarChart data={weekData} color={palette.peachDark} height={120} />
      </Card>

      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>History</Text>
        <Button label="Add" icon="add" size="sm" onPress={openAdd} />
      </View>

      {sorted.length === 0 ? (
        <EmptyState
          illustration="feeding"
          title="No feeding records yet"
          message="Log your baby's first feed to start tracking."
          ctaLabel="Add feeding"
          onPressCta={openAdd}
        />
      ) : (
        <Card>
          {sorted.map((item) => (
            <RecordRow
              key={item.id}
              category="feeding"
              icon="nutrition"
              title={
                item.type === 'breast'
                  ? 'Breastfeeding'
                  : item.type === 'bottle'
                    ? 'Bottle'
                    : item.foodName || 'Solid food'
              }
              subtitle={
                item.type === 'breast'
                  ? [item.side, item.durationMin && `${item.durationMin} min`].filter(Boolean).join(' · ')
                  : item.type === 'bottle'
                    ? [item.amountMl && `${item.amountMl} ml`, item.milkType].filter(Boolean).join(' · ')
                    : item.amount
              }
              time={formatTime(item.startTime)}
              onPress={() => openEdit(item)}
              onDelete={() => setDeleteId(item.id)}
            />
          ))}
        </Card>
      )}

      <FormSheet
        visible={sheetOpen}
        title={editingId ? 'Edit feeding' : 'Add feeding'}
        onClose={() => setSheetOpen(false)}
        onSave={save}
      >
        <ChipSelect
          label="Type"
          value={type}
          onChange={setType}
          options={[
            { value: 'breast', label: 'Breast' },
            { value: 'bottle', label: 'Bottle' },
            { value: 'solid', label: 'Solid food' },
          ]}
        />
        <DateTimeRow value={when} onChange={setWhen} maximumDate={new Date()} />

        {type === 'breast' && (
          <>
            <ChipSelect
              label="Side"
              value={side}
              onChange={setSide}
              options={[
                { value: 'left', label: 'Left' },
                { value: 'right', label: 'Right' },
                { value: 'both', label: 'Both' },
              ]}
            />
            <FormField label="Duration (minutes)" value={durationMin} onChangeText={setDurationMin} keyboardType="number-pad" optional />
          </>
        )}

        {type === 'bottle' && (
          <>
            <FormField label="Amount (ml)" value={amountMl} onChangeText={setAmountMl} keyboardType="number-pad" />
            <FormField label="Milk type" value={milkType} onChangeText={setMilkType} placeholder="Formula, breast milk..." optional />
          </>
        )}

        {type === 'solid' && (
          <>
            <View style={styles.solidFoodHeader}>
              <IllustrationBadge name="solidFood" size={56} />
              <Text style={styles.solidFoodLabel}>First foods & solids</Text>
            </View>
            <FormField label="Food name" value={foodName} onChangeText={setFoodName} placeholder="e.g. Mashed banana" />
            <FormField label="Amount" value={amount} onChangeText={setAmount} placeholder="e.g. 2 tbsp" optional />
            <FormField label="Reaction" value={reaction} onChangeText={setReaction} placeholder="Loved it, mild rash..." optional />
          </>
        )}

        <FormField label="Notes" value={notes} onChangeText={setNotes} multiline optional />
      </FormSheet>

      <ConfirmDialog
        visible={!!deleteId}
        title="Delete this record?"
        message="This feeding entry will be permanently removed."
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
  chartTitle: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: palette.textSecondary,
    marginBottom: spacing.sm,
  },
  solidFoodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  solidFoodLabel: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: palette.text,
    flex: 1,
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
