import { GUIDE_ACTIVITIES, type GuideActivity } from './activities';
import type { AgeGroupId } from './ageGroups';
import type { GuideCategoryId } from './categories';
import { GUIDES, type Guide } from './guides';

export { AGE_GROUPS, getAgeGroupById, resolveAgeGroupId } from './ageGroups';
export type { AgeGroup, AgeGroupId } from './ageGroups';

export { GUIDE_CATEGORIES, getGuideCategoryById } from './categories';
export type { GuideCategory, GuideCategoryId } from './categories';

export { GUIDES, getGuideById } from './guides';
export type { Guide } from './guides';

export { GUIDE_ACTIVITIES, getGuideActivityById } from './activities';
export type { GuideActivity } from './activities';

export function getGuidesForAgeGroup(ageGroupId: AgeGroupId): Guide[] {
  return GUIDES.filter((g) => g.ageGroups.includes(ageGroupId));
}

export function getGuidesForCategory(categoryId: GuideCategoryId): Guide[] {
  return GUIDES.filter((g) => g.category === categoryId);
}

export function getGuidesForCategoryAndAge(categoryId: GuideCategoryId, ageGroupId: AgeGroupId): Guide[] {
  return GUIDES.filter((g) => g.category === categoryId && g.ageGroups.includes(ageGroupId));
}

export function getActivitiesForAgeGroup(ageGroupId: AgeGroupId): GuideActivity[] {
  return GUIDE_ACTIVITIES.filter((a) => a.ageGroups.includes(ageGroupId));
}

export function getGuidesByIds(ids: string[]): Guide[] {
  return ids.map((id) => GUIDES.find((g) => g.id === id)).filter((g): g is Guide => !!g);
}

export function getActivitiesByIds(ids: string[]): GuideActivity[] {
  return ids.map((id) => GUIDE_ACTIVITIES.find((a) => a.id === id)).filter((a): a is GuideActivity => !!a);
}
