import { router } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Screen } from '../../src/components/ui/Screen';
import { BabyHeader } from '../../src/components/home/BabyHeader';
import { SectionHeader } from '../../src/components/ui/SectionHeader';
import { StatCard } from '../../src/components/ui/StatCard';
import { QuickActionButton } from '../../src/components/ui/QuickActionButton';
import { RecordRow } from '../../src/components/ui/RecordRow';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { useBabyProfileStore, useDiaperStore, useFeedingStore, useGrowthStore, useMilestoneStore, useSettingsStore, useSleepStore } from '../../src/store';
import { palette, spacing } from '../../src/theme';
import { formatDate, formatDuration, formatTime, isSameDay } from '../../src/lib/date';
import { formatWeight } from '../../src/lib/units';
import { eventTimeLabel, useTimelineEvents } from '../../src/lib/timeline';

export default function HomeScreen() {
  const profile = useBabyProfileStore((s) => s.value);
  const weightUnit = useSettingsStore((s) => s.value.weightUnit);
  const feeding = useFeedingStore((s) => s.items);
  const diaper = useDiaperStore((s) => s.items);
  const sleep = useSleepStore((s) => s.items);
  const growth = useGrowthStore((s) => s.items);
  const milestones = useMilestoneStore((s) => s.items);

  const today = useMemo(() => new Date(), []);
  const timeline = useTimelineEvents(today, 'desc');

  // Pumping sessions live in the Feeding store but aren't a baby-feeding
  // event, so the Feeding stat card excludes them (see app/pumping).
  const babyFeeding = useMemo(() => feeding.filter((f) => f.type !== 'pump'), [feeding]);
  const feedingToday = babyFeeding.filter((f) => isSameDay(f.startTime, today));
  const diaperToday = diaper.filter((d) => isSameDay(d.time, today));
  const sleepToday = sleep.filter((s) => isSameDay(s.startTime, today));
  const lastGrowth = [...growth].sort((a, b) => b.date.localeCompare(a.date))[0];
  const completedMilestones = milestones.filter((m) => m.completed).length;

  const sleepMinutesToday = sleepToday.reduce((sum, s) => {
    if (!s.endTime) return sum;
    return sum + (new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) / 60000;
  }, 0);

  const lastFeeding = [...babyFeeding].sort((a, b) => b.startTime.localeCompare(a.startTime))[0];
  const lastDiaper = [...diaper].sort((a, b) => b.time.localeCompare(a.time))[0];

  if (!profile) {
    return (
      <Screen>
        <EmptyState
          illustration="babyProfile"
          title="Let's set up your baby"
          message="Add your baby's profile to start tracking their journey."
          ctaLabel="Set up profile"
          onPressCta={() => router.push('/profile/edit')}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <BabyHeader profile={profile} />

      <SectionHeader title="Today's overview" />
      <View style={styles.grid}>
        <StatCard
          category="feeding"
          icon="nutrition"
          title="Feeding"
          value={`${feedingToday.length} today`}
          subtitle={lastFeeding ? `Last · ${formatTime(lastFeeding.startTime)}` : 'No entries yet'}
          onPress={() => router.push('/feeding')}
          onPressAdd={() => router.push('/feeding?add=1')}
        />
        <StatCard
          category="diaper"
          icon="water"
          title="Diapers"
          value={`${diaperToday.length} today`}
          subtitle={lastDiaper ? `Last · ${formatTime(lastDiaper.time)}` : 'No entries yet'}
          onPress={() => router.push('/diaper')}
          onPressAdd={() => router.push('/diaper?add=1')}
        />
        <StatCard
          category="sleep"
          icon="moon"
          title="Sleep"
          value={sleepMinutesToday > 0 ? formatDuration(sleepMinutesToday) : '0m'}
          subtitle={`${sleepToday.length} session${sleepToday.length === 1 ? '' : 's'} today`}
          onPress={() => router.push('/sleep')}
          onPressAdd={() => router.push('/sleep?add=1')}
        />
        <StatCard
          category="growth"
          icon="trending-up"
          title="Growth"
          value={lastGrowth?.weightKg != null ? formatWeight(lastGrowth.weightKg, weightUnit) : 'No data'}
          subtitle={lastGrowth ? `As of ${formatDate(lastGrowth.date)}` : 'Add first measurement'}
          onPress={() => router.push('/growth')}
          onPressAdd={() => router.push('/growth?add=1')}
        />
        <StatCard
          category="milestone"
          icon="star"
          title="Milestones"
          value={`${completedMilestones} achieved`}
          subtitle="Tap to view all"
          onPress={() => router.push('/milestones')}
        />
      </View>

      <SectionHeader title="Quick actions" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.xl }}>
        <View style={styles.quickRow}>
          <QuickActionButton category="feeding" icon="nutrition" label="Feeding" onPress={() => router.push('/feeding?add=1')} />
          <QuickActionButton category="feeding" icon="timer-outline" label="Pumping" onPress={() => router.push('/pumping')} />
          <QuickActionButton category="diaper" icon="water" label="Diaper" onPress={() => router.push('/diaper?add=1')} />
          <QuickActionButton category="sleep" icon="moon" label="Sleep" onPress={() => router.push('/sleep?add=1')} />
          <QuickActionButton category="sound" icon="headset" label="Sounds" onPress={() => router.push('/sounds')} />
          <QuickActionButton category="growth" icon="book" label="Guides" onPress={() => router.push('/guides')} />
          <QuickActionButton category="growth" icon="trending-up" label="Growth" onPress={() => router.push('/growth?add=1')} />
          <QuickActionButton category="milestone" icon="star" label="Milestone" onPress={() => router.push('/milestones?add=1')} />
          <QuickActionButton category="memory" icon="images" label="Journal" onPress={() => router.push('/journal')} />
          <QuickActionButton category="teeth" icon="happy-outline" label="Teeth" onPress={() => router.push('/teeth')} />
        </View>
      </ScrollView>

      <SectionHeader title="Today's timeline" />
      {timeline.length === 0 ? (
        <EmptyState
          illustration="home"
          title="Nothing tracked yet today"
          message="Use quick actions above to log your baby's first moment of the day."
        />
      ) : (
        <View style={styles.timelineCard}>
          {timeline.map((event) => (
            <RecordRow
              key={`${event.category}-${event.id}`}
              category={event.category}
              icon={event.icon}
              title={event.title}
              subtitle={event.subtitle}
              time={eventTimeLabel(event)}
            />
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  quickRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    paddingRight: spacing.xl,
  },
  timelineCard: {
    backgroundColor: palette.white,
    borderRadius: 22,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
});
