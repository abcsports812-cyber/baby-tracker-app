import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../src/components/ui/Screen';
import { ModuleHeader } from '../../src/components/ui/ModuleHeader';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { FormSheet } from '../../src/components/ui/FormSheet';
import { FormField } from '../../src/components/ui/FormField';
import { DateTimeField } from '../../src/components/ui/DateTimeField';
import { RecordRow } from '../../src/components/ui/RecordRow';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { ConfirmDialog } from '../../src/components/ui/ConfirmDialog';
import { LineChart } from '../../src/components/charts/LineChart';
import { useBabyProfileStore, useGrowthStore, useSettingsStore } from '../../src/store';
import { useAutoOpenAdd } from '../../src/hooks/useAutoOpenAdd';
import { generateId, nowIso } from '../../src/lib/id';
import { daysBetween, formatDate, formatShortDate } from '../../src/lib/date';
import { showToast } from '../../src/components/ui/Toast';
import { cmToDisplay, cmToUnit, formatHeight, formatWeight, heightToCm, kgToDisplay, kgToUnit, weightToKg } from '../../src/lib/units';
import { categoryColors, fontSize, palette, radius, spacing } from '../../src/theme';
import type { GrowthRecord } from '../../src/types/models';

/** Sanity bounds to catch obvious typos (a stray digit, a negative sign)
 * without being clinically restrictive — these are not medical limits. */
const WEIGHT_MAX_KG = 50;
const HEIGHT_MAX_CM = 150;
const HEAD_MAX_CM = 70;

/** Age as of a specific date rather than "now" — purely informational
 * context next to a measurement, never used for any interpretation. */
function ageAtDate(dob: string, targetDate: string): string {
  const totalDays = Math.max(0, daysBetween(dob, targetDate));
  const weeks = Math.floor(totalDays / 7);
  const months = Math.floor(totalDays / 30.4368);
  const years = Math.floor(totalDays / 365.25);

  if (totalDays < 14) return `${totalDays} day${totalDays === 1 ? '' : 's'} old`;
  if (totalDays < 60) return `${weeks} week${weeks === 1 ? '' : 's'} old`;
  if (months < 24) return `${months} month${months === 1 ? '' : 's'} old`;
  const remMonths = months % 12;
  return remMonths > 0 ? `${years}y ${remMonths}m old` : `${years} year${years === 1 ? '' : 's'} old`;
}

function LatestMeasurementCard({
  icon,
  label,
  value,
  ageLabel,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  ageLabel?: string;
}) {
  const colors = categoryColors.growth;
  return (
    <View style={styles.latestCard}>
      <View style={[styles.latestIconWrap, { backgroundColor: colors.bg }]}>
        <Ionicons name={icon} size={18} color={colors.accent} />
      </View>
      <Text style={styles.latestLabel}>{label}</Text>
      <Text style={styles.latestValue}>{value}</Text>
      {ageLabel && <Text style={styles.latestAge}>{ageLabel}</Text>}
    </View>
  );
}

function GrowthChart({ title, unit, data, color }: { title: string; unit: string; data: { label: string; value: number }[]; color: string }) {
  return (
    <Card style={{ marginBottom: spacing.lg }}>
      <Text style={styles.chartTitle}>{title}</Text>
      {data.length === 0 ? (
        <Text style={styles.noData}>No {title.toLowerCase()} data yet</Text>
      ) : (
        <LineChart data={data} color={color} unit={unit} />
      )}
    </Card>
  );
}

