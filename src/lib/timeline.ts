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
  useNoteStore,
  useSleepStore,
  useToothStore,
  useVaccinationStore,
} from '../store';
import { useBabyScoped } from './babyScope';
import { formatDuration, formatTime, isSameDay } from './date';
import { activityLabel, babyCareLabel } from './labels';
import { toothSlotLabel } from './teeth';

export interface TimelineEvent {
  id: string;
  category: CategoryKey;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  time: string; // ISO
  /** Where tapping this event in Home's timeline should navigate. Points
   * either at a per-id detail screen (journal entries) or at the
   * record's own tracker screen with `?openId=<id>`, which that screen's
   * useAutoOpenEdit hook picks up to open the matching record's existing
   * edit sheet -- never a generic shared screen, and never a different
   * record than the one actually tapped. */
  href: string;
}

export function useTimelineEvents(date: Date, sort: 'asc' | 'desc' = 'desc'): TimelineEvent[] {
  const feeding = useBabyScoped(useFeedingStore((s) => s.items));
  const diaper = useBabyScoped(useDiaperStore((s) => s.items));
  const sleep = useBabyScoped(useSleepStore((s) => s.items));
  const health = useBabyScoped(useHealthRecordStore((s) => s.items));
  const vaccinations = useBabyScoped(useVaccinationStore((s) => s.items));
  const appointments = useBabyScoped(useAppointmentStore((s) => s.items));
  const milestones = useBabyScoped(useMilestoneStore((s) => s.items));
  const babyCare = useBabyScoped(useBabyCareStore((s) => s.items));
  const activities = useBabyScoped(useActivityStore((s) => s.items));
  const memories = useBabyScoped(useMemoryStore((s) => s.items));
  const notes = useBabyScoped(useNoteStore((s) => s.items));
  const teeth = useBabyScoped(useToothStore((s) => s.items));

  return useMemo(() => {
    const events: TimelineEvent[] = [];

    feeding.filter((f) => isSameDay(f.startTime, date)).forEach((f) => {
      let title = 'Feeding';
      let subtitle: string | undefined;
      let icon: TimelineEvent['icon'] = 'nutrition';
      if (f.type === 'breast') {
        title = 'Breastfeeding';
        subtitle = [f.side ? `${f.side} side` : undefined, f.durationMin ? formatDuration(f.durationMin) : undefined]
          .filter(Boolean)
          .join(' · ');
      } else if (f.type === 'bottle') {
        title = 'Bottle';
        subtitle = [f.amountMl ? `${f.amountMl} ml` : undefined, f.milkType].filter(Boolean).join(' · ');
      } else if (f.type === 'pump') {
        // A pump session is expressed milk, not a baby-feeding event —
        // labeled distinctly so it's never mistaken for one in the timeline.
        icon = 'timer-outline';
        if (f.durationMin == null) {
          title = 'Pumping (in progress)';
        } else {
          title = 'Pumping session';
          subtitle = [f.side ? f.side[0].toUpperCase() + f.side.slice(1) : undefined, f.amountMl != null ? `${f.amountMl} ml` : undefined, formatDuration(f.durationMin)]
            .filter(Boolean)
            .join(' · ');
        }
      } else {
        title = f.foodName || 'Solid food';
        subtitle = f.amount;
      }
      events.push({ id: f.id, category: 'feeding', icon, title, subtitle, time: f.startTime, href: f.type === 'pump' ? `/pumping?openId=${f.id}` : `/feeding?openId=${f.id}` });
    });

    diaper.filter((d) => isSameDay(d.time, date)).forEach((d) => {
      events.push({
        id: d.id,
        category: 'diaper',
        icon: 'water',
        title: d.type === 'both' ? 'Wet & dirty diaper' : d.type === 'wet' ? 'Wet diaper' : 'Dirty diaper',
        subtitle: d.notes,
        time: d.time,
        href: `/diaper?openId=${d.id}`,
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
        href: `/sleep?openId=${s.id}`,
      });
    });

    health.filter((h) => isSameDay(h.date, date)).forEach((h) => {
      events.push({ id: h.id, category: 'health', icon: 'medkit', title: h.title, subtitle: h.notes, time: h.date, href: `/health?openId=${h.id}` });
    });

    vaccinations.filter((v) => isSameDay(v.date, date)).forEach((v) => {
      events.push({
        id: v.id,
        category: 'health',
        icon: 'shield-checkmark',
        title: `${v.vaccineName} vaccine`,
        subtitle: v.doseNotes,
        time: v.date,
        href: `/health?openId=${v.id}`,
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
        href: `/appointments?openId=${a.id}`,
      });
    });

    milestones.filter((m) => m.completed && m.dateAchieved && isSameDay(m.dateAchieved, date)).forEach((m) => {
      events.push({ id: m.id, category: 'milestone', icon: 'star', title: m.title, subtitle: 'Milestone achieved', time: m.dateAchieved!, href: `/milestones?openId=${m.id}` });
    });

    babyCare.filter((b) => isSameDay(b.dateTime, date)).forEach((b) => {
      events.push({
        id: b.id,
        category: 'bath',
        icon: 'sparkles',
        title: babyCareLabel(b.activity, b.customLabel),
        subtitle: b.notes,
        time: b.dateTime,
        href: `/babycare?openId=${b.id}`,
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
        href: `/activities?openId=${a.id}`,
      });
    });

    memories.filter((m) => isSameDay(m.date, date)).forEach((m) => {
      events.push({ id: m.id, category: 'memory', icon: 'images', title: m.title, subtitle: m.caption, time: m.date, href: `/journal/memory/${m.id}` });
    });

    notes.filter((n) => isSameDay(n.date, date)).forEach((n) => {
      events.push({ id: n.id, category: 'note', icon: 'document-text', title: n.title, subtitle: n.body, time: n.date, href: `/journal/note/${n.id}` });
    });

    teeth.forEach((t) => {
      if (t.eruptionDate && isSameDay(t.eruptionDate, date)) {
        const isEmerging = t.status === 'emerging';
        events.push({
          id: `${t.id}-erupted`,
          category: 'teeth',
          icon: 'happy-outline',
          title: `${toothSlotLabel(t)} ${isEmerging ? 'is emerging' : 'erupted'}`,
          subtitle: isEmerging ? 'Emerging' : 'Erupted',
          time: t.eruptionDate,
          href: `/teeth?openId=${t.id}`,
        });
      }
      if (t.lossDate && isSameDay(t.lossDate, date)) {
        events.push({
          id: `${t.id}-lost`,
          category: 'teeth',
          icon: 'happy-outline',
          title: `${toothSlotLabel(t)} lost`,
          subtitle: 'Tooth lost',
          time: t.lossDate,
          href: `/teeth?openId=${t.id}`,
        });
      }
    });

    events.sort((a, b) => {
      const diff = new Date(a.time).getTime() - new Date(b.time).getTime();
      return sort === 'asc' ? diff : -diff;
    });

    return events;
  }, [feeding, diaper, sleep, health, vaccinations, appointments, milestones, babyCare, activities, memories, notes, teeth, date, sort]);
}

