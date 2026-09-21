import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../src/components/ui/Screen';
import { Card } from '../../src/components/ui/Card';
import { RecordRow } from '../../src/components/ui/RecordRow';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { IllustrationBadge } from '../../src/components/ui/IllustrationBadge';
import { categoryColors, fontSize, palette, spacing } from '../../src/theme';
import { eventTimeLabel, useMonthEventCategories, useTimelineEvents } from '../../src/lib/timeline';
import { formatDate, isSameDay } from '../../src/lib/date';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function buildGrid(monthDate: Date): (Date | null)[] {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = firstDay.getDay();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export default function CalendarScreen() {
  const [monthDate, setMonthDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => new Date());

  const grid = useMemo(() => buildGrid(monthDate), [monthDate]);
  const eventDays = useMonthEventCategories(monthDate);
  const dayEvents = useTimelineEvents(selectedDate, 'asc');

  const changeMonth = (delta: number) => {
    setMonthDate((d) => new Date(d.getFullYear(), d.getMonth() + delta, 1));
  };

  return (
    <Screen>
      <View style={styles.header}>
        <IllustrationBadge name="calendar" size={56} />
        <View style={{ flex: 1, marginLeft: spacing.md }}>
          <Text style={styles.title}>Calendar</Text>
          <Text style={styles.subtitle}>Everything tracked, at a glance</Text>
        </View>
      </View>

      <Card>
        <View style={styles.monthRow}>
          <Pressable onPress={() => changeMonth(-1)} style={styles.navBtn} hitSlop={10}>
            <Ionicons name="chevron-back" size={18} color={palette.text} />
          </Pressable>
          <Text style={styles.monthLabel}>{monthDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</Text>
          <Pressable onPress={() => changeMonth(1)} style={styles.navBtn} hitSlop={10}>
            <Ionicons name="chevron-forward" size={18} color={palette.text} />
          </Pressable>
        </View>

        <View style={styles.weekRow}>
          {WEEKDAYS.map((w, i) => (
            <Text key={i} style={styles.weekday}>
              {w}
            </Text>
          ))}
        </View>

        <View style={styles.grid}>
          {grid.map((date, i) => {
            if (!date) return <View key={i} style={styles.cell} />;
            const categories = eventDays.get(String(date.getDate())) ?? [];
            const isSelected = isSameDay(date, selectedDate);
            const isToday = isSameDay(date, new Date());
            return (
              <Pressable key={i} style={styles.cell} onPress={() => setSelectedDate(date)}>
                <View style={[styles.dayCircle, isSelected && styles.dayCircleSelected, !isSelected && isToday && styles.dayCircleToday]}>
                  <Text style={[styles.dayNumber, isSelected && styles.dayNumberSelected]}>{date.getDate()}</Text>
                </View>
                <View style={styles.dotsRow}>
                  {categories.slice(0, 3).map((cat) => (
                    <View key={cat} style={[styles.dot, { backgroundColor: categoryColors[cat].accent }]} />
                  ))}
                </View>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Text style={styles.sectionTitle}>{formatDate(selectedDate)}</Text>

      {dayEvents.length === 0 ? (
        <EmptyState illustration="calendar" title="Nothing tracked this day" message="Events you log will show up here." />
      ) : (
        <Card>
          {dayEvents.map((event) => (
            <RecordRow
              key={`${event.category}-${event.id}`}
              category={event.category}
              icon={event.icon}
              title={event.title}
              subtitle={event.subtitle}
              time={eventTimeLabel(event)}
            />
          ))}
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
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  navBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: palette.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthLabel: {
    fontSize: fontSize.lg,
    fontWeight: '800',
    color: palette.text,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  weekday: {
    flex: 1,
    textAlign: 'center',
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: palette.textFaint,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: `${100 / 7}%`,
    alignItems: 'center',
    paddingVertical: 4,
  },
  dayCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleSelected: {
    backgroundColor: palette.primaryPink,
  },
  dayCircleToday: {
    borderWidth: 1.5,
    borderColor: palette.primaryPink,
  },
  dayNumber: {
    fontSize: fontSize.sm,
    color: palette.text,
    fontWeight: '600',
  },
  dayNumberSelected: {
    color: palette.white,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 3,
    height: 8,
    marginTop: 3,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '800',
    color: palette.text,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
});
