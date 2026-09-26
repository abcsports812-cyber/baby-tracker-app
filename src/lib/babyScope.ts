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
import { generateId, nowIso } from './id';
import { DEFAULT_MILESTONES } from './seed';
import type { BabyProfile, ToothRecord } from '../types/models';

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
 * switching, or right after a new baby is created. Also ensures the newly
 * active baby has its own default milestones (Phase 3D) — see
 * ensureMilestonesSeededForBaby, a guarded no-op for the legacy-default
 * baby and for any baby that already has its own milestones. */
export function setActiveBaby(babyId: string | null): void {
  useActiveBabyIdStore.getState().set(babyId);
  syncLegacyProfileMirror();
  if (babyId) ensureMilestonesSeededForBaby(babyId);
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

// ---------------------------------------------------------------------------
// Phase 3A — shared scoping infrastructure + write-safety helpers.
// Nothing below this point is called by any screen yet — these are the
// building blocks later Phase 3 checkpoints wire in one module at a time.
// No existing record is ever rewritten or renamed by anything here.
// ---------------------------------------------------------------------------

/** Stamps `babyId` (the current active baby) onto a new record's payload
 * without mutating the caller's object — used at every per-baby `add()`
 * call site once its screen is migrated (Phase 3B+). Throws rather than
 * silently creating an orphaned record if there is somehow no active baby,
 * which should be structurally unreachable once onboarding has run. */
export function stampActiveBaby<T extends object>(payload: T): T & { babyId: string } {
  const babyId = useActiveBabyIdStore.getState().value;
  if (!babyId) {
    throw new Error('stampActiveBaby: no active baby — cannot create a per-baby record.');
  }
  return { ...payload, babyId };
}

/** Returns `title` unchanged when there is 0 or 1 baby, preserving today's
 * exact notification text for every current single-baby user. Once 2+
 * babies exist, prefixes the active baby's name so a scheduled
 * notification (Reminders/Appointments/Health, wired in a later
 * checkpoint) can never read as ambiguous between babies. Does not touch
 * src/lib/notifications.ts — callers pass the already-prefixed title into
 * scheduleReminderNotification() exactly as they do today. */
export function withBabyPrefix(title: string): string {
  const profiles = useBabyProfilesStore.getState().items;
  if (profiles.length < 2) return title;
  const activeBabyId = useActiveBabyIdStore.getState().value;
  const active = activeBabyId ? profiles.find((p) => p.id === activeBabyId) : undefined;
  if (!active) return title;
  return `${active.name}: ${title}`;
}

/** The id a NEW per-baby touch of tooth slot `slotId` gets. ToothRecord.id
 * is a fixed 20-value slot string pre-Phase-3 (e.g.
 * "upperLeft-centralIncisor"), not a generated id, so two babies touching
 * the same slot would collide if both used the bare slot id. This
 * composite id is only for records a baby is touching for the first
 * time — see findToothRecordForBabySlot, which always prefers an
 * existing record's own (possibly bare, legacy) id over this. */
export function toothCompositeId(babyId: string, slotId: string): string {
  return `${babyId}-${slotId}`;
}

/** Finds the record (if any) that `babyId` already owns for tooth slot
 * `slotId` — whatever its stored id looks like: a legacy bare slot id
 * (only possible when `babyId` is the legacy-default baby, exactly like
 * every other per-baby store's undefined-babyId fallback) or a composite
 * id from a previous per-baby touch. The slot is always derived from the
 * record's own `position`/`type` fields, never assumed from `.id` — the
 * Teeth screen's own slot-to-record map (a later checkpoint) must do the
 * same, since `.id` is no longer reliably the slot id once composite ids
 * exist. Returns undefined when this baby has never touched this slot;
 * the Teeth checkpoint uses that to choose between `update(existing.id,
 * ...)` (never renaming an existing record, bare-id legacy ones
 * included) and creating a new one with `toothCompositeId(babyId,
 * slotId)`. This function itself never writes anything. */
export function findToothRecordForBabySlot(
  items: ToothRecord[],
  babyId: string,
  slotId: string,
  legacyDefaultBabyId: string | null
): ToothRecord | undefined {
  return items.find((item) => {
    if (`${item.position}-${item.type}` !== slotId) return false;
    if (item.babyId != null) return item.babyId === babyId;
    return babyId === legacyDefaultBabyId;
  });
}

// ---------------------------------------------------------------------------
// Phase 3D — per-baby milestone seeding.
// ---------------------------------------------------------------------------

/** Gives `babyId` its own set of the 14 default milestones the first time
 * it becomes active, without ever touching the legacy-default baby's
 * existing (babyId-undefined) defaults — those remain owned entirely by
 * seedDefaultMilestones() (src/lib/seed.ts, unchanged since before Phase
 * 3) and are never duplicated or rewritten here.
 *
 * Deliberately a no-op whenever `babyId` is the legacy-default baby, or
 * legacyDefaultBabyId isn't resolved yet — the latter covers the brief
 * window during first-ever onboarding where setActiveBaby() fires for the
 * very first baby before ensureLegacyDefaultBaby() has run; skipping here
 * is always correct in that window, since a first baby's milestones are
 * already handled by the original boot-time seeding.
 *
 * Also a no-op if `babyId` already owns any milestone (its own seeded set
 * from a previous switch, or a custom one it created) — this is what
 * keeps repeated switches and reloads from ever duplicating the set. Uses
 * `add()` per item rather than `setAll()` so every other baby's existing
 * milestones (legacy-default's included) are left completely untouched. */
export function ensureMilestonesSeededForBaby(babyId: string): void {
  const legacyDefaultBabyId = useLegacyDefaultBabyIdStore.getState().value;
  if (legacyDefaultBabyId == null || babyId === legacyDefaultBabyId) return;

  const { items, add } = useMilestoneStore.getState();
  const alreadyHasOwn = items.some((m) => m.babyId === babyId);
  if (alreadyHasOwn) return;

  const now = nowIso();
  for (const m of DEFAULT_MILESTONES) {
    add({
      id: generateId(),
      babyId,
      title: m.title,
      category: m.category,
      completed: false,
      isCustom: false,
      createdAt: now,
      updatedAt: now,
    });
  }
}
