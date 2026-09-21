import { useMilestoneStore } from '../store';
import { generateId, nowIso } from './id';
import type { Milestone, MilestoneCategory } from '../types/models';

const DEFAULT_MILESTONES: { title: string; category: MilestoneCategory }[] = [
  { title: 'First smile', category: 'social' },
  { title: 'Rolled over', category: 'motor' },
  { title: 'Held head up', category: 'motor' },
  { title: 'First laugh', category: 'social' },
  { title: 'Sat independently', category: 'motor' },
  { title: 'First tooth', category: 'other' },
  { title: 'Crawled', category: 'motor' },
  { title: 'Pulled to stand', category: 'motor' },
  { title: 'First word', category: 'communication' },
  { title: 'First steps', category: 'motor' },
  { title: 'Waved bye-bye', category: 'communication' },
  { title: 'Started solid food', category: 'feeding' },
  { title: 'Slept through the night', category: 'sleep' },
  { title: 'Recognized own name', category: 'cognitive' },
];

let seeded = false;

export function seedDefaultMilestones() {
  if (seeded) return;
  seeded = true;
  const { items, setAll } = useMilestoneStore.getState();
  if (items.length > 0) return;

  const now = nowIso();
  const seededItems: Milestone[] = DEFAULT_MILESTONES.map((m) => ({
    id: generateId(),
    title: m.title,
    category: m.category,
    completed: false,
    isCustom: false,
    createdAt: now,
    updatedAt: now,
  }));

  setAll(seededItems);
}
