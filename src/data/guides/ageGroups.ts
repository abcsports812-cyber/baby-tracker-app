import type { AgeBreakdown } from '../../lib/date';

export type AgeGroupId =
  | 'newborn'
  | 'infant3to6'
  | 'infant6to9'
  | 'infant9to12'
  | 'toddler12to18'
  | 'toddler18to24';

export interface AgeGroup {
  id: AgeGroupId;
  label: string;
  shortLabel: string;
  minMonths: number;
}

/** Ordered youngest to oldest — order matters for "current + next stage" UI. */
export const AGE_GROUPS: AgeGroup[] = [
  { id: 'newborn', label: '0–3 months', shortLabel: '0–3m', minMonths: 0 },
  { id: 'infant3to6', label: '3–6 months', shortLabel: '3–6m', minMonths: 3 },
  { id: 'infant6to9', label: '6–9 months', shortLabel: '6–9m', minMonths: 6 },
  { id: 'infant9to12', label: '9–12 months', shortLabel: '9–12m', minMonths: 9 },
  { id: 'toddler12to18', label: '12–18 months', shortLabel: '12–18m', minMonths: 12 },
  { id: 'toddler18to24', label: '18–24 months', shortLabel: '18–24m', minMonths: 18 },
];

export function getAgeGroupById(id: AgeGroupId): AgeGroup {
  const group = AGE_GROUPS.find((g) => g.id === id);
  if (!group) throw new Error(`Unknown age group: ${id}`);
  return group;
}

/**
 * Maps the app's existing calculateAge() output to a Guides age group.
 * Babies past 24 months fall into the oldest catalog stage rather than
 * showing nothing — the catalog's content ceiling, not a new age system.
 */
export function resolveAgeGroupId(age: AgeBreakdown): AgeGroupId {
  const months = age.months;
  if (months < 3) return 'newborn';
  if (months < 6) return 'infant3to6';
  if (months < 9) return 'infant6to9';
  if (months < 12) return 'infant9to12';
  if (months < 18) return 'toddler12to18';
  return 'toddler18to24';
}
