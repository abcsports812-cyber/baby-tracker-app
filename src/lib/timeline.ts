import { useMemo } from 'react';
import type { Ionicons } from '@expo/vector-icons';
import type { CategoryKey } from '../theme';
import {
  useActivityStore,
  useAppointmentStore,
  useBabyCareStore,
  useDiaperStore,
  useFeedingStore,
  useHealthRecordStore,
  useMemoryStore,
  useMilestoneStore,
  useSleepStore,
  useVaccinationStore,
} from '../store';
import { formatDuration, formatTime, isSameDay } from './date';
import { activityLabel, babyCareLabel } from './labels';

export interface TimelineEvent {
  id: string;
  category: CategoryKey;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  time: string; // ISO
}

export function useTimelineEvents(date: Date, sort: 'asc' | 'desc' = 'desc'): TimelineEvent[] {
  const feeding = useFeedingStore((s) => s.items);
  const diaper = useDiaperStore((s) => s.items);
  const sleep = useSleepStore((s) => s.items);
  const health = useHealthRecordStore((s) => s.items);
  const vaccinations = useVaccinationStore((s) => s.items);
  const appointments = useAppointmentStore((s) => s.items);
  const milestones = useMilestoneStore((s) => s.items);
  const babyCare = useBabyCareStore((s) => s.items);
  const activities = useActivityStore((s) => s.items);
  const memories = useMemoryStore((s) => s.items);

  return useMemo(() => {
    const events: TimelineEvent[] = [];

    feeding.filter((f) => isSameDay(f.startTime, date)).forEach((f) => {
      let title = 'Feeding';
      let subtitle: string | undefined;
      if (f.type === 'breast') {
        title = 'Breastfeeding';
        subtitle = [f.side ? `${f.side} side` : undefined, f.durationMin ? formatDuration(f.durationMin) : undefined]
          .filter(Boolean)
          .join(' · ');
      } else if (f.type === 'bottle') {
        title = 'Bottle';
        subtitle = [f.amountMl ? `${f.amountMl} ml` : undefined, f.milkType].filter(Boolean).join(' · ');
      } else {
        title = f.foodName || 'Solid food';
        subtitle = f.amount;
      }
      events.push({ id: f.id, category: 'feeding', icon: 'nutrition', title, subtitle, time: f.startTime });
    });

    diaper.filter((d) => isSameDay(d.time, date)).forEach((d) => {
      events.push({
        id: d.id,
        category: 'diaper',
        icon: 'water',
        title: d.type === 'both' ? 'Wet & dirty diaper' : d.type === 'wet' ? 'Wet diaper' : 'Dirty diaper',
        subtitle: d.notes,
        time: d.time,
      });
    });

    sleep.filter((s) => isSameDay(s.startTime, date)).forEach((s) => {
      const durationMin = s.endTime
        ? (new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) / 60000
        : undefined;
      events.push({
        id: s.id,
        category: 'sleep',
        icon: 'moon',
        title: s.kind === 'nap' ? 'Nap' : 'Night sleep',
        subtitle: durationMin ? formatDuration(durationMin) : 'In progress',
        time: s.startTime,
      });
    });

    health.filter((h) => isSameDay(h.date, date)).forEach((h) => {
      events.push({ id: h.id, category: 'health', icon: 'medkit', title: h.title, subtitle: h.notes, time: h.date });
    });

    vaccinations.filter((v) => isSameDay(v.date, date)).forEach((v) => {
      events.push({
        id: v.id,
        category: 'health',
        icon: 'shield-checkmark',
        title: `${v.vaccineName} vaccine`,
        subtitle: v.doseNotes,
        time: v.date,
      });
    });

    appointments.filter((a) => isSameDay(a.date, date)).forEach((a) => {
      events.push({
        id: a.id,
        category: 'appointment',
        icon: 'medical',
        title: a.title,
        subtitle: a.doctorOrClinic,
        time: a.time ? `${a.date}T${a.time}` : a.date,
      });
    });

    milestones.filter((m) => m.completed && m.dateAchieved && isSameDay(m.dateAchieved, date)).forEach((m) => {
      events.push({ id: m.id, category: 'milestone', icon: 'star', title: m.title, subtitle: 'Milestone achieved', time: m.dateAchieved! });
    });

    babyCare.filter((b) => isSameDay(b.dateTime, date)).forEach((b) => {
      events.push({
        id: b.id,
        category: 'bath',
        icon: 'sparkles',
        title: babyCareLabel(b.activity, b.customLabel),
        subtitle: b.notes,
        time: b.dateTime,
      });
    });

    activities.filter((a) => isSameDay(a.dateTime, date)).forEach((a) => {
      events.push({
        id: a.id,
        category: 'activity',
        icon: 'game-controller',
        title: activityLabel(a.kind, a.customLabel),
        subtitle: a.durationMin ? formatDuration(a.durationMin) : a.notes,
        time: a.dateTime,
      });
    });

    memories.filter((m) => isSameDay(m.date, date)).forEach((m) => {
      events.push({ id: m.id, category: 'memory', icon: 'images', title: m.title, subtitle: m.caption, time: m.date });
    });

    events.sort((a, b) => {
      const diff = new Date(a.time).getTime() - new Date(b.time).getTime();
      return sort === 'asc' ? diff : -diff;
    });

    return events;
  }, [feeding, diaper, sleep, health, vaccinations, appointments, milestones, babyCare, activities, memories, date, sort]);
}

export function eventTimeLabel(event: TimelineEvent): string {
  return formatTime(event.time);
}

export function useMonthEventCategories(monthDate: Date): Map<string, CategoryKey[]> {
  const feeding = useFeedingStore((s) => s.items);
  const diaper = useDiaperStore((s) => s.items);
  const sleep = useSleepStore((s) => s.items);
  const health = useHealthRecordStore((s) => s.items);
  const vaccinations = useVaccinationStore((s) => s.items);
  const appointments = useAppointmentStore((s) => s.items);
  const milestones = useMilestoneStore((s) => s.items);
  const babyCare = useBabyCareStore((s) => s.items);
  const activities = useActivityStore((s) => s.items);
  const memories = useMemoryStore((s) => s.items);

  return useMemo(() => {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const map = new Map<string, Set<CategoryKey>>();

    const mark = (isoDateTime: string, category: CategoryKey) => {
      const d = new Date(isoDateTime);
      if (d.getFullYear() !== year || d.getMonth() !== month) return;
      const key = String(d.getDate());
      if (!map.has(key)) map.set(key, new Set());
      map.get(key)!.add(category);
    };

    feeding.forEach((f) => mark(f.startTime, 'feeding'));
    diaper.forEach((d) => mark(d.time, 'diaper'));
    sleep.forEach((s) => mark(s.startTime, 'sleep'));
    health.forEach((h) => mark(h.date, 'health'));
    vaccinations.forEach((v) => mark(v.date, 'health'));
    appointments.forEach((a) => mark(a.date, 'appointment'));
    milestones.forEach((m) => m.completed && m.dateAchieved && mark(m.dateAchieved, 'milestone'));
    babyCare.forEach((b) => mark(b.dateTime, 'bath'));
    activities.forEach((a) => mark(a.dateTime, 'activity'));
    memories.forEach((m) => mark(m.date, 'memory'));

    const result = new Map<string, CategoryKey[]>();
    map.forEach((set, key) => result.set(key, Array.from(set)));
    return result;
  }, [feeding, diaper, sleep, health, vaccinations, appointments, milestones, babyCare, activities, memories, monthDate]);
}
