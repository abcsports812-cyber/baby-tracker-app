import type { ToothPosition, ToothType } from '../types/models';

export interface ToothSlot {
  id: string;
  position: ToothPosition;
  type: ToothType;
}

export const TOOTH_POSITIONS: ToothPosition[] = ['upperLeft', 'upperRight', 'lowerLeft', 'lowerRight'];

// Front-to-back order within a quadrant, shared by all four.
const QUADRANT_TYPES: ToothType[] = ['centralIncisor', 'lateralIncisor', 'canine', 'firstMolar', 'secondMolar'];

/** The fixed 20-tooth primary (baby) dentition chart: 4 quadrants x 5
 * teeth. This is a static structural definition, not persisted data —
 * the store only holds a ToothRecord for a slot once the parent has
 * actually set something on it. */
export const TOOTH_CHART: ToothSlot[] = TOOTH_POSITIONS.flatMap((position) =>
  QUADRANT_TYPES.map((type) => ({ id: `${position}-${type}`, position, type }))
);

export const toothPositionLabel: Record<ToothPosition, string> = {
  upperLeft: 'Upper Left',
  upperRight: 'Upper Right',
  lowerLeft: 'Lower Left',
  lowerRight: 'Lower Right',
};

export const toothTypeLabel: Record<ToothType, string> = {
  centralIncisor: 'Central Incisor',
  lateralIncisor: 'Lateral Incisor',
  canine: 'Canine',
  firstMolar: 'First Molar',
  secondMolar: 'Second Molar',
};

export const toothTypeShortLabel: Record<ToothType, string> = {
  centralIncisor: 'CI',
  lateralIncisor: 'LI',
  canine: 'C',
  firstMolar: 'M1',
  secondMolar: 'M2',
};

export function toothSlotLabel(slot: Pick<ToothSlot, 'position' | 'type'>): string {
  return `${toothPositionLabel[slot.position]} · ${toothTypeLabel[slot.type]}`;
}
