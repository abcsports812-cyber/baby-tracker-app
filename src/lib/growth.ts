import type { GrowthRecord, HeightUnit, WeightUnit } from '../types/models';
import { formatHeight, formatWeight } from './units';

export interface LatestGrowthMetric {
  date: string;
  text: string;
}

/** Independently finds the latest record for each growth metric (weight,
 * height, head circumference), ordered weight → height → head. A baby's
 * newest entry might only log height, so picking just the single most
 * recent record (as Home's dashboard used to) can hide an earlier but
 * still-latest weight reading behind "No data" -- this looks at each
 * metric on its own instead. `items` should already be baby-scoped. */
export function selectLatestGrowthMetrics(
  items: GrowthRecord[],
  weightUnit: WeightUnit,
  heightUnit: HeightUnit
): LatestGrowthMetric[] {
  const sorted = [...items].sort((a, b) => b.date.localeCompare(a.date));
  const latestWeight = sorted.find((g) => g.weightKg != null);
  const latestHeight = sorted.find((g) => g.heightCm != null);
  const latestHead = sorted.find((g) => g.headCircumferenceCm != null);

  const metrics: (LatestGrowthMetric | undefined)[] = [
    latestWeight && { date: latestWeight.date, text: formatWeight(latestWeight.weightKg, weightUnit) },
    latestHeight && { date: latestHeight.date, text: formatHeight(latestHeight.heightCm, heightUnit) },
    latestHead && { date: latestHead.date, text: `${formatHeight(latestHead.headCircumferenceCm, heightUnit)} head` },
  ];
  return metrics.filter((m): m is LatestGrowthMetric => !!m);
}

/** Builds a single measurement's display subtitle, e.g. "3.2 kg · 50 cm",
 * from whichever values are present on that record. Returns undefined when
 * the record somehow has no measurement values at all. */
export function growthMeasurementSubtitle(item: GrowthRecord, weightUnit: WeightUnit, heightUnit: HeightUnit): string | undefined {
  const parts = [
    item.weightKg != null ? formatWeight(item.weightKg, weightUnit) : undefined,
    item.heightCm != null ? formatHeight(item.heightCm, heightUnit) : undefined,
    item.headCircumferenceCm != null ? `${formatHeight(item.headCircumferenceCm, heightUnit)} head` : undefined,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(' · ') : undefined;
}
