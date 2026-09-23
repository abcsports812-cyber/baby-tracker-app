import type { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import {
  useActivityStore,
  useAppointmentStore,
  useBabyCareStore,
  useBabyProfileStore,
  useCaregiverStore,
  useDiaperStore,
  useFeedingStore,
  useGrowthStore,
  useHealthRecordStore,
  useMemoryStore,
  useMilestoneStore,
  useNoteStore,
  useReminderStore,
  useSleepStore,
  useToothStore,
  useVaccinationStore,
} from '../store';
import { GUIDES, GUIDE_ACTIVITIES, getGuideCategoryById } from '../data/guides';
import {
  activityLabel,
  babyCareLabel,
  caregiverRelationshipLabel,
  healthRecordTypeLabel,
  journalCategoryLabel,
  milestoneCategoryLabel,
  noteCategoryLabel,
  reminderCategoryLabel,
  teethingSymptomLabel,
  toothStatusLabel,
} from './labels';
import { toothSlotLabel } from './teeth';
import type { CategoryKey } from '../theme';
import type { HealthRecordType } from '../types/models';

export type SearchGroup = 'journal' | 'tracking' | 'health' | 'appointments' | 'reminders' | 'milestones' | 'family' | 'guides';

export interface SearchResult {
  id: string;
  group: SearchGroup;
  category: CategoryKey;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  /** ISO date/datetime for sorting and display. Absent for static Guides
   * content, which has no user-entered date. */
  date?: string;
  route: string;
  haystack: string;
}

export const SEARCH_GROUP_LABEL: Record<SearchGroup, string> = {
  journal: 'Journal',
  tracking: 'Tracking',
  health: 'Health',
  appointments: 'Appointments',
  reminders: 'Reminders',
  milestones: 'Milestones',
  family: 'Family',
  guides: 'Guides',
};

const HEALTH_ICON: Record<HealthRecordType, keyof typeof Ionicons.glyphMap> = {
  doctorVisit: 'medical',
  symptom: 'thermometer',
  temperature: 'thermometer',
  medication: 'medkit',
  other: 'document-text',
};

function haystackOf(...parts: (string | undefined)[]): string {
  return parts.filter(Boolean).join(' ').toLowerCase();
}

/** Builds every searchable record, independent of any query — memoized
 * only on the underlying store data, not on keystrokes, so per-keystroke
 * filtering (see useSearchResults) is a cheap scan over an already
 * pre-synthesized, pre-lowercased array. */
export function useAllSearchResults(): SearchResult[] {
  const notes = useNoteStore((s) => s.items);
  const memories = useMemoryStore((s) => s.items);
  const feeding = useFeedingStore((s) => s.items);
  const diaper = useDiaperStore((s) => s.items);
  const sleep = useSleepStore((s) => s.items);
  const growth = useGrowthStore((s) => s.items);
  const milestones = useMilestoneStore((s) => s.items);
  const vaccinations = useVaccinationStore((s) => s.items);
  const healthRecords = useHealthRecordStore((s) => s.items);
  const appointments = useAppointmentStore((s) => s.items);
  const reminders = useReminderStore((s) => s.items);
  const babyCare = useBabyCareStore((s) => s.items);
  const activities = useActivityStore((s) => s.items);
  const caregivers = useCaregiverStore((s) => s.items);
  const teeth = useToothStore((s) => s.items);
  const profile = useBabyProfileStore((s) => s.value);

  return useMemo(() => {
    const results: SearchResult[] = [];

    for (const n of notes) {
      // A legacy NoteCategory value (pre-dating the Journal system) has no
      // journalCategoryLabel entry — noteCategoryLabel covers every value
      // including those, so this can never look up undefined.
      const categoryLabel = noteCategoryLabel[n.category];
      results.push({
        id: `note-${n.id}`,
        group: 'journal',
        category: 'note',
        icon: 'document-text',
        title: n.title || 'Untitled note',
        subtitle: n.body,
        date: n.date,
        route: `/journal/note/${n.id}`,
        haystack: haystackOf(n.title, n.body, categoryLabel),
      });
    }

    for (const m of memories) {
      const categoryLabel = m.category ? journalCategoryLabel[m.category] : undefined;
      results.push({
        id: `memory-${m.id}`,
        group: 'journal',
        category: 'memory',
        icon: 'images',
        title: m.title || 'Untitled memory',
        subtitle: m.caption,
        date: m.date,
        route: `/journal/memory/${m.id}`,
        haystack: haystackOf(m.title, m.caption, categoryLabel),
      });
    }

    for (const f of feeding) {
      if (f.type === 'pump') {
        const title = f.durationMin == null ? 'Pumping (in progress)' : 'Pumping session';
        const subtitle = [f.side ? `${f.side[0].toUpperCase()}${f.side.slice(1)} side` : undefined, f.amountMl != null ? `${f.amountMl} ml` : undefined, f.notes]
          .filter(Boolean)
          .join(' · ');
        results.push({
          id: `feeding-${f.id}`,
          group: 'tracking',
          category: 'feeding',
          icon: 'timer-outline',
          title,
          subtitle: subtitle || undefined,
          date: f.startTime,
          route: '/pumping',
          haystack: haystackOf(title, f.notes, f.side),
        });
        continue;
      }
      let title = 'Feeding';
      if (f.type === 'breast') title = 'Breastfeeding';
      else if (f.type === 'bottle') title = 'Bottle feeding';
      else if (f.type === 'solid') title = f.foodName || 'Solid food';
      const subtitle = [f.milkType, f.reaction, f.notes].filter(Boolean).join(' · ');
      results.push({
        id: `feeding-${f.id}`,
        group: 'tracking',
        category: 'feeding',
        icon: 'nutrition',
        title,
        subtitle: subtitle || undefined,
        date: f.startTime,
        route: '/feeding',
        haystack: haystackOf(title, f.foodName, f.milkType, f.reaction, f.notes),
      });
    }

    for (const d of diaper) {
      const title = d.type === 'both' ? 'Wet & dirty diaper' : d.type === 'wet' ? 'Wet diaper' : 'Dirty diaper';
      results.push({
        id: `diaper-${d.id}`,
        group: 'tracking',
        category: 'diaper',
        icon: 'water',
        title,
        subtitle: d.notes,
        date: d.time,
        route: '/diaper',
        haystack: haystackOf(title, d.notes),
      });
    }

    for (const s of sleep) {
      const title = s.kind === 'nap' ? 'Nap' : 'Night sleep';
      results.push({
        id: `sleep-${s.id}`,
        group: 'tracking',
        category: 'sleep',
        icon: 'moon',
        title,
        subtitle: s.notes,
        date: s.startTime,
        route: '/sleep',
        haystack: haystackOf(title, s.notes),
      });
    }

    for (const g of growth) {
      // Growth is primarily numeric — no title is synthesized from the
      // measurements themselves, only a generic, always-useful title, with
      // the actual searchable content limited to any notes the parent added.
      results.push({
        id: `growth-${g.id}`,
        group: 'tracking',
        category: 'growth',
        icon: 'trending-up',
        title: 'Growth measurement',
        subtitle: g.notes,
        date: g.date,
        route: '/growth',
        haystack: haystackOf('Growth measurement', g.notes),
      });
    }

    for (const m of milestones) {
      const categoryLabel = milestoneCategoryLabel[m.category];
      results.push({
        id: `milestone-${m.id}`,
        group: 'milestones',
        category: 'milestone',
        icon: 'star',
        title: m.title,
        subtitle: [categoryLabel, m.notes].filter(Boolean).join(' · '),
        date: m.dateAchieved ?? m.updatedAt,
        route: '/milestones',
        haystack: haystackOf(m.title, m.notes, categoryLabel, m.completed ? 'achieved' : undefined),
      });
    }

    for (const v of vaccinations) {
      const subtitle = [v.doseNumber, v.doseNotes].filter(Boolean).join(' · ');
      results.push({
        id: `vaccination-${v.id}`,
        group: 'health',
        category: 'health',
        icon: 'shield-checkmark',
        title: v.vaccineName,
        subtitle: subtitle || undefined,
        date: v.date,
        route: '/health',
        haystack: haystackOf(v.vaccineName, v.doseNumber, v.doseNotes, 'vaccine', 'vaccination'),
      });
    }

    for (const h of healthRecords) {
      const typeLabel = healthRecordTypeLabel[h.type];
      results.push({
        id: `health-${h.id}`,
        group: 'health',
        category: 'health',
        icon: HEALTH_ICON[h.type],
        title: h.title,
        subtitle: h.notes,
        date: h.date,
        route: '/health',
        haystack: haystackOf(h.title, h.notes, typeLabel),
      });
    }

    for (const t of teeth) {
      const title = toothSlotLabel(t);
      const statusLabel = toothStatusLabel[t.status];
      const symptomLabels = t.symptoms?.map((s) => teethingSymptomLabel[s]).join(' ');
      results.push({
        id: `tooth-${t.id}`,
        group: 'health',
        category: 'teeth',
        icon: 'happy-outline',
        title,
        subtitle: [statusLabel, t.notes].filter(Boolean).join(' · '),
        date: t.eruptionDate ?? t.lossDate ?? t.updatedAt,
        route: '/teeth',
        haystack: haystackOf(title, statusLabel, t.notes, symptomLabels, 'tooth', 'teeth', 'teething'),
      });
    }

    for (const a of appointments) {
      const subtitle = [a.doctorOrClinic, a.notes].filter(Boolean).join(' · ');
      results.push({
        id: `appointment-${a.id}`,
        group: 'appointments',
        category: 'appointment',
        icon: 'medical',
        title: a.title,
        subtitle: subtitle || undefined,
        date: a.time ? `${a.date}T${a.time}` : a.date,
        route: '/appointments',
        haystack: haystackOf(a.title, a.doctorOrClinic, a.notes, 'appointment'),
      });
    }

    for (const r of reminders) {
      const categoryLabel = reminderCategoryLabel[r.category];
      results.push({
        id: `reminder-${r.id}`,
        group: 'reminders',
        category: 'reminder',
        icon: 'alarm',
        title: r.title,
        subtitle: categoryLabel,
        date: r.dateTime,
        route: '/reminders',
        haystack: haystackOf(r.title, categoryLabel, 'reminder'),
      });
    }

    for (const b of babyCare) {
      const title = babyCareLabel(b.activity, b.customLabel);
      results.push({
        id: `babycare-${b.id}`,
        group: 'tracking',
        category: 'bath',
        icon: 'sparkles',
        title,
        subtitle: b.notes,
        date: b.dateTime,
        route: '/babycare',
        haystack: haystackOf(title, b.notes),
      });
    }

    for (const a of activities) {
      const title = activityLabel(a.kind, a.customLabel);
      results.push({
        id: `activity-${a.id}`,
        group: 'tracking',
        category: 'activity',
        icon: 'game-controller',
        title,
        subtitle: a.notes,
        date: a.dateTime,
        route: '/activities',
        haystack: haystackOf(title, a.notes),
      });
    }

    for (const c of caregivers) {
      const relationshipLabel = caregiverRelationshipLabel[c.relationship];
      results.push({
        id: `caregiver-${c.id}`,
        group: 'family',
        category: 'family',
        icon: 'people',
        title: c.name,
        subtitle: relationshipLabel,
        date: c.createdAt,
        route: '/family',
        haystack: haystackOf(c.name, relationshipLabel),
      });
    }

    if (profile) {
      results.push({
        id: `profile-${profile.id}`,
        group: 'family',
        category: 'family',
        icon: 'happy',
        title: profile.name,
        subtitle: profile.notes || 'Baby profile',
        date: profile.dateOfBirth,
        route: '/profile',
        haystack: haystackOf(profile.name, profile.notes, profile.bloodType, 'baby profile'),
      });
    }

    for (const g of GUIDES) {
      results.push({
        id: `guide-${g.id}`,
        group: 'guides',
        category: getGuideCategoryById(g.category).colorKey,
        icon: 'book-outline',
        title: g.title,
        subtitle: g.summary,
        route: `/guides/${g.id}`,
        haystack: haystackOf(g.title, g.summary, g.intro),
      });
    }

    for (const a of GUIDE_ACTIVITIES) {
      results.push({
        id: `guideactivity-${a.id}`,
        group: 'guides',
        category: 'activity',
        icon: 'extension-puzzle-outline',
        title: a.title,
        subtitle: a.shortDescription,
        route: `/guides/activity/${a.id}`,
        haystack: haystackOf(a.title, a.shortDescription),
      });
    }

    return results;
  }, [notes, memories, feeding, diaper, sleep, growth, milestones, vaccinations, healthRecords, appointments, reminders, babyCare, activities, caregivers, teeth, profile]);
}

function tokenize(query: string): string[] {
  return query.trim().toLowerCase().split(/\s+/).filter(Boolean);
}

/** Case-insensitive, whitespace-tokenized, AND-matched substring search —
 * every token must appear somewhere in a result's haystack, in any order.
 * No fuzzy matching, no ranking beyond per-group recency. */
export function useSearchResults(query: string, group: SearchGroup | 'all'): Record<SearchGroup, SearchResult[]> {
  const all = useAllSearchResults();

  return useMemo(() => {
    const tokens = tokenize(query);
    const matches = all.filter((r) => {
      if (group !== 'all' && r.group !== group) return false;
      if (tokens.length === 0) return false;
      return tokens.every((t) => r.haystack.includes(t));
    });

    const grouped: Record<SearchGroup, SearchResult[]> = {
      journal: [],
      tracking: [],
      health: [],
      appointments: [],
      reminders: [],
      milestones: [],
      family: [],
      guides: [],
    };
    for (const r of matches) grouped[r.group].push(r);
    for (const key of Object.keys(grouped) as SearchGroup[]) {
      grouped[key].sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));
    }
    return grouped;
  }, [all, query, group]);
}
