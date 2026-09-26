import { useMemo } from 'react';
import {
  useActiveBabyIdStore,
  useActivityStore,
  useAppointmentStore,
  useBabyCareStore,
  useBabyProfileStore,
  useBabyProfilesStore,
  useDiaperStore,
  useFeedingStore,
  useGrowthStore,
  useHealthRecordStore,
  useLegacyDefaultBabyIdStore,
  useMemoryStore,
  useMilestoneStore,
  useNoteStore,
  useReminderStore,
  useSleepStore,
  useToothStore,
  useVaccinationStore,
} from '../store';
import type { BabyProfile } from '../types/models';

/** Any per-baby record: FeedingRecord, Milestone, ToothRecord, etc. */
export interface BabyScoped {
  babyId?: string;
}

/** Runs once, after all four stores below have hydrated (see useAppReady).
 * If useBabyProfileStore (the new collection) already has an entry, there
 * is nothing to do — either migration already ran, or the user already
 * has 2+ babies. Otherwise, if the legacy singleton holds a profile, it
 * is copied into the collection under its own existing id (no new id is
 * generated — the id a parent's records may already reference implicitly
 * stays stable) and made both the active and legacy-default baby. A truly
 * fresh install (legacy value null) is left for onboarding to handle. */
export function migrateBabyProfiles(): void {
  const profiles = useBabyProfilesStore.getState();
  if (profiles.items.length > 0) return;

  const legacy = useBabyProfileStore.getState().value;
  if (!legacy) return;

  profiles.add(legacy);
  useActiveBabyIdStore.getState().set(legacy.id);
  useLegacyDefaultBabyIdStore.getState().set(legacy.id);
}

export function useActiveBabyId(): string | null {
  return useActiveBabyIdStore((s) => s.value);
}

export function useLegacyDefaultBabyId(): string | null {
  return useLegacyDefaultBabyIdStore((s) => s.value);
}

/** The currently active baby's full profile, or null if none is active
 * yet (e.g. before onboarding/migration has run). */
export function useActiveBabyProfile(): BabyProfile | null {
  const profiles = useBabyProfilesStore((s) => s.items);
  const activeBabyId = useActiveBabyId();
  return useMemo(() => profiles.find((p) => p.id === activeBabyId) ?? null, [profiles, activeBabyId]);
}

/** True if `item` belongs to `activeBabyId`. A record with no babyId at
 * all (persisted before this feature existed) belongs to the active baby
 * only when that active baby IS the fixed legacy-default baby — never to
 * whichever baby simply happens to be active right now. This is what
 * keeps switching babies from ever reassigning old data to the wrong one. */
export function belongsToActiveBaby<T extends BabyScoped>(
  item: T,
  activeBabyId: string | null,
  legacyDefaultBabyId: string | null
): boolean {
  if (item.babyId != null) return item.babyId === activeBabyId;
  return activeBabyId != null && activeBabyId === legacyDefaultBabyId;
}

/** Filters a per-baby store's items down to the active baby only. The
 * single choke point every per-baby screen reads through — see Phase 3. */
export function useBabyScoped<T extends BabyScoped>(items: T[]): T[] {
  const activeBabyId = useActiveBabyId();
  const legacyDefaultBabyId = useLegacyDefaultBabyId();
  return useMemo(
    () => items.filter((item) => belongsToActiveBaby(item, activeBabyId, legacyDefaultBabyId)),
    [items, activeBabyId, legacyDefaultBabyId]
  );
}

/** Keeps the legacy singleton (useBabyProfileStore) mirroring whichever
 * baby is currently active. Every screen NOT yet migrated to
 * useActiveBabyProfile() (Growth, Guides, Home, More — untouched in
 * Phase 2/3) reads that singleton directly, so this is what makes
 * switching/editing/adding/deleting a baby show up there correctly
 * without modifying any of those screens. Call after any change to the
 * active baby's identity or to the active baby's own profile fields. */
export function syncLegacyProfileMirror(): void {
  const activeBabyId = useActiveBabyIdStore.getState().value;
  const profile = activeBabyId ? useBabyProfilesStore.getState().items.find((p) => p.id === activeBabyId) ?? null : null;
  useBabyProfileStore.getState().set(profile);
}

/** The one way to change which baby is active anywhere in the app —
 * switching, or right after a new baby is created. Never touches any
 * tracking record (Phase 2 makes no such changes). */
export function setActiveBaby(babyId: string | null): void {
  useActiveBabyIdStore.getState().set(babyId);
  syncLegacyProfileMirror();
}

/** Sets legacyDefaultBabyId only if it isn't already set — a defensive
 * guard for onboarding and "add baby" so the fallback-owner concept is
 * always well-defined once at least one baby exists, even in an edge
 * case where Phase 1's migration never ran (a true fresh install). */
export function ensureLegacyDefaultBaby(babyId: string): void {
  if (useLegacyDefaultBabyIdStore.getState().value == null) {
    useLegacyDefaultBabyIdStore.getState().set(babyId);
  }
}

/** Counts every existing tracking record, across every per-baby store,
 * that has no babyId yet — i.e. every record Phase 1's fallback rule
 * currently attributes to the legacy-default baby. Used only to decide
 * whether deleting that specific baby is safe (see Phase 2's deletion
 * guard) — reading these stores here does not modify or scope them;
 * that is Phase 3's job. */
export function useUnmigratedLegacyRecordCount(): number {
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
  const memories = useMemoryStore((s) => s.items);
  const notes = useNoteStore((s) => s.items);
  const teeth = useToothStore((s) => s.items);

  return useMemo(() => {
    const all: BabyScoped[][] = [
      feeding,
      diaper,
      sleep,
      growth,
      milestones,
      vaccinations,
      healthRecords,
      appointments,
      reminders,
      babyCare,
      activities,
      memories,
      notes,
      teeth,
    ];
    return all.reduce((sum, items) => sum + items.filter((item) => item.babyId == null).length, 0);
  }, [feeding, diaper, sleep, growth, milestones, vaccinations, healthRecords, appointments, reminders, babyCare, activities, memories, notes, teeth]);
}
