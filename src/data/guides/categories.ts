import type { CategoryKey } from '../../theme';

export type GuideCategoryId = 'development' | 'play' | 'sleep' | 'feeding' | 'parenting';

export interface GuideCategory {
  id: GuideCategoryId;
  label: string;
  description: string;
  /** Reuses an existing categoryColors token so a category shares its
   * visual identity with the related tracker (e.g. Feeding guides use
   * the same orange as the Feeding tracker) instead of inventing a
   * parallel color system. */
  colorKey: CategoryKey;
}

export const GUIDE_CATEGORIES: GuideCategory[] = [
  {
    id: 'development',
    label: 'Development',
    description: 'How your baby grows, stage by stage',
    colorKey: 'growth',
  },
  {
    id: 'play',
    label: 'Play & Activities',
    description: 'Simple ways to play and explore together',
    colorKey: 'activity',
  },
  {
    id: 'sleep',
    label: 'Sleep',
    description: 'Rest patterns and gentle routines',
    colorKey: 'sleep',
  },
  {
    id: 'feeding',
    label: 'Feeding',
    description: 'Nourishment at every stage',
    colorKey: 'feeding',
  },
  {
    id: 'parenting',
    label: 'Parenting',
    description: 'Support and perspective for you',
    colorKey: 'parenting',
  },
];

export function getGuideCategoryById(id: GuideCategoryId): GuideCategory {
  const category = GUIDE_CATEGORIES.find((c) => c.id === id);
  if (!category) throw new Error(`Unknown guide category: ${id}`);
  return category;
}
