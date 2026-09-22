import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../src/components/ui/Screen';
import { Card } from '../../src/components/ui/Card';
import { IllustrationBadge } from '../../src/components/ui/IllustrationBadge';
import { BarChart } from '../../src/components/charts/BarChart';
import { LineChart } from '../../src/components/charts/LineChart';
import {
  useActivityStore,
  useDiaperStore,
  useFeedingStore,
  useGrowthStore,
  useMilestoneStore,
  useSleepStore,
  useToothStore,
} from '../../src/store';
import { last7Days, toISODate } from '../../src/lib/date';
import { TOOTH_CHART } from '../../src/lib/teeth';
import { categoryColors, fontSize, palette, spacing } from '../../src/theme';

function weekLabel(d: Date) {
  return d.toLocaleDateString(undefined, { weekday: 'narrow' });
}

export default function ReportsScreen() {
  const feeding = useFeedingStore((s) => s.items);
  const diaper = useDiaperStore((s) => s.items);
  const sleep = useSleepStore((s) => s.items);
  const growth = useGrowthStore((s) => s.items);
  const milestones = useMilestoneStore((s) => s.items);
  const activities = useActivityStore((s) => s.items);
  const teeth = useToothStore((s) => s.items);

  const days = useMemo(() => last7Days(), []);

  // Pumping sessions live in the Feeding store but aren't a baby-feeding
  // event, so this chart (and its "hasAnyData" check below) excludes them.
  const babyFeeding = useMemo(() => feeding.filter((f) => f.type !== 'pump'), [feeding]);

  const feedingWeek = days.map((d) => ({
    label: weekLabel(d),
    value: babyFeeding.filter((f) => toISODate(new Date(f.startTime)) === toISODate(d)).length,
  }));

  const diaperWet = days.map((d) => ({
    label: weekLabel(d),
    value: diaper.filter((x) => toISODate(new Date(x.time)) === toISODate(d) && (x.type === 'wet' || x.type === 'both')).length,
  }));
  const diaperDirty = days.map((d) => ({
    label: weekLabel(d),
    value: diaper.filter((x) => toISODate(new Date(x.time)) === toISODate(d) && (x.type === 'dirty' || x.type === 'both')).length,
  }));

  const sleepWeek = days.map((d) => {
    const minutes = sleep
      .filter((s) => s.endTime && toISODate(new Date(s.startTime)) === toISODate(d))
      .reduce((sum, s) => sum + (new Date(s.endTime!).getTime() - new Date(s.startTime).getTime()) / 60000, 0);
    return { label: weekLabel(d), value: Math.round((minutes / 60) * 10) / 10 };
  });

  const activityWeek = days.map((d) => ({
    label: weekLabel(d),
    value: activities.filter((a) => toISODate(new Date(a.dateTime)) === toISODate(d)).length,
  }));

  const weightData = useMemo(
    () =>
      [...growth]
        .filter((g) => g.weightKg != null)
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-8)
        .map((g) => ({ label: new Date(g.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), value: g.weightKg! })),
    [growth]
  );

  const completedMilestones = milestones.filter((m) => m.completed).length;
  const eruptedTeeth = teeth.filter((t) => t.status === 'erupted').length;

  const hasAnyData =
    babyFeeding.length || diaper.length || sleep.length || growth.length || activities.length || milestones.some((m) => m.completed) || teeth.length > 0;

  return (
    <Screen>
      <View style={styles.header}>
        <IllustrationBadge name="reports" size={56} />
        <View style={{ flex: 1, marginLeft: spacing.md }}>
          <Text style={styles.title}>Reports</Text>
          <Text style={styles.subtitle}>A gentle look at the week</Text>
        </View>
      </View>

      {!hasAnyData && (
        <Card>
          <Text style={styles.emptyText}>
            Once you start logging feeding, sleep, diapers and more, your weekly trends will appear here.
          </Text>
        </Card>
      )}

      {babyFeeding.length > 0 && (
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Feeding · daily count</Text>
          <BarChart data={feedingWeek} color={categoryColors.feeding.accent} height={120} />
        </Card>
      )}

      {diaper.length > 0 && (
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Diapers · wet</Text>
          <BarChart data={diaperWet} color={categoryColors.diaper.accent} height={100} />
          <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>Diapers · dirty</Text>
          <BarChart data={diaperDirty} color={categoryColors.activity.accent} height={100} />
        </Card>
      )}

      {sleep.length > 0 && (
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Sleep · hours per day</Text>
          <BarChart data={sleepWeek} color={categoryColors.sleep.accent} height={120} />
        </Card>
      )}

      {weightData.length > 0 && (
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Weight trend</Text>
          <LineChart data={weightData} color={categoryColors.growth.accent} unit=" kg" />
        </Card>
      )}

      {activities.length > 0 && (
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Activity frequency</Text>
          <BarChart data={activityWeek} color={categoryColors.activity.accent} height={100} />
        </Card>
      )}

      {milestones.some((m) => m.completed) && (
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Milestones</Text>
          <Text style={styles.milestoneCount}>{completedMilestones}</Text>
          <Text style={styles.milestoneLabel}>achieved so far</Text>
        </Card>
      )}

      {teeth.length > 0 && (
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Teeth</Text>
          <Text style={[styles.milestoneCount, { color: categoryColors.teeth.accent }]}>
            {eruptedTeeth} of {TOOTH_CHART.length}
          </Text>
          <Text style={styles.milestoneLabel}>teeth erupted</Text>
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: '800',
    color: palette.text,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: palette.textSecondary,
    marginTop: 2,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: palette.textSecondary,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: fontSize.md,
    color: palette.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
    paddingVertical: spacing.md,
  },
  milestoneCount: {
    fontSize: fontSize.xxxl,
    fontWeight: '800',
    color: categoryColors.milestone.accent,
    textAlign: 'center',
  },
  milestoneLabel: {
    fontSize: fontSize.sm,
    color: palette.textSecondary,
    textAlign: 'center',
  },
});
