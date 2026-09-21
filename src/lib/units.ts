import type { HeightUnit, WeightUnit } from '../types/models';

const KG_TO_LB = 2.20462;
const CM_TO_IN = 0.393701;

export function formatWeight(kg: number | undefined, unit: WeightUnit): string {
  if (kg == null) return '';
  const value = unit === 'lb' ? kg * KG_TO_LB : kg;
  return `${Math.round(value * 10) / 10} ${unit}`;
}

export function formatHeight(cm: number | undefined, unit: HeightUnit): string {
  if (cm == null) return '';
  const value = unit === 'in' ? cm * CM_TO_IN : cm;
  return `${Math.round(value * 10) / 10} ${unit}`;
}

export function weightToKg(value: number, unit: WeightUnit): number {
  return unit === 'lb' ? value / KG_TO_LB : value;
}

export function heightToCm(value: number, unit: HeightUnit): number {
  return unit === 'in' ? value / CM_TO_IN : value;
}

export function kgToUnit(kg: number, unit: WeightUnit): number {
  return Math.round((unit === 'lb' ? kg * KG_TO_LB : kg) * 10) / 10;
}

export function cmToUnit(cm: number, unit: HeightUnit): number {
  return Math.round((unit === 'in' ? cm * CM_TO_IN : cm) * 10) / 10;
}

export function kgToDisplay(kg: number | undefined, unit: WeightUnit): string {
  if (kg == null) return '';
  const value = unit === 'lb' ? kg * KG_TO_LB : kg;
  return (Math.round(value * 10) / 10).toString();
}

export function cmToDisplay(cm: number | undefined, unit: HeightUnit): string {
  if (cm == null) return '';
  const value = unit === 'in' ? cm * CM_TO_IN : cm;
  return (Math.round(value * 10) / 10).toString();
}
