import { Ionicons } from '@expo/vector-icons';
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
import { useFeedingStore } from '../../src/store';
import { useAutoOpenAdd } from '../../src/hooks/useAutoOpenAdd';
import { generateId, nowIso } from '../../src/lib/id';
import { formatDate, formatDuration, formatTime, isSameDay, last7Days, toISODate } from '../../src/lib/date';
import { showToast } from '../../src/components/ui/Toast';
import { categoryColors, fontSize, palette, radius, spacing } from '../../src/theme';
import type { BreastSide, FeedingRecord } from '../../src/types/models';

/** Sanity bounds to catch obvious typos, not medical limits. */
const DURATION_MAX_MIN = 240;
const AMOUNT_MAX_ML = 2000;

function sideLabel(side?: BreastSide): string {
  if (side === 'left') return 'Left';
  if (side === 'right') return 'Right';
  return 'Both';
}

function sessionSubtitle(item: FeedingRecord): string {
  const parts = [
    sideLabel(item.side),
    item.amountMl != null ? `${item.amountMl} ml` : undefined,
    item.durationMin != null ? formatDuration(item.durationMin) : undefined,
  ].filter(Boolean);
  return parts.join(' · ');
}

function PumpStatCard({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  const colors = categoryColors.feeding;
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIconWrap, { backgroundColor: colors.bg }]}>
        <Ionicons name={icon} size={18} color={colors.accent} />
      </View>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

