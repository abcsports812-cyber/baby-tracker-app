import { test } from 'node:test';
import assert from 'node:assert/strict';
import { growthMeasurementSubtitle, selectLatestGrowthMetrics } from '../src/lib/growth';
import type { GrowthRecord } from '../src/types/models';

function record(partial: Partial<GrowthRecord> & { id: string; date: string }): GrowthRecord {
  return {
    createdAt: partial.date,
    updatedAt: partial.date,
    ...partial,
  };
}

test('selectLatestGrowthMetrics returns nothing for an empty list', () => {
  assert.deepEqual(selectLatestGrowthMetrics([], 'kg', 'cm'), []);
});

test('selectLatestGrowthMetrics reads all three metrics off a single record', () => {
  const items = [record({ id: '1', date: '2026-01-10', weightKg: 3.2, heightCm: 50, headCircumferenceCm: 35 })];
  const metrics = selectLatestGrowthMetrics(items, 'kg', 'cm');
  assert.deepEqual(
    metrics.map((m) => m.text),
    ['3.2 kg', '50 cm', '35 cm head']
  );
});

// This is the Home Dashboard bug itself: the newest record only has a
// height reading, but an earlier record has the most recent weight -- the
// card must still surface that weight instead of showing "No data".
test('selectLatestGrowthMetrics finds the latest value per metric independently, not just from the newest record', () => {
  const items = [
    record({ id: 'old', date: '2026-01-01', weightKg: 3.0, heightCm: 48 }),
    record({ id: 'new', date: '2026-01-15', heightCm: 52 }), // newest record: height only
  ];
  const metrics = selectLatestGrowthMetrics(items, 'kg', 'cm');
  const weight = metrics.find((m) => m.text.endsWith('kg'));
  const height = metrics.find((m) => m.text.endsWith('cm'));
  assert.ok(weight, 'latest weight should still be found from the older record');
  assert.equal(weight!.date, '2026-01-01');
  assert.equal(height!.date, '2026-01-15');
});

test('selectLatestGrowthMetrics omits metrics that have never been recorded', () => {
  const items = [record({ id: '1', date: '2026-01-10', weightKg: 3.2 })];
  const metrics = selectLatestGrowthMetrics(items, 'kg', 'cm');
  assert.equal(metrics.length, 1);
  assert.equal(metrics[0].text, '3.2 kg');
});

test('selectLatestGrowthMetrics converts units for lb/in settings', () => {
  const items = [record({ id: '1', date: '2026-01-10', weightKg: 3.2, heightCm: 50 })];
  const metrics = selectLatestGrowthMetrics(items, 'lb', 'in');
  assert.equal(metrics[0].text, '7.1 lb');
  assert.equal(metrics[1].text, '19.7 in');
});

test('growthMeasurementSubtitle joins only the present values', () => {
  assert.equal(
    growthMeasurementSubtitle(record({ id: '1', date: '2026-01-10', weightKg: 3.2, heightCm: 50 }), 'kg', 'cm'),
    '3.2 kg · 50 cm'
  );
  assert.equal(
    growthMeasurementSubtitle(record({ id: '2', date: '2026-01-10', heightCm: 50 }), 'kg', 'cm'),
    '50 cm'
  );
  assert.equal(growthMeasurementSubtitle(record({ id: '3', date: '2026-01-10' }), 'kg', 'cm'), undefined);
});