export function eventTimeLabel(event: TimelineEvent): string {
  return formatTime(event.time);
}

export function useMonthEventCategories(monthDate: Date): Map<string, CategoryKey[]> {
  const feeding = useBabyScoped(useFeedingStore((s) => s.items));
  const diaper = useBabyScoped(useDiaperStore((s) => s.items));
  const sleep = useBabyScoped(useSleepStore((s) => s.items));
  const health = useBabyScoped(useHealthRecordStore((s) => s.items));
  const vaccinations = useBabyScoped(useVaccinationStore((s) => s.items));
  const appointments = useBabyScoped(useAppointmentStore((s) => s.items));
  const milestones = useBabyScoped(useMilestoneStore((s) => s.items));
  const babyCare = useBabyScoped(useBabyCareStore((s) => s.items));
  const activities = useBabyScoped(useActivityStore((s) => s.items));
  const memories = useBabyScoped(useMemoryStore((s) => s.items));
  const notes = useBabyScoped(useNoteStore((s) => s.items));
  const teeth = useBabyScoped(useToothStore((s) => s.items));

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
    notes.forEach((n) => mark(n.date, 'note'));
    teeth.forEach((t) => {
      if (t.eruptionDate) mark(t.eruptionDate, 'teeth');
      if (t.lossDate) mark(t.lossDate, 'teeth');
    });

    const result = new Map<string, CategoryKey[]>();
    map.forEach((set, key) => result.set(key, Array.from(set)));
    return result;
  }, [feeding, diaper, sleep, health, vaccinations, appointments, milestones, babyCare, activities, memories, notes, teeth, monthDate]);
}