export default function PumpingScreen() {
  const items = useFeedingStore((s) => s.items);
  const add = useFeedingStore((s) => s.add);
  const update = useFeedingStore((s) => s.update);
  const remove = useFeedingStore((s) => s.remove);

  const [sheetOpen, setSheetOpen] = useAutoOpenAdd();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const [date, setDate] = useState(new Date());
  const [durationMin, setDurationMin] = useState('');
  const [side, setSide] = useState<BreastSide>('both');
  const [amountMl, setAmountMl] = useState('');
  const [leftAmountMl, setLeftAmountMl] = useState('');
  const [rightAmountMl, setRightAmountMl] = useState('');
  const [notes, setNotes] = useState('');

  const pumpItems = useMemo(() => items.filter((i) => i.type === 'pump'), [items]);
  const sorted = useMemo(() => [...pumpItems].sort((a, b) => b.startTime.localeCompare(a.startTime)), [pumpItems]);

  // A pump record with a startTime but no durationMin yet is the one
  // in-progress session — this is a pure derived read of the persisted
  // store, so a restored backup or a fresh app launch both correctly
  // surface an existing incomplete session without any extra code, and
  // never invent a new one.
  const active = pumpItems.find((i) => i.durationMin == null);

  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [active]);

  const today = new Date();
  const todayItems = pumpItems.filter((i) => isSameDay(i.startTime, today) && i.amountMl != null);
  const todayTotalMl = todayItems.reduce((sum, i) => sum + (i.amountMl ?? 0), 0);

  const completedItems = useMemo(() => pumpItems.filter((i) => i.amountMl != null && i.durationMin != null), [pumpItems]);
  const avgAmountMl = completedItems.length ? Math.round(completedItems.reduce((s, i) => s + (i.amountMl ?? 0), 0) / completedItems.length) : 0;
  const avgDurationMin = completedItems.length ? Math.round(completedItems.reduce((s, i) => s + (i.durationMin ?? 0), 0) / completedItems.length) : 0;

  const days = useMemo(() => last7Days(), []);
  const weekItems = useMemo(() => {
    const cutoff = days[0];
    return completedItems.filter((i) => new Date(i.startTime) >= cutoff);
  }, [completedItems, days]);
  const weekTotalMl = weekItems.reduce((s, i) => s + (i.amountMl ?? 0), 0);
  const weekAvgMl = weekItems.length ? Math.round(weekTotalMl / weekItems.length) : 0;
  const weekLeftMl = weekItems.reduce((s, i) => s + (i.leftAmountMl ?? 0), 0);
  const weekRightMl = weekItems.reduce((s, i) => s + (i.rightAmountMl ?? 0), 0);
  const hasSideBreakdown = weekLeftMl > 0 || weekRightMl > 0;

  const weekChartData = useMemo(
    () =>
      days.map((d) => ({
        label: d.toLocaleDateString(undefined, { weekday: 'narrow' }),
        value: completedItems.filter((i) => toISODate(new Date(i.startTime)) === toISODate(d)).reduce((s, i) => s + (i.amountMl ?? 0), 0),
      })),
    [days, completedItems]
  );

  const resetForm = () => {
    setDate(new Date());
    setDurationMin('');
    setSide('both');
    setAmountMl('');
    setLeftAmountMl('');
    setRightAmountMl('');
    setNotes('');
    setEditingId(null);
  };

  const openManualAdd = () => {
    resetForm();
    setSheetOpen(true);
  };

  const openEdit = (item: FeedingRecord) => {
    setEditingId(item.id);
    setDate(new Date(item.startTime));
    setDurationMin(item.durationMin != null ? String(item.durationMin) : '');
    setSide(item.side ?? 'both');
    setAmountMl(item.side !== 'both' && item.amountMl != null ? String(item.amountMl) : '');
    setLeftAmountMl(item.leftAmountMl != null ? String(item.leftAmountMl) : '');
    setRightAmountMl(item.rightAmountMl != null ? String(item.rightAmountMl) : '');
    setNotes(item.notes ?? '');
    setSheetOpen(true);
  };

  const startPumping = () => {
    if (active) return;
    const startNow = nowIso();
    add({ id: generateId(), type: 'pump', startTime: startNow, createdAt: startNow, updatedAt: startNow });
    showToast('Pumping started', 'timer-outline');
  };

  const stopPumping = () => {
    if (!active) return;
    const elapsedMin = Math.max(1, Math.round((new Date().getTime() - new Date(active.startTime).getTime()) / 60000));
    setEditingId(active.id);
    setDate(new Date(active.startTime));
    setDurationMin(String(elapsedMin));
    setSide('both');
    setAmountMl('');
    setLeftAmountMl('');
    setRightAmountMl('');
    setNotes('');
    setSheetOpen(true);
  };

  const save = () => {
    if (date.getTime() > new Date().getTime()) {
      showToast('That date/time is in the future — please check the value', 'alert-circle-outline');
      return;
    }

    const duration = Number(durationMin);
    if (!durationMin.trim() || !Number.isFinite(duration) || duration <= 0) {
      showToast('Enter a valid duration', 'alert-circle-outline');
      return;
    }
    if (duration > DURATION_MAX_MIN) {
      showToast('That duration looks too high — please check the value', 'alert-circle-outline');
      return;
    }

    let finalAmountMl: number;
    let finalLeft: number | undefined;
    let finalRight: number | undefined;

    if (side === 'both') {
      const leftTrim = leftAmountMl.trim();
      const rightTrim = rightAmountMl.trim();
      if (!leftTrim && !rightTrim) {
        showToast('Enter at least one side’s amount', 'alert-circle-outline');
        return;
      }
      const left = leftTrim ? Number(leftTrim) : 0;
      const right = rightTrim ? Number(rightTrim) : 0;
      if ((leftTrim && (!Number.isFinite(left) || left < 0)) || (rightTrim && (!Number.isFinite(right) || right < 0))) {
        showToast('Enter a valid amount', 'alert-circle-outline');
        return;
      }
      if (left > AMOUNT_MAX_ML || right > AMOUNT_MAX_ML) {
        showToast('That amount looks too high — please check the value', 'alert-circle-outline');
        return;
      }
      finalAmountMl = left + right;
      finalLeft = leftTrim ? left : undefined;
      finalRight = rightTrim ? right : undefined;
    } else {
      const n = Number(amountMl);
      if (!amountMl.trim() || !Number.isFinite(n) || n < 0) {
        showToast('Enter a valid amount', 'alert-circle-outline');
        return;
      }
      if (n > AMOUNT_MAX_ML) {
        showToast('That amount looks too high — please check the value', 'alert-circle-outline');
        return;
      }
      finalAmountMl = n;
    }

    const now = nowIso();
    const payload = {
      type: 'pump' as const,
      startTime: date.toISOString(),
      durationMin: duration,
      side,
      amountMl: finalAmountMl,
      leftAmountMl: finalLeft,
      rightAmountMl: finalRight,
      notes: notes.trim() || undefined,
    };

    if (editingId) {
      update(editingId, { ...payload, updatedAt: now });
      showToast('Pumping session saved', 'checkmark-circle');
    } else {
      add({ id: generateId(), ...payload, createdAt: now, updatedAt: now });
      showToast('Pumping session saved', 'checkmark-circle');
    }
    setSheetOpen(false);
    resetForm();
  };

  const elapsedMin = active ? (now - new Date(active.startTime).getTime()) / 60000 : 0;

  return (
    <Screen>
      <ModuleHeader illustration="pumping" title="Pumping" subtitle={completedItems.length > 0 ? `${todayTotalMl} ml expressed today` : 'Track expressed milk sessions'} />

      {active ? (
        <Card style={[styles.activeCard, { backgroundColor: categoryColors.feeding.bg }]}>
          <Text style={styles.activeLabel}>Pumping since {formatTime(active.startTime)}</Text>
          <Text style={styles.activeElapsed}>{formatDuration(elapsedMin)}</Text>
          <Button label="Stop Pumping" variant="danger" icon="stop" onPress={stopPumping} fullWidth />
        </Card>
      ) : (
        <View style={styles.startRow}>
          <Button label="Start Pumping" icon="play" onPress={startPumping} style={{ flex: 1 }} />
          <Button label="Log Session" icon="add" variant="secondary" onPress={openManualAdd} style={{ flex: 1 }} />
        </View>
      )}

      {completedItems.length > 0 && (
        <>
          <View style={styles.statRow}>
            <PumpStatCard icon="water-outline" label="Today" value={`${todayTotalMl} ml`} />
            <PumpStatCard icon="repeat-outline" label="Sessions" value={`${todayItems.length}`} />
          </View>

          <Card style={{ marginTop: spacing.lg, marginBottom: spacing.xl }}>
            <Text style={styles.sectionTitle}>7-day trend (ml)</Text>
            <BarChart data={weekChartData} color={categoryColors.feeding.accent} height={120} />
            <View style={styles.analyticsGrid}>
              <View style={styles.analyticsRow}>
                <Text style={styles.analyticsLabel}>7-day total</Text>
                <Text style={styles.analyticsValue}>{weekTotalMl} ml</Text>
              </View>
              <View style={styles.analyticsRow}>
                <Text style={styles.analyticsLabel}>7-day average / session</Text>
                <Text style={styles.analyticsValue}>{weekAvgMl} ml</Text>
              </View>
              <View style={styles.analyticsRow}>
                <Text style={styles.analyticsLabel}>Average amount / session</Text>
                <Text style={styles.analyticsValue}>{avgAmountMl} ml</Text>
              </View>
              <View style={styles.analyticsRow}>
                <Text style={styles.analyticsLabel}>Average duration</Text>
                <Text style={styles.analyticsValue}>{formatDuration(avgDurationMin)}</Text>
              </View>
              {hasSideBreakdown && (
                <>
                  <View style={styles.analyticsRow}>
                    <Text style={styles.analyticsLabel}>Left (7 days)</Text>
                    <Text style={styles.analyticsValue}>{weekLeftMl} ml</Text>
                  </View>
                  <View style={styles.analyticsRow}>
                    <Text style={styles.analyticsLabel}>Right (7 days)</Text>
                    <Text style={styles.analyticsValue}>{weekRightMl} ml</Text>
                  </View>
                </>
              )}
            </View>
          </Card>
        </>
      )}

      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>History</Text>
      </View>

      {sorted.length === 0 ? (
        <EmptyState
          illustration="pumping"
          title="No pumping sessions yet"
          message="Start a timer or log a session to begin tracking."
          ctaLabel="Log session"
          onPressCta={openManualAdd}
        />
      ) : (
        <Card>
          {sorted.map((item) => (
            <RecordRow
              key={item.id}
              category="feeding"
              icon="timer-outline"
              title={item.durationMin == null ? 'Pumping (in progress)' : 'Pumping session'}
              subtitle={item.durationMin == null ? undefined : sessionSubtitle(item)}
              time={formatDate(item.startTime)}
              onPress={() => (item.durationMin == null ? stopPumping() : openEdit(item))}
              onDelete={() => setDeleteId(item.id)}
            />
          ))}
        </Card>
      )}

      <FormSheet visible={sheetOpen} title={editingId ? 'Pumping session' : 'Log session'} onClose={() => setSheetOpen(false)} onSave={save}>
        <DateTimeRow value={date} onChange={setDate} maximumDate={new Date()} />
        <FormField label="Duration (minutes)" value={durationMin} onChangeText={setDurationMin} keyboardType="number-pad" />
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
        {side === 'both' ? (
          <View style={styles.sideRow}>
            <View style={{ flex: 1 }}>
              <FormField label="Left (ml)" value={leftAmountMl} onChangeText={setLeftAmountMl} keyboardType="decimal-pad" optional />
            </View>
            <View style={{ flex: 1 }}>
              <FormField label="Right (ml)" value={rightAmountMl} onChangeText={setRightAmountMl} keyboardType="decimal-pad" optional />
            </View>
          </View>
        ) : (
          <FormField label="Amount expressed (ml)" value={amountMl} onChangeText={setAmountMl} keyboardType="decimal-pad" />
        )}
        <FormField label="Notes" value={notes} onChangeText={setNotes} multiline optional />
      </FormSheet>

      <ConfirmDialog
        visible={!!deleteId}
        title="Delete this session?"
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
  startRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  activeCard: {
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xl,
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
  statRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: palette.white,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  statIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  statLabel: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: palette.textSecondary,
  },
  statValue: {
    fontSize: fontSize.lg,
    fontWeight: '800',
    color: palette.text,
    marginTop: 1,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: palette.textSecondary,
    marginBottom: spacing.sm,
  },
  analyticsGrid: {
    marginTop: spacing.lg,
    gap: 6,
  },
  analyticsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  analyticsLabel: {
    fontSize: fontSize.sm,
    color: palette.textSecondary,
  },
  analyticsValue: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: palette.text,
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
  sideRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
});