export default function GrowthScreen() {
  const items = useGrowthStore((s) => s.items);
  const add = useGrowthStore((s) => s.add);
  const update = useGrowthStore((s) => s.update);
  const remove = useGrowthStore((s) => s.remove);
  const weightUnit = useSettingsStore((s) => s.value.weightUnit);
  const heightUnit = useSettingsStore((s) => s.value.heightUnit);
  const profile = useBabyProfileStore((s) => s.value);

  const [sheetOpen, setSheetOpen] = useAutoOpenAdd();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [date, setDate] = useState(new Date());
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [headCirc, setHeadCirc] = useState('');
  const [notes, setNotes] = useState('');

  const sorted = useMemo(() => [...items].sort((a, b) => b.date.localeCompare(a.date)), [items]);
  const chronological = useMemo(() => [...items].sort((a, b) => a.date.localeCompare(b.date)), [items]);

  const weightData = chronological
    .filter((g) => g.weightKg != null)
    .map((g) => ({ label: formatShortDate(g.date), value: kgToUnit(g.weightKg!, weightUnit) }));
  const heightData = chronological
    .filter((g) => g.heightCm != null)
    .map((g) => ({ label: formatShortDate(g.date), value: cmToUnit(g.heightCm!, heightUnit) }));
  const headData = chronological
    .filter((g) => g.headCircumferenceCm != null)
    .map((g) => ({ label: formatShortDate(g.date), value: cmToUnit(g.headCircumferenceCm!, heightUnit) }));

  const latestWeight = sorted.find((g) => g.weightKg != null);
  const latestHeight = sorted.find((g) => g.heightCm != null);
  const latestHead = sorted.find((g) => g.headCircumferenceCm != null);
  const hasAnyLatest = !!(latestWeight || latestHeight || latestHead);

  const ageLabelFor = (measurementDate: string) => (profile ? ageAtDate(profile.dateOfBirth, measurementDate) : undefined);

  const resetForm = () => {
    setDate(new Date());
    setWeight('');
    setHeight('');
    setHeadCirc('');
    setNotes('');
    setEditingId(null);
  };

  const openAdd = () => {
    resetForm();
    setSheetOpen(true);
  };

  const openEdit = (item: GrowthRecord) => {
    setEditingId(item.id);
    setDate(new Date(item.date));
    setWeight(kgToDisplay(item.weightKg, weightUnit));
    setHeight(cmToDisplay(item.heightCm, heightUnit));
    setHeadCirc(cmToDisplay(item.headCircumferenceCm, heightUnit));
    setNotes(item.notes ?? '');
    setSheetOpen(true);
  };

  const save = () => {
    if (!weight.trim() && !height.trim() && !headCirc.trim()) {
      showToast('Add at least one measurement', 'alert-circle-outline');
      return;
    }

    let weightKg: number | undefined;
    if (weight.trim()) {
      const n = Number(weight);
      if (!Number.isFinite(n) || n <= 0) {
        showToast('Enter a valid weight', 'alert-circle-outline');
        return;
      }
      weightKg = weightToKg(n, weightUnit);
      if (weightKg > WEIGHT_MAX_KG) {
        showToast('That weight looks too high — please check the value', 'alert-circle-outline');
        return;
      }
    }

    let heightCmValue: number | undefined;
    if (height.trim()) {
      const n = Number(height);
      if (!Number.isFinite(n) || n <= 0) {
        showToast('Enter a valid height', 'alert-circle-outline');
        return;
      }
      heightCmValue = heightToCm(n, heightUnit);
      if (heightCmValue > HEIGHT_MAX_CM) {
        showToast('That height looks too high — please check the value', 'alert-circle-outline');
        return;
      }
    }

    let headCmValue: number | undefined;
    if (headCirc.trim()) {
      const n = Number(headCirc);
      if (!Number.isFinite(n) || n <= 0) {
        showToast('Enter a valid head circumference', 'alert-circle-outline');
        return;
      }
      headCmValue = heightToCm(n, heightUnit);
      if (headCmValue > HEAD_MAX_CM) {
        showToast('That head circumference looks too high — please check the value', 'alert-circle-outline');
        return;
      }
    }

    const now = nowIso();
    const payload = {
      date: date.toISOString().slice(0, 10),
      weightKg,
      heightCm: heightCmValue,
      headCircumferenceCm: headCmValue,
      notes: notes.trim() || undefined,
    };
    if (editingId) {
      update(editingId, { ...payload, updatedAt: now });
      showToast('Measurement updated', 'checkmark-circle');
    } else {
      add({ id: generateId(), ...payload, createdAt: now, updatedAt: now });
      showToast('Measurement saved', 'checkmark-circle');
    }
    setSheetOpen(false);
  };

  return (
    <Screen>
      <ModuleHeader illustration="growth" title="Growth" subtitle="Weight, height & head circumference" />

      {items.length === 0 ? (
        <EmptyState
          illustration="growth"
          title="No growth measurements yet"
          message="Add your baby's first weight or height to see trends over time."
          ctaLabel="Add measurement"
          onPressCta={openAdd}
        />
      ) : (
        <>
          {hasAnyLatest && (
            <View style={styles.latestRow}>
              {latestWeight && (
                <LatestMeasurementCard
                  icon="scale-outline"
                  label="Latest Weight"
                  value={formatWeight(latestWeight.weightKg, weightUnit)}
                  ageLabel={ageLabelFor(latestWeight.date)}
                />
              )}
              {latestHeight && (
                <LatestMeasurementCard
                  icon="resize-outline"
                  label="Latest Height"
                  value={formatHeight(latestHeight.heightCm, heightUnit)}
                  ageLabel={ageLabelFor(latestHeight.date)}
                />
              )}
              {latestHead && (
                <LatestMeasurementCard
                  icon="ellipse-outline"
                  label="Latest Head"
                  value={formatHeight(latestHead.headCircumferenceCm, heightUnit)}
                  ageLabel={ageLabelFor(latestHead.date)}
                />
              )}
            </View>
          )}
          <GrowthChart title="Weight" unit={` ${weightUnit}`} data={weightData} color={categoryColors.growth.accent} />
          <GrowthChart title="Height" unit={` ${heightUnit}`} data={heightData} color={categoryColors.milestone.accent} />
          <GrowthChart title="Head circumference" unit={` ${heightUnit}`} data={headData} color={categoryColors.family.accent} />
        </>
      )}

      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>History</Text>
        <Button label="Add" icon="add" size="sm" onPress={openAdd} />
      </View>

      {sorted.length > 0 && (
        <Card>
          {sorted.map((item) => (
            <RecordRow
              key={item.id}
              category="growth"
              icon="trending-up"
              title={formatDate(item.date)}
              subtitle={[
                item.weightKg != null ? formatWeight(item.weightKg, weightUnit) : undefined,
                item.heightCm != null ? formatHeight(item.heightCm, heightUnit) : undefined,
                item.headCircumferenceCm != null ? `${formatHeight(item.headCircumferenceCm, heightUnit)} head` : undefined,
              ]
                .filter(Boolean)
                .join(' · ')}
              time={ageLabelFor(item.date)}
              onPress={() => openEdit(item)}
              onDelete={() => setDeleteId(item.id)}
            />
          ))}
        </Card>
      )}

      <FormSheet visible={sheetOpen} title={editingId ? 'Edit measurement' : 'Add measurement'} onClose={() => setSheetOpen(false)} onSave={save}>
        <DateTimeField label="Date" value={date} onChange={setDate} mode="date" maximumDate={new Date()} />
        <FormField label={`Weight (${weightUnit})`} value={weight} onChangeText={setWeight} keyboardType="decimal-pad" optional />
        <FormField label={`Height (${heightUnit})`} value={height} onChangeText={setHeight} keyboardType="decimal-pad" optional />
        <FormField label={`Head circumference (${heightUnit})`} value={headCirc} onChangeText={setHeadCirc} keyboardType="decimal-pad" optional />
        <FormField label="Notes" value={notes} onChangeText={setNotes} multiline optional />
      </FormSheet>

      <ConfirmDialog
        visible={!!deleteId}
        title="Delete this measurement?"
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
  noData: {
    fontSize: fontSize.sm,
    color: palette.textFaint,
    textAlign: 'center',
    paddingVertical: spacing.xl,
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
  latestRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  latestCard: {
    flex: 1,
    backgroundColor: palette.white,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  latestIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  latestLabel: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: palette.textSecondary,
  },
  latestValue: {
    fontSize: fontSize.lg,
    fontWeight: '800',
    color: palette.text,
    marginTop: 1,
  },
  latestAge: {
    fontSize: fontSize.xs,
    color: palette.textFaint,
    marginTop: 2,
  },
});
